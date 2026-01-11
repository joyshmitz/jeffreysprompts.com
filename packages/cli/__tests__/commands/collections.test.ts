/**
 * Collections Command Unit Tests
 *
 * Tests for the collections command:
 * - jfp collections: List all user collections
 * - jfp collections <name>: Show prompts in a collection
 * - jfp collections <name> --add <prompt-id>: Add prompt to collection
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
let exitCode: number | undefined;

function createCredentialsFile(options: {
  email?: string;
  tier?: "free" | "premium";
  expired?: boolean;
} = {}) {
  const credDir = join(FAKE_CONFIG, "jfp");
  mkdirSync(credDir, { recursive: true });

  const creds = {
    access_token: "test-token-12345",
    refresh_token: "refresh-token-67890",
    expires_at: options.expired
      ? new Date(Date.now() - 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    email: options.email ?? "test@example.com",
    tier: options.tier ?? "premium",
    user_id: "user-123",
  };

  writeFileSync(join(credDir, "credentials.json"), JSON.stringify(creds, null, 2));
  return creds;
}

function setupTest() {
  // Create unique test directory for each test
  TEST_DIR = join(tmpdir(), "jfp-collections-test-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  FAKE_HOME = join(TEST_DIR, "home");
  FAKE_CONFIG = join(FAKE_HOME, ".config");

  // Create fresh test directories
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(FAKE_HOME, { recursive: true });

  // Set env vars for testing
  process.env.HOME = FAKE_HOME;
  delete process.env.XDG_CONFIG_HOME;
  delete process.env.JFP_TOKEN;
  process.env.JFP_PREMIUM_API_URL = "https://test-premium.example.com/api";

  // Capture console output
  consoleOutput = [];
  exitCode = undefined;
  console.log = (...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(" "));
  };
  console.error = (...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(" "));
  };
  process.exit = ((code?: number) => {
    exitCode = code;
    throw new Error("EXIT_" + code);
  }) as never;
}

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

describe("collectionsCommand - not logged in", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("shows not authenticated error when not logged in (JSON)", async () => {
    const { collectionsCommand } = await import("../../src/commands/collections");

    try {
      await collectionsCommand({ json: true });
    } catch (e) {
      // Expected exit
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe("not_authenticated");
    expect(parsed.hint).toContain("login");
    expect(exitCode).toBe(1);
  });

  it("shows not authenticated error when not logged in (human)", async () => {
    const { collectionsCommand } = await import("../../src/commands/collections");

    try {
      await collectionsCommand({});
    } catch (e) {
      // Expected exit
    }

    const output = consoleOutput.join("\n");
    expect(output).toContain("logged in");
    expect(exitCode).toBe(1);
  });
});

describe("collectionsCommand - free tier", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("shows premium required error for free tier (JSON)", async () => {
    createCredentialsFile({ tier: "free" });
    const { collectionsCommand } = await import("../../src/commands/collections");

    try {
      await collectionsCommand({ json: true });
    } catch (e) {
      // Expected exit
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe("premium_required");
    expect(exitCode).toBe(1);
  });

  it("shows premium required error for free tier (human)", async () => {
    createCredentialsFile({ tier: "free" });
    const { collectionsCommand } = await import("../../src/commands/collections");

    try {
      await collectionsCommand({});
    } catch (e) {
      // Expected exit
    }

    const output = consoleOutput.join("\n");
    expect(output).toContain("premium");
    expect(exitCode).toBe(1);
  });
});

describe("collectionsCommand - premium tier", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("fetches and displays collections (JSON)", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionsCommand } = await import("../../src/commands/collections");

    const mockCollections = [
      {
        id: "col-1",
        name: "My Favorites",
        promptCount: 5,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-10T00:00:00Z",
      },
      {
        id: "col-2",
        name: "Work Prompts",
        promptCount: 3,
        createdAt: "2026-01-05T00:00:00Z",
        updatedAt: "2026-01-08T00:00:00Z",
      },
    ];

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockCollections), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await collectionsCommand({ json: true });

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe("My Favorites");
    expect(parsed[1].name).toBe("Work Prompts");
    expect(exitCode).toBeUndefined();
  });

  it("handles empty collections list", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionsCommand } = await import("../../src/commands/collections");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await collectionsCommand({ json: true });

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(0);
  });

  it("handles API error", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionsCommand } = await import("../../src/commands/collections");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    try {
      await collectionsCommand({ json: true });
    } catch (e) {
      // Expected exit
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe("api_error");
    expect(exitCode).toBe(1);
  });

  it("handles 401 auth error", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionsCommand } = await import("../../src/commands/collections");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    try {
      await collectionsCommand({ json: true });
    } catch (e) {
      // Expected exit
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe("auth_expired");
    expect(exitCode).toBe(1);
  });
});

describe("collectionShowCommand - show collection", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("fetches and displays collection details (JSON)", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionShowCommand } = await import("../../src/commands/collections");

    const mockCollection = {
      id: "col-1",
      name: "My Favorites",
      description: "My favorite prompts",
      promptCount: 2,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-10T00:00:00Z",
      prompts: [
        {
          id: "idea-wizard",
          title: "Idea Wizard",
          description: "Generate and refine ideas",
          category: "ideation",
        },
        {
          id: "readme-reviser",
          title: "README Reviser",
          description: "Improve your README",
          category: "documentation",
        },
      ],
    };

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockCollection), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await collectionShowCommand("My Favorites", { json: true });

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.name).toBe("My Favorites");
    expect(parsed.prompts.length).toBe(2);
    expect(parsed.prompts[0].id).toBe("idea-wizard");
    expect(exitCode).toBeUndefined();
  });

  it("handles collection not found", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionShowCommand } = await import("../../src/commands/collections");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    try {
      await collectionShowCommand("NonExistent", { json: true });
    } catch (e) {
      // Expected exit
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe("not_found");
    expect(exitCode).toBe(1);
  });
});

describe("collectionShowCommand - add to collection", () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  it("adds prompt to collection (JSON)", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionShowCommand } = await import("../../src/commands/collections");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, collection: "My Favorites", promptId: "idea-wizard" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await collectionShowCommand("My Favorites", { add: "idea-wizard", json: true });

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.success).toBe(true);
    expect(parsed.promptId).toBe("idea-wizard");
    expect(exitCode).toBeUndefined();
  });

  it("handles prompt not found in registry", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionShowCommand } = await import("../../src/commands/collections");

    try {
      await collectionShowCommand("My Favorites", { add: "nonexistent-prompt", json: true });
    } catch (e) {
      // Expected exit
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe("not_found");
    expect(parsed.message).toContain("nonexistent-prompt");
    expect(exitCode).toBe(1);
  });

  it("handles already in collection (409)", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionShowCommand } = await import("../../src/commands/collections");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Already in collection" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await collectionShowCommand("My Favorites", { add: "idea-wizard", json: true });

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.success).toBe(true);
    expect(parsed.alreadyExists).toBe(true);
    expect(exitCode).toBeUndefined();
  });

  it("handles collection not found when adding", async () => {
    createCredentialsFile({ tier: "premium" });
    const { collectionShowCommand } = await import("../../src/commands/collections");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    try {
      await collectionShowCommand("NonExistent", { add: "idea-wizard", json: true });
    } catch (e) {
      // Expected exit
    }

    const output = consoleOutput.join("\n");
    const parsed = JSON.parse(output);

    expect(parsed.error).toBe("not_found");
    expect(exitCode).toBe(1);
  });
});
