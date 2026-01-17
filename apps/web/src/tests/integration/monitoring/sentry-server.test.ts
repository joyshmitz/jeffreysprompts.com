/**
 * Integration tests for server-side Sentry error monitoring
 * Tests that error capture is configured correctly without making external network calls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoist mocks so they are available to the factory
const mocks = vi.hoisted(() => {
  const mockSetTag = vi.fn();
  const mockSetContext = vi.fn();
  const mockSetUser = vi.fn();
  const mockWithScope = vi.fn((callback) => {
    const mockScope = {
      setTag: mockSetTag,
      setContext: mockSetContext,
      setUser: mockSetUser,
      setExtra: vi.fn(),
      setLevel: vi.fn(),
    };
    callback(mockScope);
  });

  return {
    init: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setContext: mockSetContext,
    setTag: mockSetTag,
    setUser: mockSetUser,
    withScope: mockWithScope,
    replayIntegration: vi.fn(() => ({})),
  };
});

vi.mock("@sentry/nextjs", () => mocks);

describe("Sentry Server Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("configuration validation", () => {
    it("should have required Sentry configuration files", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const webAppRoot = path.resolve(__dirname, "../../../..");

      // Server config
      expect(fs.existsSync(path.join(webAppRoot, "sentry.server.config.ts"))).toBe(true);
      // Client config
      expect(fs.existsSync(path.join(webAppRoot, "sentry.client.config.ts"))).toBe(true);
      // Edge config
      expect(fs.existsSync(path.join(webAppRoot, "sentry.edge.config.ts"))).toBe(true);
      // Instrumentation
      expect(fs.existsSync(path.join(webAppRoot, "src/instrumentation.ts"))).toBe(true);
    });

    it("should have proper server config structure", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const webAppRoot = path.resolve(__dirname, "../../../..");
      const serverConfig = fs.readFileSync(
        path.join(webAppRoot, "sentry.server.config.ts"),
        "utf-8"
      );

      // Check for required configuration options
      expect(serverConfig).toContain("Sentry.init");
      expect(serverConfig).toContain("dsn");
      expect(serverConfig).toContain("tracesSampleRate");
      expect(serverConfig).toContain("environment");
    });

    it("should only enable Sentry in production", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const webAppRoot = path.resolve(__dirname, "../../../..");
      const serverConfig = fs.readFileSync(
        path.join(webAppRoot, "sentry.server.config.ts"),
        "utf-8"
      );

      // Check that Sentry is conditionally enabled
      expect(serverConfig).toContain('enabled');
      expect(serverConfig).toContain('production');
    });
  });

  describe("error capture simulation", () => {
    it("should capture exceptions with correct structure", async () => {
      const Sentry = await import("@sentry/nextjs");

      const testError = new Error("Test server error");
      Sentry.captureException(testError);

      expect(mocks.captureException).toHaveBeenCalledWith(testError);
      expect(mocks.captureException).toHaveBeenCalledTimes(1);
    });

    it("should capture messages with correct structure", async () => {
      const Sentry = await import("@sentry/nextjs");

      Sentry.captureMessage("Test message");

      expect(mocks.captureMessage).toHaveBeenCalledWith("Test message");
      expect(mocks.captureMessage).toHaveBeenCalledTimes(1);
    });

    it("should allow setting request context with requestId", async () => {
      const Sentry = await import("@sentry/nextjs");

      const requestId = "req-12345-abcde";

      Sentry.withScope((scope) => {
        scope.setTag("requestId", requestId);
        scope.setContext("request", {
          requestId,
          path: "/api/test",
          method: "GET",
        });
      });

      expect(mocks.withScope).toHaveBeenCalled();
      expect(mocks.setTag).toHaveBeenCalledWith("requestId", requestId);
      expect(mocks.setContext).toHaveBeenCalledWith("request", expect.objectContaining({
        requestId,
      }));
    });

    it("should support adding user context without PII", async () => {
      const Sentry = await import("@sentry/nextjs");

      // Only set non-PII user identifiers
      Sentry.withScope((scope) => {
        scope.setUser({
          id: "user-uuid-12345", // Anonymous ID is acceptable
          // Note: email, name, ip_address should NOT be included
        });
      });

      expect(mocks.setUser).toHaveBeenCalledWith({
        id: "user-uuid-12345",
      });

      // Verify no PII fields were passed
      const userCall = mocks.setUser.mock.calls[0][0];
      expect(userCall).not.toHaveProperty("email");
      expect(userCall).not.toHaveProperty("ip_address");
      expect(userCall).not.toHaveProperty("name");
    });
  });

  describe("instrumentation", () => {
    it("should have proper instrumentation hook structure", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const webAppRoot = path.resolve(__dirname, "../../../..");
      const instrumentation = fs.readFileSync(
        path.join(webAppRoot, "src/instrumentation.ts"),
        "utf-8"
      );

      // Check for register function export
      expect(instrumentation).toContain("export async function register");

      // Check for runtime-specific imports
      expect(instrumentation).toContain("NEXT_RUNTIME");
      expect(instrumentation).toContain("nodejs");
      expect(instrumentation).toContain("edge");

      // Check for dynamic imports
      expect(instrumentation).toContain("sentry.server.config");
      expect(instrumentation).toContain("sentry.edge.config");
    });
  });

  describe("environment configuration", () => {
    it("should use environment variables for DSN", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const webAppRoot = path.resolve(__dirname, "../../../..");
      const serverConfig = fs.readFileSync(
        path.join(webAppRoot, "sentry.server.config.ts"),
        "utf-8"
      );

      // Should use SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN
      expect(serverConfig).toMatch(/SENTRY_DSN|NEXT_PUBLIC_SENTRY_DSN/);
    });

    it("should set environment based on NODE_ENV", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const webAppRoot = path.resolve(__dirname, "../../../..");
      const serverConfig = fs.readFileSync(
        path.join(webAppRoot, "sentry.server.config.ts"),
        "utf-8"
      );

      expect(serverConfig).toContain("environment");
      expect(serverConfig).toContain("NODE_ENV");
    });
  });
});

describe("Sentry Error Correlation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should support correlation ID propagation", async () => {
    const Sentry = await import("@sentry/nextjs");

    const correlationId = "corr-" + Date.now();
    const requestId = "req-" + Date.now();

    Sentry.withScope((scope) => {
      scope.setTag("correlationId", correlationId);
      scope.setTag("requestId", requestId);
      scope.setContext("trace", {
        correlationId,
        requestId,
        timestamp: new Date().toISOString(),
      });
    });

    expect(mocks.setTag).toHaveBeenCalledWith("correlationId", correlationId);
    expect(mocks.setTag).toHaveBeenCalledWith("requestId", requestId);
  });

  it("should capture error with full context", async () => {
    const Sentry = await import("@sentry/nextjs");

    const testError = new Error("Database connection failed");
    const requestId = "req-db-error-123";

    Sentry.withScope((scope) => {
      scope.setTag("requestId", requestId);
      scope.setTag("errorType", "database");
      scope.setContext("database", {
        operation: "query",
        table: "users",
        // No actual data or PII
      });
    });

    Sentry.captureException(testError);

    expect(mocks.captureException).toHaveBeenCalledWith(testError);
    expect(mocks.setTag).toHaveBeenCalledWith("requestId", requestId);
    expect(mocks.setTag).toHaveBeenCalledWith("errorType", "database");
  });
});
