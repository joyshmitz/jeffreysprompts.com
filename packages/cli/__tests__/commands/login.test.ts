/**
 * Login Command Tests
 *
 * Tests for authentication flows:
 * - Already logged in handling
 * - Device code flow initiation and error handling
 */
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Test directory setup
let TEST_DIR: string;
let FAKE_HOME: string;
let FAKE_CONFIG: string;

// Store original env vars
const originalEnv = { ...process.env };

// Store original console methods and fetch
const originalLog = console.log;
const originalError = console.error;
const originalFetch = globalThis.fetch;
const originalExit = process.exit;

// Capture console output
let consoleOutput: string[] = [];

// Helper to create valid credentials file
function createCredentialsFile(options: { email?: string } = {}) {
  const credDir = join(FAKE_CONFIG, "jfp");
  mkdirSync(credDir, { recursive: true });

  const creds = {
    access_token: "test-token-12345",
    refresh_token: "refresh-token-67890",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    email: options.email ?? "test@example.com",
    tier: "premium",
    user_id: "user-123",
  };

  writeFileSync(join(credDir, "credentials.json"), JSON.stringify(creds, null, 2));
  return creds;
}

// Setup for each test
function setupTest() {
  // Create unique test directory for each test
  TEST_DIR = join(tmpdir(), "jfp-login-test-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  FAKE_HOME = join(TEST_DIR, "home");
  FAKE_CONFIG = join(FAKE_HOME, ".config");

  // Create fresh test directories
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(FAKE_HOME, { recursive: true });

  // Set env vars for testing
  process.env.HOME = FAKE_HOME;
  delete process.env.XDG_CONFIG_HOME;
  delete process.env.JFP_TOKEN;
  delete process.env.SSH_CLIENT;
  delete process.env.SSH_TTY;
  process.env.DISPLAY = ":0"; // Simulate display available
  process.env.JFP_PREMIUM_URL = "https://test-premium.example.com";

  // Capture console output
  consoleOutput = [];
  console.log = (...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(" "));
  };
  console.error = (...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(" "));
  };
}

// Cleanup for each test
function cleanupTest() {
  // Restore env vars
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  Object.assign(process.env, originalEnv);

  // Restore console and fetch
  console.log = originalLog;
  console.error = originalError;
  globalThis.fetch = originalFetch;
  process.exit = originalExit;

  // Cleanup test directory
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe("loginCommand - already logged in", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("shows already logged in when credentials exist (JSON)", async () => {
    createCredentialsFile({ email: "existing@example.com" });
    const { loginCommand } = await import("../../src/commands/login");

    await loginCommand({ json: true });

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("already_logged_in");
    expect(parsed.email).toBe("existing@example.com");
  });

  it("shows already logged in message (JSON in non-TTY)", async () => {
    createCredentialsFile({ email: "existing@example.com" });
    const { loginCommand } = await import("../../src/commands/login");

    await loginCommand({});

    // In non-TTY environments, outputs JSON
    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);
    expect(parsed.code || parsed.error).toBe("already_logged_in");
    expect(parsed.email).toBe("existing@example.com");
  });
});

describe("Device Code Flow - network error", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("handles network error during device code request", async () => {
    const { loginCommand } = await import("../../src/commands/login");

    globalThis.fetch = mock(() => Promise.reject(new Error("Network unreachable")));

    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error("EXIT_" + code);
    }) as never;

    try {
      await loginCommand({ remote: true, json: true });
    } catch (e) {
      // Expected
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("network_error");
    expect(exitCode).toBe(1);
  });
});

describe("Device Code Flow - server error", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("handles failed device code response", async () => {
    const { loginCommand } = await import("../../src/commands/login");

    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Internal Server Error", { status: 500 }))
    );

    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error("EXIT_" + code);
    }) as never;

    try {
      await loginCommand({ remote: true, json: true });
    } catch (e) {
      // Expected
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("device_code_failed");
    expect(exitCode).toBe(1);
  });
});

describe("Device Code Flow - displays verification info", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("shows verification URL and formatted user code", async () => {
    const { loginCommand } = await import("../../src/commands/login");

    // Mock: first call returns device code, second call returns timeout to exit loop
    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              device_code: "device-abc123",
              user_code: "TEST1234",
              verification_url: "https://test-premium.example.com/cli/verify",
              expires_in: 900,
              interval: 1,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      // Return success on second call to avoid timeout
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: "token",
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            email: "test@example.com",
            tier: "premium",
            user_id: "user-123",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });

    await loginCommand({ remote: true, json: true, timeout: 30000 });

    const output = consoleOutput.join("\n");
    expect(output).toContain("verification_url");
    expect(output).toContain("TEST-1234"); // Formatted with hyphen
  });
});

describe("User code formatting", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("formats 8-character codes with hyphen", async () => {
    const { loginCommand } = await import("../../src/commands/login");

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              device_code: "device-abc123",
              user_code: "ABCD5678",
              verification_url: "https://test.example.com/verify",
              expires_in: 900,
              interval: 1,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: "token",
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            email: "test@example.com",
            tier: "premium",
            user_id: "user-123",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });

    await loginCommand({ remote: true, json: true, timeout: 30000 });

    const output = consoleOutput.join("\n");
    expect(output).toContain("ABCD-5678");
  });

  it("preserves codes that already have hyphen", async () => {
    const { loginCommand } = await import("../../src/commands/login");

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              device_code: "device-abc123",
              user_code: "ABC-DEF",
              verification_url: "https://test.example.com/verify",
              expires_in: 900,
              interval: 1,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: "token",
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            email: "test@example.com",
            tier: "premium",
            user_id: "user-123",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });

    await loginCommand({ remote: true, json: true, timeout: 30000 });

    const output = consoleOutput.join("\n");
    expect(output).toContain("ABC-DEF");
  });
});
