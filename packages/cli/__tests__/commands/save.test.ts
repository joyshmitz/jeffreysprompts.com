/**
 * Save Command Tests
 *
 * Tests for saving prompts to user's premium account:
 * - Prompt validation (must exist in registry)
 * - Authentication checks
 * - Premium tier requirements
 * - API error handling
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

// Setup for each test
function setupTest() {
  TEST_DIR = join(tmpdir(), "jfp-save-test-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  FAKE_HOME = join(TEST_DIR, "home");
  FAKE_CONFIG = join(FAKE_HOME, ".config");

  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(FAKE_HOME, { recursive: true });

  process.env.HOME = FAKE_HOME;
  delete process.env.XDG_CONFIG_HOME;
  delete process.env.JFP_TOKEN;
  process.env.JFP_PREMIUM_API_URL = "https://test-api.example.com/api";

  consoleOutput = [];
  console.log = (...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(" "));
  };
  console.error = (...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(" "));
  };
}

function cleanupTest() {
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  Object.assign(process.env, originalEnv);

  console.log = originalLog;
  console.error = originalError;
  globalThis.fetch = originalFetch;
  process.exit = originalExit;

  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

function createCredentialsFile(options: { tier?: string; expired?: boolean } = {}) {
  const credDir = join(FAKE_CONFIG, "jfp");
  mkdirSync(credDir, { recursive: true });

  const expiresAt = options.expired
    ? new Date(Date.now() - 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const creds = {
    access_token: "test-token-12345",
    refresh_token: "refresh-token-67890",
    expires_at: expiresAt,
    email: "test@example.com",
    tier: options.tier ?? "premium",
    user_id: "user-123",
  };

  writeFileSync(join(credDir, "credentials.json"), JSON.stringify(creds, null, 2));
  return creds;
}

describe("saveCommand - prompt validation", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("returns not_found for non-existent prompt", async () => {
    const { saveCommand } = await import("../../src/commands/save");

    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error("EXIT_" + code);
    }) as never;

    try {
      await saveCommand("nonexistent-prompt-xyz", { json: true });
    } catch (e) {
      // Expected
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("not_found");
    expect(exitCode).toBe(1);
  });
});

describe("saveCommand - authentication checks", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("returns not_authenticated when not logged in", async () => {
    const { saveCommand } = await import("../../src/commands/save");

    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error("EXIT_" + code);
    }) as never;

    try {
      await saveCommand("idea-wizard", { json: true });
    } catch (e) {
      // Expected
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("not_authenticated");
    expect(parsed.hint).toContain("jfp login");
    expect(exitCode).toBe(1);
  });
});

describe("saveCommand - tier checks", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("returns requires_premium for free tier users", async () => {
    createCredentialsFile({ tier: "free" });
    const { saveCommand } = await import("../../src/commands/save");

    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error("EXIT_" + code);
    }) as never;

    try {
      await saveCommand("idea-wizard", { json: true });
    } catch (e) {
      // Expected
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("requires_premium");
    expect(parsed.tier).toBe("free");
    expect(exitCode).toBe(1);
  });
});

describe("saveCommand - API integration", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("saves prompt successfully", async () => {
    createCredentialsFile({ tier: "premium" });
    const { saveCommand } = await import("../../src/commands/save");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            saved: true,
            prompt_id: "idea-wizard",
            title: "The Idea Wizard",
            saved_at: "2026-01-11T01:00:00Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await saveCommand("idea-wizard", { json: true });

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.saved).toBe(true);
    expect(parsed.prompt_id).toBe("idea-wizard");
  });

  it("handles already saved prompt", async () => {
    createCredentialsFile({ tier: "premium" });
    const { saveCommand } = await import("../../src/commands/save");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "already_saved", code: "already_saved" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await saveCommand("idea-wizard", { json: true });

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.already_saved).toBe(true);
    // Should not exit with error
  });

  it("handles 401 auth error from API", async () => {
    createCredentialsFile({ tier: "premium" });
    const { saveCommand } = await import("../../src/commands/save");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error("EXIT_" + code);
    }) as never;

    try {
      await saveCommand("idea-wizard", { json: true });
    } catch (e) {
      // Expected
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("session_expired");
    expect(exitCode).toBe(1);
  });

  it("handles 403 permission error from API", async () => {
    createCredentialsFile({ tier: "premium" });
    const { saveCommand } = await import("../../src/commands/save");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error("EXIT_" + code);
    }) as never;

    try {
      await saveCommand("idea-wizard", { json: true });
    } catch (e) {
      // Expected
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("requires_premium");
    expect(exitCode).toBe(1);
  });

  it("handles network error", async () => {
    createCredentialsFile({ tier: "premium" });
    const { saveCommand } = await import("../../src/commands/save");

    globalThis.fetch = mock(() => Promise.reject(new Error("Network unreachable")));

    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error("EXIT_" + code);
    }) as never;

    try {
      await saveCommand("idea-wizard", { json: true });
    } catch (e) {
      // Expected
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe(true);
    expect(parsed.code).toBe("save_failed");
    expect(exitCode).toBe(1);
  });
});
