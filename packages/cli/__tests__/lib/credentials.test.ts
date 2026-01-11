/**
 * Credential Storage Module Tests
 *
 * Tests for secure credential storage and retrieval:
 * - File creation with correct permissions
 * - Atomic writes via temp file
 * - Corrupt/missing file handling
 * - Token expiry checking
 * - Environment variable override
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import * as credentials from "../../src/lib/credentials";

// Test directory setup - use unique ID per test run
let TEST_DIR: string;
let FAKE_HOME: string;
let FAKE_CONFIG: string;

// Store original env vars
const originalHome = process.env.HOME;
const originalXdgConfig = process.env.XDG_CONFIG_HOME;
const originalJfpToken = process.env.JFP_TOKEN;

beforeEach(() => {
  // Create unique test directory for each test
  TEST_DIR = join(tmpdir(), "jfp-credentials-test-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  FAKE_HOME = join(TEST_DIR, "home");
  FAKE_CONFIG = join(FAKE_HOME, ".config");

  // Create fresh test directories
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(FAKE_HOME, { recursive: true });

  // Set env vars for testing
  process.env.HOME = FAKE_HOME;
  delete process.env.XDG_CONFIG_HOME;
  delete process.env.JFP_TOKEN;
});

afterEach(() => {
  // Restore env vars
  process.env.HOME = originalHome;
  if (originalXdgConfig) {
    process.env.XDG_CONFIG_HOME = originalXdgConfig;
  } else {
    delete process.env.XDG_CONFIG_HOME;
  }
  if (originalJfpToken) {
    process.env.JFP_TOKEN = originalJfpToken;
  } else {
    delete process.env.JFP_TOKEN;
  }

  // Cleanup test directory
  rmSync(TEST_DIR, { recursive: true, force: true });
});

const validCredentials: import("../../src/lib/credentials").Credentials = {
  access_token: "test-access-token-12345",
  refresh_token: "test-refresh-token-67890",
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  email: "test@example.com",
  tier: "premium",
  user_id: "user-123",
};

describe("loadCredentials", () => {
  it("returns null when credentials file does not exist", async () => {
    const result = await credentials.loadCredentials();
    expect(result).toBeNull();
  });

  it("returns null for corrupt JSON file", async () => {
    const credPath = join(FAKE_CONFIG, "jfp", "credentials.json");
    mkdirSync(join(FAKE_CONFIG, "jfp"), { recursive: true });
    writeFileSync(credPath, "not valid json {{{");

    const result = await credentials.loadCredentials();
    expect(result).toBeNull();
  });

  it("returns null for empty file", async () => {
    const credPath = join(FAKE_CONFIG, "jfp", "credentials.json");
    mkdirSync(join(FAKE_CONFIG, "jfp"), { recursive: true });
    writeFileSync(credPath, "");

    const result = await credentials.loadCredentials();
    expect(result).toBeNull();
  });

  it("returns null when access_token is missing", async () => {
    const credPath = join(FAKE_CONFIG, "jfp", "credentials.json");
    mkdirSync(join(FAKE_CONFIG, "jfp"), { recursive: true });
    writeFileSync(credPath, JSON.stringify({ email: "test@example.com" }));

    const result = await credentials.loadCredentials();
    expect(result).toBeNull();
  });

  it("returns null when email is missing", async () => {
    const credPath = join(FAKE_CONFIG, "jfp", "credentials.json");
    mkdirSync(join(FAKE_CONFIG, "jfp"), { recursive: true });
    writeFileSync(credPath, JSON.stringify({ access_token: "token" }));

    const result = await credentials.loadCredentials();
    expect(result).toBeNull();
  });

  it("loads valid credentials from file", async () => {
    const credPath = join(FAKE_CONFIG, "jfp", "credentials.json");
    mkdirSync(join(FAKE_CONFIG, "jfp"), { recursive: true });
    writeFileSync(credPath, JSON.stringify(validCredentials));

    const result = await credentials.loadCredentials();
    expect(result).not.toBeNull();
    expect(result!.access_token).toBe(validCredentials.access_token);
    expect(result!.email).toBe(validCredentials.email);
    expect(result!.tier).toBe(validCredentials.tier);
  });
});

describe("saveCredentials", () => {
  it("creates config directory if it does not exist", async () => {
    await credentials.saveCredentials(validCredentials);

    const credPath = join(FAKE_CONFIG, "jfp", "credentials.json");
    expect(existsSync(credPath)).toBe(true);
  });

  it("saves credentials as valid JSON", async () => {
    await credentials.saveCredentials(validCredentials);

    const credPath = join(FAKE_CONFIG, "jfp", "credentials.json");
    const content = readFileSync(credPath, "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.access_token).toBe(validCredentials.access_token);
    expect(parsed.email).toBe(validCredentials.email);
  });

  it("file is readable after save", async () => {
    await credentials.saveCredentials(validCredentials);
    const result = await credentials.loadCredentials();

    expect(result).not.toBeNull();
    expect(result!.access_token).toBe(validCredentials.access_token);
  });

  it("overwrites existing credentials", async () => {
    await credentials.saveCredentials(validCredentials);

    const newCreds = {
      ...validCredentials,
      email: "new@example.com",
      access_token: "new-token",
    };
    await credentials.saveCredentials(newCreds);

    const result = await credentials.loadCredentials();
    expect(result!.email).toBe("new@example.com");
    expect(result!.access_token).toBe("new-token");
  });

  // Skip permission tests on Windows
  const isWindows = process.platform === "win32";
  const itUnix = isWindows ? it.skip : it;

  itUnix("creates file with 0o600 permissions (Unix only)", async () => {
    await credentials.saveCredentials(validCredentials);

    const credPath = join(FAKE_CONFIG, "jfp", "credentials.json");
    const stats = statSync(credPath);
    const mode = stats.mode & 0o777;

    expect(mode).toBe(0o600);
  });

  itUnix("creates directory with 0o700 permissions (Unix only)", async () => {
    await credentials.saveCredentials(validCredentials);

    const configDir = join(FAKE_CONFIG, "jfp");
    const stats = statSync(configDir);
    const mode = stats.mode & 0o777;

    expect(mode).toBe(0o700);
  });
});

describe("clearCredentials", () => {
  it("removes credentials file", async () => {
    await credentials.saveCredentials(validCredentials);

    const credPath = join(FAKE_CONFIG, "jfp", "credentials.json");
    expect(existsSync(credPath)).toBe(true);

    await credentials.clearCredentials();
    expect(existsSync(credPath)).toBe(false);
  });

  it("does not throw when file does not exist", async () => {
    // Should not throw
    await credentials.clearCredentials();
    expect(true).toBe(true);
  });
});

describe("isExpired", () => {
  it("returns false for non-expired token", () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const creds = { ...validCredentials, expires_at: futureDate.toISOString() };

    expect(credentials.isExpired(creds)).toBe(false);
  });

  it("returns true for expired token", () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const creds = { ...validCredentials, expires_at: pastDate.toISOString() };

    expect(credentials.isExpired(creds)).toBe(true);
  });

  it("returns true for token expiring within 5 minute buffer", () => {
    const nearFuture = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    const creds = { ...validCredentials, expires_at: nearFuture.toISOString() };

    // Within 5-minute buffer, so should be considered expired
    expect(credentials.isExpired(creds)).toBe(true);
  });

  it("returns false when expires_at is not set", () => {
    const creds = { ...validCredentials, expires_at: "" };

    // No expiry = never expires
    expect(credentials.isExpired(creds)).toBe(false);
  });
});

describe("getAccessToken", () => {
  it("returns null when not logged in", async () => {
    const token = await credentials.getAccessToken();
    expect(token).toBeNull();
  });

  it("returns token from saved credentials", async () => {
    await credentials.saveCredentials(validCredentials);

    const token = await credentials.getAccessToken();
    expect(token).toBe(validCredentials.access_token);
  });

  it("returns null for expired credentials", async () => {
    const expiredCreds = {
      ...validCredentials,
      expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    };
    await credentials.saveCredentials(expiredCreds);

    const token = await credentials.getAccessToken();
    expect(token).toBeNull();
  });

  it("returns JFP_TOKEN env var when set", async () => {
    process.env.JFP_TOKEN = "env-token-override";

    const token = await credentials.getAccessToken();
    expect(token).toBe("env-token-override");
  });

  it("JFP_TOKEN takes precedence over saved credentials", async () => {
    await credentials.saveCredentials(validCredentials);
    process.env.JFP_TOKEN = "env-token-override";

    const token = await credentials.getAccessToken();
    expect(token).toBe("env-token-override");
  });
});

describe("isLoggedIn", () => {
  it("returns false when not logged in", async () => {
    const result = await credentials.isLoggedIn();
    expect(result).toBe(false);
  });

  it("returns true when logged in with valid credentials", async () => {
    await credentials.saveCredentials(validCredentials);

    const result = await credentials.isLoggedIn();
    expect(result).toBe(true);
  });

  it("returns false when credentials are expired", async () => {
    const expiredCreds = {
      ...validCredentials,
      expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    };
    await credentials.saveCredentials(expiredCreds);

    const result = await credentials.isLoggedIn();
    expect(result).toBe(false);
  });

  it("returns true when JFP_TOKEN is set", async () => {
    process.env.JFP_TOKEN = "env-token";

    const result = await credentials.isLoggedIn();
    expect(result).toBe(true);
  });
});

describe("getCurrentUser", () => {
  it("returns null when not logged in", async () => {
    const user = await credentials.getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns user info when logged in", async () => {
    await credentials.saveCredentials(validCredentials);

    const user = await credentials.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user!.email).toBe(validCredentials.email);
    expect(user!.tier).toBe(validCredentials.tier);
    expect(user!.userId).toBe(validCredentials.user_id);
  });

  it("returns null when credentials are expired", async () => {
    const expiredCreds = {
      ...validCredentials,
      expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    };
    await credentials.saveCredentials(expiredCreds);

    const user = await credentials.getCurrentUser();
    expect(user).toBeNull();
  });
});

describe("XDG_CONFIG_HOME", () => {
  it("uses XDG_CONFIG_HOME when set", async () => {
    const customConfig = join(TEST_DIR, "custom-config");
    process.env.XDG_CONFIG_HOME = customConfig;

    // Module reads XDG_CONFIG_HOME on each call
    await credentials.saveCredentials(validCredentials);

    const credPath = join(customConfig, "jfp", "credentials.json");
    expect(existsSync(credPath)).toBe(true);
  });

  it("getCredentialsPath returns correct path with XDG_CONFIG_HOME", () => {
    const customConfig = join(TEST_DIR, "custom-xdg");
    process.env.XDG_CONFIG_HOME = customConfig;

    const path = credentials.getCredentialsPath();
    expect(path).toBe(join(customConfig, "jfp", "credentials.json"));
  });

  it("getCredentialsPath uses HOME/.config without XDG_CONFIG_HOME", () => {
    delete process.env.XDG_CONFIG_HOME;

    const path = credentials.getCredentialsPath();
    expect(path).toBe(join(FAKE_HOME, ".config", "jfp", "credentials.json"));
  });
});
