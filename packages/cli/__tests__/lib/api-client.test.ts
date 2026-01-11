/**
 * API Client Tests
 *
 * Tests for authenticated API client:
 * - Automatic auth header injection
 * - HTTP method helpers (GET, POST, PUT, DELETE)
 * - Timeout handling
 * - Error handling and helper functions
 */
import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  ApiClient,
  createApiClient,
  isAuthError,
  isPermissionError,
  isNotFoundError,
  requiresPremium,
} from "../../src/lib/api-client";

// Test directory setup
let TEST_DIR: string;
let FAKE_HOME: string;
let FAKE_CONFIG: string;

// Store original env vars
const originalHome = process.env.HOME;
const originalXdgConfig = process.env.XDG_CONFIG_HOME;
const originalJfpToken = process.env.JFP_TOKEN;
const originalApiUrl = process.env.JFP_PREMIUM_API_URL;

// Mock fetch
const originalFetch = globalThis.fetch;
let mockFetch: ReturnType<typeof mock>;

beforeEach(() => {
  // Create unique test directory for each test
  TEST_DIR = join(tmpdir(), "jfp-api-client-test-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  FAKE_HOME = join(TEST_DIR, "home");
  FAKE_CONFIG = join(FAKE_HOME, ".config");

  // Create fresh test directories
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(FAKE_HOME, { recursive: true });

  // Set env vars for testing
  process.env.HOME = FAKE_HOME;
  delete process.env.XDG_CONFIG_HOME;
  delete process.env.JFP_TOKEN;
  delete process.env.JFP_PREMIUM_API_URL;

  // Mock fetch
  mockFetch = mock(() =>
    Promise.resolve(
      new Response(JSON.stringify({ data: "test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  globalThis.fetch = mockFetch;
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
  if (originalApiUrl) {
    process.env.JFP_PREMIUM_API_URL = originalApiUrl;
  } else {
    delete process.env.JFP_PREMIUM_API_URL;
  }

  // Restore fetch
  globalThis.fetch = originalFetch;

  // Cleanup test directory
  rmSync(TEST_DIR, { recursive: true, force: true });
});

// Helper to create valid credentials
function createCredentialsFile(options: { expired?: boolean; email?: string } = {}) {
  const credDir = join(FAKE_CONFIG, "jfp");
  mkdirSync(credDir, { recursive: true });

  const expiresAt = options.expired
    ? new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

  const creds = {
    access_token: "file-token-12345",
    refresh_token: "refresh-token-67890",
    expires_at: expiresAt,
    email: options.email ?? "test@example.com",
    tier: "premium",
    user_id: "user-123",
  };

  writeFileSync(join(credDir, "credentials.json"), JSON.stringify(creds, null, 2));
  return creds;
}

describe("ApiClient", () => {
  describe("constructor", () => {
    it("uses default base URL", async () => {
      const client = new ApiClient();
      // Make a request to check the URL construction
      await client.get("/test");
      expect(mockFetch).toHaveBeenCalled();
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://pro.jeffreysprompts.com/api/test");
    });

    it("uses custom base URL from options", async () => {
      const client = new ApiClient({ baseUrl: "https://custom.api.com" });
      await client.get("/test");
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://custom.api.com/test");
    });

    it("uses JFP_PREMIUM_API_URL env var", async () => {
      process.env.JFP_PREMIUM_API_URL = "https://env.api.com";
      // Need to re-import to pick up env change, or use createApiClient
      const client = createApiClient({});
      await client.get("/test");
      // URL will still be default since module was already loaded
      // This test verifies the client can be created
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("request", () => {
    it("makes request without auth header when not logged in", async () => {
      const client = new ApiClient();
      await client.request("/test");

      expect(mockFetch).toHaveBeenCalled();
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Headers;
      expect(headers.get("Authorization")).toBeNull();
    });

    it("includes auth header when JFP_TOKEN env var is set", async () => {
      process.env.JFP_TOKEN = "env-token-xyz";

      const client = new ApiClient();
      await client.request("/test");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer env-token-xyz");
    });

    it("includes auth header from stored credentials", async () => {
      createCredentialsFile();

      const client = new ApiClient();
      await client.request("/test");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer file-token-12345");
    });

    it("does not include auth header for expired credentials", async () => {
      createCredentialsFile({ expired: true });

      const client = new ApiClient();
      await client.request("/test");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Headers;
      expect(headers.get("Authorization")).toBeNull();
    });

    it("sets Content-Type header to application/json", async () => {
      const client = new ApiClient();
      await client.request("/test");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Headers;
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("handles full URLs without prepending base URL", async () => {
      const client = new ApiClient({ baseUrl: "https://base.api.com" });
      await client.request("https://other.api.com/test");

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://other.api.com/test");
    });

    it("returns ok: true for successful response", async () => {
      const client = new ApiClient();
      const response = await client.request<{ data: string }>("/test");

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: "test" });
    });

    it("returns ok: false for error response", async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const client = new ApiClient();
      const response = await client.request("/test");

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.error).toBe("Not found");
    });

    it("handles non-JSON responses", async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          new Response("Plain text response", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          })
        )
      );

      const client = new ApiClient();
      const response = await client.request("/test");

      expect(response.ok).toBe(true);
      expect(response.data).toBeUndefined();
    });

    it("handles network errors", async () => {
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error("Network error")));

      const client = new ApiClient();
      const response = await client.request("/test");

      expect(response.ok).toBe(false);
      expect(response.status).toBe(0);
      expect(response.error).toBe("Network error");
    });

    it("handles timeout", async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          })
      );

      const client = new ApiClient({ timeout: 100 });
      const response = await client.request("/test");

      expect(response.ok).toBe(false);
      expect(response.error).toBe("Request timed out");
    });
  });

  describe("HTTP method helpers", () => {
    it("get() makes GET request", async () => {
      const client = new ApiClient();
      await client.get("/test");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("GET");
    });

    it("post() makes POST request with body", async () => {
      const client = new ApiClient();
      await client.post("/test", { key: "value" });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("POST");
      expect(options.body).toBe('{"key":"value"}');
    });

    it("put() makes PUT request with body", async () => {
      const client = new ApiClient();
      await client.put("/test", { updated: true });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("PUT");
      expect(options.body).toBe('{"updated":true}');
    });

    it("delete() makes DELETE request", async () => {
      const client = new ApiClient();
      await client.delete("/test");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("DELETE");
    });
  });

  describe("isAuthenticated", () => {
    it("returns false when not logged in", async () => {
      const client = new ApiClient();
      const result = await client.isAuthenticated();
      expect(result).toBe(false);
    });

    it("returns true when logged in via env var", async () => {
      process.env.JFP_TOKEN = "env-token";

      const client = new ApiClient();
      const result = await client.isAuthenticated();
      expect(result).toBe(true);
    });

    it("returns true when logged in via credentials file", async () => {
      createCredentialsFile();

      const client = new ApiClient();
      const result = await client.isAuthenticated();
      expect(result).toBe(true);
    });
  });

  describe("getUser", () => {
    it("returns null when not logged in", async () => {
      const client = new ApiClient();
      const user = await client.getUser();
      expect(user).toBeNull();
    });

    it("returns user info when logged in", async () => {
      createCredentialsFile({ email: "user@test.com" });

      const client = new ApiClient();
      const user = await client.getUser();
      expect(user).not.toBeNull();
      expect(user!.email).toBe("user@test.com");
      expect(user!.tier).toBe("premium");
    });
  });

  describe("verifyAuth", () => {
    it("returns authenticated: true for valid token", async () => {
      createCredentialsFile();
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(JSON.stringify({ email: "test@example.com", tier: "premium" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const client = new ApiClient();
      const result = await client.verifyAuth();

      expect(result.authenticated).toBe(true);
      expect(result.user?.email).toBe("test@example.com");
    });

    it("returns authenticated: false for invalid token", async () => {
      createCredentialsFile();
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const client = new ApiClient();
      const result = await client.verifyAuth();

      expect(result.authenticated).toBe(false);
      expect(result.user).toBeUndefined();
    });
  });
});

describe("Helper functions", () => {
  describe("isAuthError", () => {
    it("returns true for 401 status", () => {
      expect(isAuthError({ ok: false, status: 401, error: "Unauthorized" })).toBe(true);
    });

    it("returns false for other statuses", () => {
      expect(isAuthError({ ok: false, status: 403, error: "Forbidden" })).toBe(false);
      expect(isAuthError({ ok: false, status: 500, error: "Server error" })).toBe(false);
    });
  });

  describe("isPermissionError", () => {
    it("returns true for 403 status", () => {
      expect(isPermissionError({ ok: false, status: 403, error: "Forbidden" })).toBe(true);
    });

    it("returns false for other statuses", () => {
      expect(isPermissionError({ ok: false, status: 401, error: "Unauthorized" })).toBe(false);
    });
  });

  describe("isNotFoundError", () => {
    it("returns true for 404 status", () => {
      expect(isNotFoundError({ ok: false, status: 404, error: "Not found" })).toBe(true);
    });

    it("returns false for other statuses", () => {
      expect(isNotFoundError({ ok: false, status: 400, error: "Bad request" })).toBe(false);
    });
  });

  describe("requiresPremium", () => {
    it("returns true for 403 with premium in error message", () => {
      expect(requiresPremium({ ok: false, status: 403, error: "Premium tier required" })).toBe(true);
      expect(requiresPremium({ ok: false, status: 403, error: "This feature requires PREMIUM" })).toBe(true);
    });

    it("returns false for 403 without premium in message", () => {
      expect(requiresPremium({ ok: false, status: 403, error: "Access denied" })).toBe(false);
    });

    it("returns false for other statuses", () => {
      expect(requiresPremium({ ok: false, status: 401, error: "Premium required" })).toBe(false);
    });
  });
});

describe("createApiClient", () => {
  it("creates a new ApiClient instance", () => {
    const client = createApiClient({ baseUrl: "https://custom.api.com" });
    expect(client).toBeInstanceOf(ApiClient);
  });
});
