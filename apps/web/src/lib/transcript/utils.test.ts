/**
 * Unit tests for transcript utils
 * @module lib/transcript/utils.test
 */

import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDuration,
  detectLanguage,
  formatFilePath,
  formatBytes,
  estimateTokens,
  formatNumber,
} from "./utils";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("transcript utils", () => {
  // -----------------------------------------------------------------------
  // formatTime
  // -----------------------------------------------------------------------

  describe("formatTime", () => {
    it("formats valid ISO timestamp", () => {
      const result = formatTime("2026-02-06T14:30:00Z");
      // Just verify it produces a non-empty formatted time
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns empty string for invalid timestamp", () => {
      expect(formatTime("not-a-date")).toBe("");
    });

    it("returns empty string for empty string", () => {
      expect(formatTime("")).toBe("");
    });
  });

  // -----------------------------------------------------------------------
  // formatDuration
  // -----------------------------------------------------------------------

  describe("formatDuration", () => {
    it("formats minutes-only duration", () => {
      const start = "2026-01-01T00:00:00Z";
      const end = "2026-01-01T00:30:00Z";
      expect(formatDuration(start, end)).toBe("30m");
    });

    it("formats hours and minutes", () => {
      const start = "2026-01-01T00:00:00Z";
      const end = "2026-01-01T01:45:00Z";
      expect(formatDuration(start, end)).toBe("1h 45m");
    });

    it("formats exact hours", () => {
      const start = "2026-01-01T00:00:00Z";
      const end = "2026-01-01T02:00:00Z";
      expect(formatDuration(start, end)).toBe("2h");
    });

    it("returns 0m for same timestamps", () => {
      const ts = "2026-01-01T00:00:00Z";
      expect(formatDuration(ts, ts)).toBe("0m");
    });

    it("returns 0m for invalid timestamps", () => {
      expect(formatDuration("bad", "bad")).toBe("0m");
    });

    it("returns 0m when end is before start", () => {
      const start = "2026-01-01T01:00:00Z";
      const end = "2026-01-01T00:00:00Z";
      expect(formatDuration(start, end)).toBe("0m");
    });
  });

  // -----------------------------------------------------------------------
  // detectLanguage
  // -----------------------------------------------------------------------

  describe("detectLanguage", () => {
    it("returns text for empty content", () => {
      expect(detectLanguage("")).toBe("text");
      expect(detectLanguage("  ")).toBe("text");
    });

    it("detects JSON", () => {
      expect(detectLanguage('{"key": "value"}')).toBe("json");
      expect(detectLanguage('[1, 2, 3]')).toBe("json");
    });

    it("detects bash", () => {
      expect(detectLanguage("#!/bin/bash\necho hi")).toBe("bash");
      expect(detectLanguage("git status")).toBe("bash");
      expect(detectLanguage("npm install react")).toBe("bash");
      expect(detectLanguage("bun run dev")).toBe("bash");
    });

    it("detects TypeScript", () => {
      expect(detectLanguage("const x: string = 'hello'")).toBe("typescript");
      expect(detectLanguage("interface Foo { bar: number }")).toBe("typescript");
    });

    it("detects JavaScript", () => {
      expect(detectLanguage("const x = 'hello'")).toBe("javascript");
      expect(detectLanguage("function foo() {")).toBe("javascript");
    });

    it("detects Python", () => {
      expect(detectLanguage("def hello():")).toBe("python");
      expect(detectLanguage("from os import path")).toBe("python");
    });

    it("detects CSS", () => {
      expect(detectLanguage(".btn { color: red }")).toBe("css");
      expect(detectLanguage("color: red;")).toBe("css");
    });

    it("detects HTML", () => {
      expect(detectLanguage("<!DOCTYPE html>")).toBe("html");
      expect(detectLanguage("<html lang='en'>")).toBe("html");
      expect(detectLanguage("<div class='foo'>")).toBe("html");
    });

    it("detects diff", () => {
      expect(detectLanguage("diff --git a/foo b/bar")).toBe("diff");
      expect(detectLanguage("+++ b/file.ts")).toBe("diff");
      expect(detectLanguage("--- a/file.ts")).toBe("diff");
    });

    it("detects YAML", () => {
      expect(detectLanguage("name: test")).toBe("yaml");
    });

    it("detects Markdown", () => {
      expect(detectLanguage("# Title")).toBe("markdown");
      expect(detectLanguage("## Subtitle")).toBe("markdown");
      expect(detectLanguage("- list item")).toBe("markdown");
    });

    it("detects SQL", () => {
      expect(detectLanguage("SELECT * FROM users")).toBe("sql");
      expect(detectLanguage("CREATE TABLE foo")).toBe("sql");
    });

    it("falls back to text for unknown content", () => {
      expect(detectLanguage("just some random text here")).toBe("text");
    });
  });

  // -----------------------------------------------------------------------
  // formatFilePath
  // -----------------------------------------------------------------------

  describe("formatFilePath", () => {
    it("returns short path unchanged", () => {
      expect(formatFilePath("src/lib/foo.ts")).toBe("src/lib/foo.ts");
    });

    it("returns empty string unchanged", () => {
      expect(formatFilePath("")).toBe("");
    });

    it("truncates long paths", () => {
      const longPath = "apps/web/src/lib/very/deep/nested/directory/structure/file.ts";
      const result = formatFilePath(longPath, 30);
      expect(result).toContain("...");
      expect(result.length).toBeLessThanOrEqual(longPath.length);
    });

    it("preserves paths with few segments", () => {
      const path = "a/b/c";
      expect(formatFilePath(path, 3)).toBe(path);
    });

    it("shows first and last parts", () => {
      const result = formatFilePath("a/b/c/d/e/f.ts", 10);
      expect(result).toContain("a/");
      expect(result).toContain("f.ts");
    });
  });

  // -----------------------------------------------------------------------
  // formatBytes
  // -----------------------------------------------------------------------

  describe("formatBytes", () => {
    it("returns 0 B for zero", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("returns 0 B for negative numbers", () => {
      expect(formatBytes(-100)).toBe("0 B");
    });

    it("returns 0 B for NaN", () => {
      expect(formatBytes(NaN)).toBe("0 B");
    });

    it("returns 0 B for Infinity", () => {
      expect(formatBytes(Infinity)).toBe("0 B");
    });

    it("formats bytes", () => {
      expect(formatBytes(500)).toBe("500 B");
    });

    it("formats kilobytes", () => {
      expect(formatBytes(1024)).toBe("1.0 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
    });

    it("formats megabytes", () => {
      expect(formatBytes(1048576)).toBe("1.0 MB");
    });

    it("formats gigabytes", () => {
      expect(formatBytes(1073741824)).toBe("1.0 GB");
    });
  });

  // -----------------------------------------------------------------------
  // estimateTokens
  // -----------------------------------------------------------------------

  describe("estimateTokens", () => {
    it("returns 0 for empty string", () => {
      expect(estimateTokens("")).toBe(0);
    });

    it("estimates ~4 chars per token", () => {
      const text = "a".repeat(100);
      expect(estimateTokens(text)).toBe(25);
    });

    it("rounds to nearest integer", () => {
      expect(estimateTokens("ab")).toBe(1); // 2/4 = 0.5, rounds to 1
    });
  });

  // -----------------------------------------------------------------------
  // formatNumber
  // -----------------------------------------------------------------------

  describe("formatNumber", () => {
    it("returns 0 for non-finite numbers", () => {
      expect(formatNumber(NaN)).toBe("0");
      expect(formatNumber(Infinity)).toBe("0");
    });

    it("returns number as-is below 1000", () => {
      expect(formatNumber(42)).toBe("42");
      expect(formatNumber(999)).toBe("999");
    });

    it("formats thousands with K suffix", () => {
      expect(formatNumber(1000)).toBe("1.0K");
      expect(formatNumber(5500)).toBe("5.5K");
    });

    it("formats millions with M suffix", () => {
      expect(formatNumber(1000000)).toBe("1.0M");
      expect(formatNumber(2500000)).toBe("2.5M");
    });
  });
});
