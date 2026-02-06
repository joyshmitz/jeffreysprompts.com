import { describe, it, expect } from "vitest";
import { createUserIdCookieValue, parseUserIdCookie } from "./user-id";

describe("user-id", () => {
  describe("createUserIdCookieValue + parseUserIdCookie roundtrip", () => {
    it("creates and parses a valid cookie value", () => {
      const userId = "test-user-123";
      const cookieValue = createUserIdCookieValue(userId);
      const parsed = parseUserIdCookie(cookieValue);

      expect(parsed).toBe(userId);
    });

    it("works with UUID-style user IDs", () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const cookieValue = createUserIdCookieValue(userId);
      const parsed = parseUserIdCookie(cookieValue);

      expect(parsed).toBe(userId);
    });

    it("produces different signatures for different user IDs", () => {
      const cookie1 = createUserIdCookieValue("user-1");
      const cookie2 = createUserIdCookieValue("user-2");

      expect(cookie1).not.toBe(cookie2);
    });
  });

  describe("parseUserIdCookie", () => {
    it("returns null for empty input", () => {
      expect(parseUserIdCookie("")).toBeNull();
      expect(parseUserIdCookie(null)).toBeNull();
      expect(parseUserIdCookie(undefined)).toBeNull();
    });

    it("returns null for whitespace-only input", () => {
      expect(parseUserIdCookie("   ")).toBeNull();
    });

    it("returns null for value without a dot separator", () => {
      expect(parseUserIdCookie("no-dot-here")).toBeNull();
    });

    it("returns null when signature is empty", () => {
      expect(parseUserIdCookie("user-id.")).toBeNull();
    });

    it("returns null for tampered user ID", () => {
      const validCookie = createUserIdCookieValue("original-user");
      // Tamper with the user ID portion
      const tampered = "tampered-user" + validCookie.slice(validCookie.indexOf("."));
      expect(parseUserIdCookie(tampered)).toBeNull();
    });

    it("returns null for tampered signature", () => {
      const validCookie = createUserIdCookieValue("user-123");
      // Tamper with the signature
      const tampered = validCookie.slice(0, validCookie.lastIndexOf(".") + 1) + "invalidsig";
      expect(parseUserIdCookie(tampered)).toBeNull();
    });

    it("returns null for oversized user ID", () => {
      const longId = "x".repeat(201);
      const cookieValue = longId + ".fakesig";
      expect(parseUserIdCookie(cookieValue)).toBeNull();
    });

    it("returns null for user ID with leading/trailing whitespace", () => {
      // The validator checks userId.trim() === userId
      const cookieValue = " user-with-spaces .sig";
      expect(parseUserIdCookie(cookieValue)).toBeNull();
    });
  });

  describe("createUserIdCookieValue", () => {
    it("produces format userId.signature", () => {
      const cookie = createUserIdCookieValue("my-user");
      // There should be at least 2 parts (userId and signature)
      // Note: UUID user IDs don't contain dots, so splitting on last dot works
      const lastDot = cookie.lastIndexOf(".");
      expect(lastDot).toBeGreaterThan(0);
      expect(cookie.slice(0, lastDot)).toBe("my-user");
      expect(cookie.slice(lastDot + 1).length).toBeGreaterThan(0);
    });

    it("signature is base64url encoded (no +, /, or =)", () => {
      const cookie = createUserIdCookieValue("test-base64url");
      const signature = cookie.slice(cookie.lastIndexOf(".") + 1);
      expect(signature).not.toMatch(/[+/=]/);
    });
  });
});
