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
import { randomUUID } from "crypto";
import {
  collectionsCommand,
  collectionShowCommand,
  exportCollectionCommand,
} from "../../src/commands/collections";

// Helper to create a unique test environment
function setupTestEnv(envOverrides: Record<string, string | undefined> = {}) {
  const testDir = join(tmpdir(), `jfp-collections-test-${randomUUID()}`);
  const fakeHome = join(testDir, "home");
  const fakeConfig = join(fakeHome, ".config");

  mkdirSync(fakeHome, { recursive: true });
  process.env.JFP_HOME = fakeHome;

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

    if (originalJfpHome === undefined) {
      delete process.env.JFP_HOME;
    } else {
      process.env.JFP_HOME = originalJfpHome;
    }
  };

  return { testDir, fakeHome, fakeConfig, mockEnv, cleanup };
}

function parseJson<T = Record<string, unknown>>(payload: string): T {
  try {
    return JSON.parse(payload) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON output: ${message}`);
  }
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

function createOfflineLibraryPrompt(
  configDir: string,
  prompt: {
    id: string;
    title: string;
    content: string;
    description?: string;
    category?: string;
    tags?: string[];
  }
) {
  const libraryDir = join(configDir, "jfp", "library");
  mkdirSync(libraryDir, { recursive: true });
  writeFileSync(
    join(libraryDir, "prompts.json"),
    JSON.stringify(
      [
        {
          ...prompt,
          saved_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      null,
      2
    )
  );
}

// Mock console
let consoleOutput: string[] = [];
let exitCode: number | undefined;
const originalLog = console.log;
const originalError = console.error;
const originalExit = process.exit;
const originalJfpHome = process.env.JFP_HOME;

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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

      expect(parsed.error).toBe(true);
      expect(parsed.code).toBe("auth_expired");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });

  it("allows collections access when authenticated via JFP_TOKEN", async () => {
    const { mockEnv, cleanup } = setupTestEnv({ JFP_TOKEN: "env-token-xyz" });
    try {
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
      const parsed = parseJson(output);
      expect(parsed.collections).toEqual([]);
      expect(exitCode).toBeUndefined();
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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

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
      const parsed = parseJson(output);

      expect(parsed.error).toBe(true);
      expect(parsed.code).toBe("not_found");
      expect(parsed.hint).toContain("jfp collections create");
      expect(exitCode).toBe(1);
    } finally {
      cleanup();
    }
  });
});

describe("exportCollectionCommand", () => {
  it("returns JSON content for --stdout --json without mixing raw markdown", async () => {
    const { mockEnv, cleanup } = setupTestEnv({ JFP_TOKEN: "env-token-xyz" });
    try {
      globalThis.fetch = mock((input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.includes("/cli/collections/My%20Favorites")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id: "col-1",
                name: "My Favorites",
                promptCount: 1,
                createdAt: "2026-01-01T00:00:00Z",
                updatedAt: "2026-01-10T00:00:00Z",
                prompts: [
                  {
                    id: "personal-template",
                    title: "Personal Template",
                    description: "Premium prompt",
                    category: "workflow",
                  },
                ],
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }

        if (url.includes("/api/prompts")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                prompts: [
                  {
                    id: "idea-wizard",
                    title: "The Idea Wizard",
                    description: "Generate and refine ideas",
                    content: "Come up with your very best ideas for improving this project.",
                    category: "ideation",
                    tags: ["brainstorming"],
                    author: "Jeffrey Emanuel",
                    version: "1.0.0",
                    created: "2026-01-01",
                  },
                ],
                bundles: [],
                workflows: [],
                version: "1.0.0",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }

        if (url.includes("/cli/prompts/personal-template")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id: "personal-template",
                title: "Personal Template",
                description: "Premium prompt",
                content: "Personal prompt body",
                category: "workflow",
                tags: ["premium"],
                author: "Jeffrey Emanuel",
                twitter: "@doodlestein",
                version: "1.0.0",
                created: "2026-01-01",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }

        return Promise.resolve(new Response("Not found", { status: 404 }));
      });

      await exportCollectionCommand(
        "My Favorites",
        { json: true, stdout: true, format: "md" },
        mockEnv
      );

      const output = consoleOutput.join("\n");
      const parsed = parseJson(output);

      expect(parsed.success).toBe(true);
      expect(parsed.collection).toBe("My Favorites");
      expect(parsed.exported).toHaveLength(1);
      expect(parsed.exported[0].id).toBe("personal-template");
      expect(parsed.exported[0].content).toContain("# Personal Template");
      expect(parsed.exported[0].content).toContain("**Author:** Jeffrey Emanuel (@doodlestein)");
      expect(exitCode).toBeUndefined();
    } finally {
      cleanup();
    }
  });

  it("exits non-zero when stdout export skips failed prompts", async () => {
    const { mockEnv, cleanup } = setupTestEnv({ JFP_TOKEN: "env-token-xyz" });
    const originalIsTTY = process.stdout.isTTY;
    try {
      Object.defineProperty(process.stdout, "isTTY", {
        value: true,
        configurable: true,
      });

      globalThis.fetch = mock((input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.includes("/cli/collections/Broken%20Favorites")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id: "col-2",
                name: "Broken Favorites",
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
                    id: "missing-personal",
                    title: "Missing Personal Prompt",
                    description: "Should fail to load",
                    category: "workflow",
                  },
                ],
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }

        if (url.includes("/api/prompts")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                prompts: [
                  {
                    id: "idea-wizard",
                    title: "The Idea Wizard",
                    description: "Generate and refine ideas",
                    content: "Come up with your very best ideas for improving this project.",
                    category: "ideation",
                    tags: ["brainstorming"],
                    author: "Jeffrey Emanuel",
                    version: "1.0.0",
                    created: "2026-01-01",
                  },
                ],
                bundles: [],
                workflows: [],
                version: "1.0.0",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }

        if (url.includes("/cli/prompts/missing-personal")) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: "Not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            })
          );
        }

        return Promise.resolve(new Response("Not found", { status: 404 }));
      });

      try {
        await exportCollectionCommand(
          "Broken Favorites",
          { stdout: true, format: "md" },
          mockEnv
        );
      } catch {
        // Expected exit
      }

      const output = consoleOutput.join("\n");
      expect(output).toContain("# The Idea Wizard");
      expect(output).toContain('Failed to export 1 prompt(s) from "Broken Favorites".');
      expect(output).toContain("- missing-personal: Prompt not found: missing-personal");
      expect(exitCode).toBe(1);
    } finally {
      Object.defineProperty(process.stdout, "isTTY", {
        value: originalIsTTY,
        configurable: true,
      });
      cleanup();
    }
  });

  it("uses the provided env when loading offline prompts for export", async () => {
    const { fakeConfig, mockEnv, cleanup } = setupTestEnv({ JFP_TOKEN: "env-token-xyz" });
    try {
      createOfflineLibraryPrompt(fakeConfig, {
        id: "env-local-template",
        title: "Env Local Template",
        description: "Loaded from env-scoped offline library",
        content: "Offline prompt body",
        category: "workflow",
        tags: ["offline"],
      });

      globalThis.fetch = mock((input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.includes("/cli/collections/Env%20Favorites")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id: "col-3",
                name: "Env Favorites",
                promptCount: 1,
                createdAt: "2026-01-01T00:00:00Z",
                updatedAt: "2026-01-10T00:00:00Z",
                prompts: [
                  {
                    id: "env-local-template",
                    title: "Env Local Template",
                    description: "Loaded from env-scoped offline library",
                    category: "workflow",
                  },
                ],
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }

        if (url.includes("/api/prompts")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                prompts: [],
                bundles: [],
                workflows: [],
                version: "1.0.0",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }

        if (url.includes("/cli/prompts/env-local-template")) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: "Not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            })
          );
        }

        return Promise.resolve(new Response("Not found", { status: 404 }));
      });

      await exportCollectionCommand(
        "Env Favorites",
        { json: true, stdout: true, format: "md" },
        mockEnv
      );

      const parsed = parseJson(consoleOutput.join("\n"));
      expect(parsed.success).toBe(true);
      expect(parsed.exported).toHaveLength(1);
      expect(parsed.exported[0].id).toBe("env-local-template");
      expect(parsed.exported[0].content).toContain("# Env Local Template");
      expect(parsed.exported[0].content).toContain("Offline prompt body");
      expect(exitCode).toBeUndefined();
    } finally {
      cleanup();
    }
  });
});
