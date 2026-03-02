/**
 * Tests for the clipboard utility (copyToClipboard).
 * Exercises the Clipboard API path and the textarea fallback.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard } from "./clipboard";

describe("copyToClipboard", () => {
  let origClipboard: Clipboard;
  let origExecCommand: typeof document.execCommand;

  beforeEach(() => {
    origClipboard = navigator.clipboard;
    origExecCommand = document.execCommand;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: origClipboard,
      writable: true,
      configurable: true,
    });
    document.execCommand = origExecCommand;
  });

  // --- Clipboard API path ---

  it("copies via Clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    const result = await copyToClipboard("hello world");

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(writeText).toHaveBeenCalledWith("hello world");
  });

  it("falls back to textarea when Clipboard API throws", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("not allowed"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    // Mock execCommand to succeed
    document.execCommand = vi.fn().mockReturnValue(true);

    const result = await copyToClipboard("fallback text");

    expect(writeText).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(result.success).toBe(true);
  });

  // --- Textarea fallback path ---

  it("uses textarea fallback when clipboard is undefined", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn().mockReturnValue(true);

    const result = await copyToClipboard("no clipboard");

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(result.success).toBe(true);
  });

  it("returns failure when execCommand returns false", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn().mockReturnValue(false);

    const result = await copyToClipboard("fail");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain("execCommand");
  });

  it("returns failure when execCommand throws", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn().mockImplementation(() => {
      throw new Error("security error");
    });

    const result = await copyToClipboard("error text");

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe("security error");
  });

  it("cleans up the textarea from the DOM after success", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn().mockReturnValue(true);

    await copyToClipboard("cleanup test");

    // Verify no leftover textareas with our specific styling
    const textareas = document.querySelectorAll("textarea");
    for (const ta of textareas) {
      expect(ta.style.opacity).not.toBe("0");
    }
  });

  it("cleans up the textarea from the DOM after failure", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn().mockImplementation(() => {
      throw new Error("boom");
    });

    await copyToClipboard("cleanup on error");

    const textareas = document.querySelectorAll("textarea");
    for (const ta of textareas) {
      expect(ta.style.opacity).not.toBe("0");
    }
  });

  it("handles empty string input", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    const result = await copyToClipboard("");

    expect(result.success).toBe(true);
    expect(writeText).toHaveBeenCalledWith("");
  });

  it("handles multiline text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    const multiline = "line 1\nline 2\nline 3";
    const result = await copyToClipboard(multiline);

    expect(result.success).toBe(true);
    expect(writeText).toHaveBeenCalledWith(multiline);
  });
});
