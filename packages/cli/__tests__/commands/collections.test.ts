/**
 * Collections Command Unit Tests
 *
 * Tests for the collections command:
 * - jfp collections: List all user collections
 * - jfp collections <name>: Show prompts in a collection
 * - jfp collections <name> --add <prompt-id>: Add prompt to collection
 */
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  collectionsCommand,
  collectionShowCommand,
} from "../../src/commands/collections";

// Helper to create a unique test environment
function setupTestEnv(envOverrides: Record<string, string | undefined> = {}) {
  const testDir = join(tmpdir(), "jfp-collections-test-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  const fakeHome = join(testDir, "home");
  const fakeConfig = join(fakeHome, ".config");

  mkdirSync(fakeHome, { recursive: true });

  const mockEnv: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: fakeHome,
    XDG_CONFIG_HOME: undefined,
    JFP_TOKEN: undefined,
    JFP_PREMIUM_API_URL: "https://test-premium.example.com/api",
    ...envOverrides,
  };

  const cleanup = () => {
    try {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  };

  return { testDir, fakeHome, fakeConfig, mockEnv, cleanup };
}

// Helper to create valid credentials
function createCredentialsFile(configDir: string, options: {
  email?: string;
  tier?: "free" | "premium";
  expired?: boolean;
} = {}) {
  const credDir = join(configDir, "jfp");
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

// Mock console
let consoleOutput: string[] = [];
let exitCode: number | undefined;
const originalLog = console.log;
const originalError = console.error;
const originalExit = process.exit;

// Mock fetch
const originalFetch = globalThis.fetch;

beforeEach(() => {
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
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  process.exit = originalExit;
  globalThis.fetch = originalFetch;
});

describe("collectionsCommand - not logged in", () => {
  it("shows not authenticated error when not logged in (JSON)", async () => {
    const { mockEnv, cleanup } = setupTestEnv();
    try {
      try {
        await collectionsCommand({ json: true }, mockEnv);
      } catch (e) {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.error).toBe(true);
      expect(parsed.code).toBe("not_authenticated");
      expect(parsed.hint).toContain("login");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("shows not authenticated error when not logged in (human)", async () => {
    const { mockEnv, cleanup } = setupTestEnv();
    try {
      try {
        await collectionsCommand({}, mockEnv);
      } catch (e) {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      expect(output).toContain("logged in");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });
});

describe("collectionsCommand - free tier", () => {
  it("shows premium required error for free tier (JSON)", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "free" });

      try {
        await collectionsCommand({ json: true }, mockEnv);
      } catch (e) {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.error).toBe(true);
      expect(parsed.code).toBe("premium_required");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("shows premium required error for free tier (human)", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "free" });

      try {
        await collectionsCommand({}, mockEnv);
      } catch (e) {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      expect(output).toContain("premium");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });
});

describe("collectionsCommand - premium tier", () => {
  it("fetches and displays collections (JSON)", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

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

      await collectionsCommand({ json: true }, mockEnv);

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(Array.isArray(parsed.collections)).toBe(true);
      expect(parsed.collections.length).toBe(2);
      expect(parsed.collections[0].name).toBe("My Favorites");
      expect(parsed.collections[1].name).toBe("Work Prompts");
      expect(exitCode).toBeUndefined();
    } finally {
      cleanup();
    }
  });

  it("handles empty collections list", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

      globalThis.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await collectionsCommand({ json: true }, mockEnv);

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(Array.isArray(parsed.collections)).toBe(true);
      expect(parsed.collections.length).toBe(0);
    } finally {
      cleanup();
    }
  });

  it("handles API error", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

      globalThis.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      try {
        await collectionsCommand({ json: true }, mockEnv);
      } catch (e) {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.error).toBe(true);
      expect(parsed.code).toBe("api_error");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("handles 401 auth error", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

      globalThis.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      try {
        await collectionsCommand({ json: true }, mockEnv);
      } catch (e) {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.error).toBe(true);
      expect(parsed.code).toBe("auth_expired");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });
});

describe("collectionShowCommand - show collection", () => {
  it("fetches and displays collection details (JSON)", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

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

      await collectionShowCommand("My Favorites", { json: true }, mockEnv);

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.collection.name).toBe("My Favorites");
      expect(parsed.items.length).toBe(2);
      expect(parsed.items[0].id).toBe("idea-wizard");
      expect(exitCode).toBeUndefined();
    } finally {
      cleanup();
    }
  });

  it("handles collection not found", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

      globalThis.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      try {
        await collectionShowCommand("NonExistent", { json: true }, mockEnv);
      } catch (e) {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.error).toBe(true);
      expect(parsed.code).toBe("not_found");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });
});

describe("collectionShowCommand - add to collection", () => {
  it("adds prompt to collection (JSON)", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

      globalThis.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ success: true, collection: "My Favorites", promptId: "idea-wizard" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await collectionShowCommand("My Favorites", { add: "idea-wizard", json: true }, mockEnv);

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.added).toBe(true);
      expect(parsed.prompt_id).toBe("idea-wizard");
      expect(exitCode).toBeUndefined();
    } finally {
      cleanup();
    }
  });

  it("handles prompt not found in registry", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

      try {
        await collectionShowCommand("My Favorites", { add: "nonexistent-prompt", json: true }, mockEnv);
      } catch (e) {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.error).toBe(true);
      // API client generic error handling wraps this
      expect(parsed.code).toBe("api_error");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("handles already in collection (409)", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

      globalThis.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Already in collection" }), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await collectionShowCommand("My Favorites", { add: "idea-wizard", json: true }, mockEnv);

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.added).toBe(false);
      expect(parsed.already_exists).toBe(true);
      expect(exitCode).toBeUndefined();
    } finally {
      cleanup();
    }
  });

  it("handles collection not found when adding", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv();
    try {
      createCredentialsFile(fakeConfig, { tier: "premium" });

      globalThis.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Collection not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      try {
        await collectionShowCommand("NonExistent", { add: "idea-wizard", json: true }, mockEnv);
      } catch (e) {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      const parsed = JSON.parse(output);

      expect(parsed.error).toBe(true);
      expect(parsed.code).toBe("not_found");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });
});