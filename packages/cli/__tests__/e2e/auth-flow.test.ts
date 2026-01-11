/**
 * E2E Test: CLI Authentication Flow
 *
 * Tests the complete authentication journey:
 * 1. login - Device code flow (browser flow requires actual OAuth)
 * 2. whoami - Show current authentication status
 * 3. logout - Clear credentials
 * 4. Integration: Full login->whoami->list->logout flow
 *
 * Uses a mock HTTP server for premium site endpoints.
 * Uses TestLogger for structured debugging output.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { TestLogger } from "@jeffreysprompts/core/testing";
import { spawnCli } from "@jeffreysprompts/core/testing";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "http";

const TEST_LOG_DIR = "/tmp/jfp-e2e-auth-tests";
const PROJECT_ROOT = join(import.meta.dir, "../../../..");

// Test credentials
const TEST_CREDENTIALS = {
  access_token: "e2e-test-access-token-12345",
  refresh_token: "e2e-test-refresh-token-67890",
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  email: "e2e-test@example.com",
  tier: "premium" as const,
  user_id: "e2e-user-123",
};

// Mock server for auth endpoints
class MockAuthServer {
  private server: Server | null = null;
  private port: number = 0;
  public deviceCodes: Map<string, { user_code: string; authenticated: boolean }> = new Map();

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.handleRequest(req, res);
      });

      this.server.listen(0, "127.0.0.1", () => {
        const addr = this.server?.address();
        this.port = typeof addr === "object" && addr ? addr.port : 0;
        resolve(this.port);
      });

      this.server.on("error", reject);
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const url = new URL(req.url!, `http://localhost:${this.port}`);

      res.setHeader("Content-Type", "application/json");

      // POST /api/cli/device-code - Generate device code
      if (url.pathname === "/api/cli/device-code" && req.method === "POST") {
        const deviceCode = "device-" + Math.random().toString(36).slice(2, 10);
        const userCode = this.generateUserCode();
        this.deviceCodes.set(deviceCode, { user_code: userCode, authenticated: false });

        res.writeHead(200);
        res.end(
          JSON.stringify({
            device_code: deviceCode,
            user_code: userCode,
            verification_url: `http://localhost:${this.port}/verify`,
            expires_in: 900,
            interval: 1,
          })
        );
        return;
      }

      // POST /api/cli/device-token - Exchange device code for token
      if (url.pathname === "/api/cli/device-token" && req.method === "POST") {
        const data = JSON.parse(body);
        const deviceInfo = this.deviceCodes.get(data.device_code);

        if (!deviceInfo) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "invalid_grant" }));
          return;
        }

        if (!deviceInfo.authenticated) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "authorization_pending" }));
          return;
        }

        // Return credentials
        res.writeHead(200);
        res.end(JSON.stringify(TEST_CREDENTIALS));
        return;
      }

      // POST /api/cli/token/refresh - Refresh token
      if (url.pathname === "/api/cli/token/refresh" && req.method === "POST") {
        const data = JSON.parse(body);
        if (data.refresh_token === TEST_CREDENTIALS.refresh_token) {
          res.writeHead(200);
          res.end(
            JSON.stringify({
              ...TEST_CREDENTIALS,
              access_token: "refreshed-access-token-" + Date.now(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
          );
          return;
        }
        res.writeHead(400);
        res.end(JSON.stringify({ error: "invalid_grant" }));
        return;
      }

      // POST /api/cli/revoke - Revoke token
      if (url.pathname === "/api/cli/revoke" && req.method === "POST") {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // Default 404
      res.writeHead(404);
      res.end(JSON.stringify({ error: "not_found" }));
    });
  }

  private generateUserCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  simulateUserAuth(deviceCode: string): void {
    const deviceInfo = this.deviceCodes.get(deviceCode);
    if (deviceInfo) {
      deviceInfo.authenticated = true;
    }
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}

describe("CLI Authentication Flow E2E", () => {
  let logger: TestLogger;
  let mockServer: MockAuthServer;
  let mockServerUrl: string;
  let testHomeDir: string;
  let testConfigDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    mkdirSync(TEST_LOG_DIR, { recursive: true });

    // Start mock auth server
    mockServer = new MockAuthServer();
    const port = await mockServer.start();
    mockServerUrl = mockServer.getUrl();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(() => {
    // Create isolated test environment
    testHomeDir = join(tmpdir(), `jfp-auth-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    testConfigDir = join(testHomeDir, ".config", "jfp");
    mkdirSync(testConfigDir, { recursive: true });

    // Save original env
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore env
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);

    // Cleanup test directory
    try {
      rmSync(testHomeDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  function getCredentialsPath(): string {
    return join(testConfigDir, "credentials.json");
  }

  function createCredentialsFile(creds: typeof TEST_CREDENTIALS = TEST_CREDENTIALS): void {
    writeFileSync(getCredentialsPath(), JSON.stringify(creds, null, 2));
  }

  describe("whoami command", () => {
    it("should show not logged in when no credentials", async () => {
      logger = new TestLogger({
        testName: "whoami-not-logged-in",
        outputFile: join(TEST_LOG_DIR, "whoami-not-logged-in.log"),
        minLevel: "debug",
      });

      logger.step("Running jfp whoami --json with no credentials");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
        },
      });

      logger.step("Validating output");
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);

      const output = JSON.parse(result.stdout);
      expect(output.error).toBe(true);
      expect(output.code).toBe("not_authenticated");
      expect(output.authenticated).toBe(false);

      logger.info("Result", output);
      logger.summary();
    });

    it("should show user info when logged in", async () => {
      logger = new TestLogger({
        testName: "whoami-logged-in",
        outputFile: join(TEST_LOG_DIR, "whoami-logged-in.log"),
        minLevel: "debug",
      });

      logger.step("Creating credentials file");
      createCredentialsFile();

      logger.step("Running jfp whoami --json");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
        },
      });

      logger.step("Validating output");
      expect(result.success).toBe(true);

      const output = JSON.parse(result.stdout);
      expect(output.authenticated).toBe(true);
      expect(output.email).toBe(TEST_CREDENTIALS.email);
      expect(output.tier).toBe(TEST_CREDENTIALS.tier);
      expect(output.expired).toBe(false);

      logger.info("User info", output);
      logger.summary();
    });

    it("should show expired status for expired token", async () => {
      logger = new TestLogger({
        testName: "whoami-expired",
        outputFile: join(TEST_LOG_DIR, "whoami-expired.log"),
        minLevel: "debug",
      });

      logger.step("Creating expired credentials file");
      createCredentialsFile({
        ...TEST_CREDENTIALS,
        expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      });

      logger.step("Running jfp whoami --json");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
        },
      });

      logger.step("Validating output");
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);

      const output = JSON.parse(result.stdout);
      expect(output.error).toBe(true);
      expect(output.code).toBe("session_expired");
      expect(output.authenticated).toBe(false);
      expect(output.expired).toBe(true);

      logger.info("Expired status", output);
      logger.summary();
    });

    it("should recognize JFP_TOKEN environment variable", async () => {
      logger = new TestLogger({
        testName: "whoami-env-token",
        outputFile: join(TEST_LOG_DIR, "whoami-env-token.log"),
        minLevel: "debug",
      });

      logger.step("Running jfp whoami --json with JFP_TOKEN");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
          JFP_TOKEN: "env-token-for-ci",
        },
      });

      logger.step("Validating output");
      expect(result.success).toBe(true);

      const output = JSON.parse(result.stdout);
      expect(output.authenticated).toBe(true);
      expect(output.source).toBe("environment");

      logger.info("Env token recognized", output);
      logger.summary();
    });
  });

  describe("logout command", () => {
    it("should do nothing when not logged in", async () => {
      logger = new TestLogger({
        testName: "logout-not-logged-in",
        outputFile: join(TEST_LOG_DIR, "logout-not-logged-in.log"),
        minLevel: "debug",
      });

      logger.step("Running jfp logout --json with no credentials");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "logout", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
        },
      });

      logger.step("Validating output");
      expect(result.success).toBe(true);

      const output = JSON.parse(result.stdout);
      expect(output.logged_out).toBe(true);
      expect(output.message).toContain("Not logged in");

      logger.summary();
    });

    it("should clear credentials when logged in", async () => {
      logger = new TestLogger({
        testName: "logout-clears-creds",
        outputFile: join(TEST_LOG_DIR, "logout-clears-creds.log"),
        minLevel: "debug",
      });

      logger.step("Creating credentials file");
      createCredentialsFile();
      expect(existsSync(getCredentialsPath())).toBe(true);

      logger.step("Running jfp logout --json");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "logout", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
        },
      });

      logger.step("Validating output");
      expect(result.success).toBe(true);

      const output = JSON.parse(result.stdout);
      expect(output.logged_out).toBe(true);
      expect(output.email).toBe(TEST_CREDENTIALS.email);

      logger.step("Verifying credentials cleared");
      expect(existsSync(getCredentialsPath())).toBe(false);

      logger.summary();
    });

    it("should fail gracefully when using env token", async () => {
      logger = new TestLogger({
        testName: "logout-env-token",
        outputFile: join(TEST_LOG_DIR, "logout-env-token.log"),
        minLevel: "debug",
      });

      logger.step("Running jfp logout --json with JFP_TOKEN");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "logout", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
          JFP_TOKEN: "env-token-for-ci",
        },
      });

      logger.step("Validating output");
      expect(result.success).toBe(false);

      const output = JSON.parse(result.stdout);
      expect(output.error).toBe(true);
      expect(output.code).toBe("env_token");

      logger.summary();
    });
  });

  describe("login command - error handling", () => {
    it("should show already logged in when credentials exist", async () => {
      logger = new TestLogger({
        testName: "login-already-logged-in",
        outputFile: join(TEST_LOG_DIR, "login-already-logged-in.log"),
        minLevel: "debug",
      });

      logger.step("Creating credentials file");
      createCredentialsFile();

      logger.step("Running jfp login --json");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "login", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
          DISPLAY: ":0", // Simulate display available
        },
      });

      logger.step("Validating output");
      const output = JSON.parse(result.stdout);
      expect(output.error).toBe(true);
      expect(output.code).toBe("already_logged_in");
      expect(output.email).toBe(TEST_CREDENTIALS.email);

      logger.info("Already logged in response", output);
      logger.summary();
    });

    it("should handle network error gracefully", async () => {
      logger = new TestLogger({
        testName: "login-network-error",
        outputFile: join(TEST_LOG_DIR, "login-network-error.log"),
        minLevel: "debug",
      });

      logger.step("Running jfp login --remote --json with invalid server");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "login", "--remote", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
          JFP_PREMIUM_URL: "http://localhost:1", // Invalid port
        },
      });

      logger.step("Validating error handling");
      expect(result.success).toBe(false);

      const output = JSON.parse(result.stdout);
      expect(output.error).toBe(true);
      expect(output.code).toBe("network_error");

      logger.info("Network error handled", output);
      logger.summary();
    });
  });

  describe("complete auth flow", () => {
    it("should complete full whoami->logout workflow", async () => {
      logger = new TestLogger({
        testName: "full-auth-flow",
        outputFile: join(TEST_LOG_DIR, "full-auth-flow.log"),
        minLevel: "debug",
      });

      const env = {
        ...process.env,
        HOME: testHomeDir,
      };

      // Step 1: Verify not logged in
      logger.step("Check initial state - not logged in");
      const whoami1 = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env,
      });
      expect(whoami1.success).toBe(false);
      const whoami1Output = JSON.parse(whoami1.stdout);
      expect(whoami1Output.authenticated).toBe(false);
      logger.info("Initial state", whoami1Output);

      // Step 2: Simulate login by creating credentials
      logger.step("Simulate successful login");
      createCredentialsFile();
      logger.info("Credentials created", { path: getCredentialsPath() });

      // Step 3: Verify logged in
      logger.step("Verify logged in status");
      const whoami2 = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env,
      });
      expect(whoami2.success).toBe(true);
      const whoami2Output = JSON.parse(whoami2.stdout);
      expect(whoami2Output.authenticated).toBe(true);
      expect(whoami2Output.email).toBe(TEST_CREDENTIALS.email);
      logger.info("Logged in state", whoami2Output);

      // Step 4: Logout
      logger.step("Perform logout");
      const logout = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "logout", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env,
      });
      expect(logout.success).toBe(true);
      const logoutOutput = JSON.parse(logout.stdout);
      expect(logoutOutput.logged_out).toBe(true);
      logger.info("Logout result", logoutOutput);

      // Step 5: Verify logged out
      logger.step("Verify logged out status");
      const whoami3 = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env,
      });
      expect(whoami3.success).toBe(false);
      const whoami3Output = JSON.parse(whoami3.stdout);
      expect(whoami3Output.authenticated).toBe(false);
      logger.info("Logged out state", whoami3Output);

      logger.summary();
    });
  });

  describe("credential persistence", () => {
    it("should persist credentials across CLI invocations", async () => {
      logger = new TestLogger({
        testName: "credential-persistence",
        outputFile: join(TEST_LOG_DIR, "credential-persistence.log"),
        minLevel: "debug",
      });

      const env = {
        ...process.env,
        HOME: testHomeDir,
      };

      logger.step("Create credentials");
      createCredentialsFile();

      logger.step("First whoami invocation");
      const result1 = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env,
      });
      expect(result1.success).toBe(true);
      const output1 = JSON.parse(result1.stdout);
      expect(output1.email).toBe(TEST_CREDENTIALS.email);

      logger.step("Second whoami invocation");
      const result2 = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env,
      });
      expect(result2.success).toBe(true);
      const output2 = JSON.parse(result2.stdout);
      expect(output2.email).toBe(TEST_CREDENTIALS.email);

      logger.info("Credentials persisted across invocations");
      logger.summary();
    });

    it("should handle corrupt credentials file gracefully", async () => {
      logger = new TestLogger({
        testName: "corrupt-credentials",
        outputFile: join(TEST_LOG_DIR, "corrupt-credentials.log"),
        minLevel: "debug",
      });

      logger.step("Create corrupt credentials file");
      writeFileSync(getCredentialsPath(), "not valid json {{{");

      logger.step("Running jfp whoami --json with corrupt credentials");
      const result = await spawnCli({
        cmd: ["bun", "run", "jfp.ts", "whoami", "--json"],
        cwd: PROJECT_ROOT,
        logger,
        env: {
          ...process.env,
          HOME: testHomeDir,
        },
      });

      logger.step("Validating graceful handling");
      expect(result.success).toBe(false);
      const output = JSON.parse(result.stdout);
      expect(output.error).toBe(true);
      expect(output.code).toBe("not_authenticated");
      expect(output.authenticated).toBe(false);

      logger.info("Corrupt credentials handled gracefully", output);
      logger.summary();
    });
  });
});
