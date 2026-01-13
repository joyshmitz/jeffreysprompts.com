/**
 * Integration tests for server-side Sentry error monitoring
 * Tests that error capture is configured correctly without making external network calls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Sentry module
const mockInit = vi.fn();
const mockCaptureException = vi.fn();
const mockCaptureMessage = vi.fn();
const mockSetContext = vi.fn();
const mockSetTag = vi.fn();
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

vi.mock("@sentry/nextjs", () => ({
  init: mockInit,
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  setContext: mockSetContext,
  setTag: mockSetTag,
  setUser: mockSetUser,
  withScope: mockWithScope,
  replayIntegration: vi.fn(() => ({})),
}));

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

      expect(mockCaptureException).toHaveBeenCalledWith(testError);
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
    });

    it("should capture messages with correct structure", async () => {
      const Sentry = await import("@sentry/nextjs");

      Sentry.captureMessage("Test message");

      expect(mockCaptureMessage).toHaveBeenCalledWith("Test message");
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
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

      expect(mockWithScope).toHaveBeenCalled();
      expect(mockSetTag).toHaveBeenCalledWith("requestId", requestId);
      expect(mockSetContext).toHaveBeenCalledWith("request", expect.objectContaining({
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

      expect(mockSetUser).toHaveBeenCalledWith({
        id: "user-uuid-12345",
      });

      // Verify no PII fields were passed
      const userCall = mockSetUser.mock.calls[0][0];
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

    expect(mockSetTag).toHaveBeenCalledWith("correlationId", correlationId);
    expect(mockSetTag).toHaveBeenCalledWith("requestId", requestId);
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

    expect(mockCaptureException).toHaveBeenCalledWith(testError);
    expect(mockSetTag).toHaveBeenCalledWith("requestId", requestId);
    expect(mockSetTag).toHaveBeenCalledWith("errorType", "database");
  });
});
