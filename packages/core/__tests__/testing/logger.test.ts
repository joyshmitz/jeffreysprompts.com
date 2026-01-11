import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { TestLogger } from "../../src/testing/logger";
import { existsSync, readFileSync, rmSync, mkdirSync } from "fs";
import { join } from "path";

const TEST_LOG_DIR = "/tmp/test-logger-tests";

describe("TestLogger", () => {
  beforeEach(() => {
    mkdirSync(TEST_LOG_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_LOG_DIR, { recursive: true, force: true });
  });

  describe("basic logging", () => {
    it("should create entries for each log level", () => {
      const logger = new TestLogger({
        testName: "basic-test",
        minLevel: "debug",
        consoleOutput: false,
      });

      logger.debug("debug message");
      logger.info("info message");
      logger.step("step message");
      logger.error("error message");

      const entries = logger.getEntries();
      expect(entries).toHaveLength(4);
      expect(entries[0].level).toBe("debug");
      expect(entries[1].level).toBe("info");
      expect(entries[2].level).toBe("step");
      expect(entries[3].level).toBe("error");
    });

    it("should filter by minimum level", () => {
      const logger = new TestLogger({
        testName: "filter-test",
        minLevel: "step",
        consoleOutput: false,
      });

      logger.debug("debug message"); // should be filtered
      logger.info("info message"); // should be filtered
      logger.step("step message");
      logger.error("error message");

      const entries = logger.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].level).toBe("step");
      expect(entries[1].level).toBe("error");
    });

    it("should include context in entries", () => {
      const logger = new TestLogger({
        testName: "context-test",
        consoleOutput: false,
      });

      logger.info("test message");

      const entries = logger.getEntries();
      expect(entries[0].context).toBe("context-test");
    });

    it("should include data in entries", () => {
      const logger = new TestLogger({
        testName: "data-test",
        consoleOutput: false,
      });

      logger.info("test message", { foo: "bar", count: 42 });

      const entries = logger.getEntries();
      expect(entries[0].data).toEqual({ foo: "bar", count: 42 });
    });
  });

  describe("step counting", () => {
    it("should auto-increment step numbers", () => {
      const logger = new TestLogger({
        testName: "step-test",
        consoleOutput: false,
      });

      logger.step("First step");
      logger.step("Second step");
      logger.step("Third step");

      const entries = logger.getEntries();
      expect(entries[0].message).toContain("[Step 1]");
      expect(entries[1].message).toContain("[Step 2]");
      expect(entries[2].message).toContain("[Step 3]");
    });
  });

  describe("timing", () => {
    it("should track duration since creation", async () => {
      const logger = new TestLogger({
        testName: "timing-test",
        consoleOutput: false,
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      logger.info("after wait");

      const entries = logger.getEntries();
      expect(entries[0].durationMs).toBeGreaterThanOrEqual(50);
    });

    it("should measure operation duration with startTimer", async () => {
      const logger = new TestLogger({
        testName: "timer-test",
        minLevel: "debug",
        consoleOutput: false,
      });

      const done = logger.startTimer("slow operation");
      await new Promise((resolve) => setTimeout(resolve, 50));
      done();

      const entries = logger.getEntries();
      const completedEntry = entries.find((e) => e.message.includes("Completed"));
      expect(completedEntry?.data?.durationMs).toBeGreaterThanOrEqual(50);
    });

    it("should report total duration via getDuration()", async () => {
      const logger = new TestLogger({
        testName: "duration-test",
        consoleOutput: false,
      });

      // Wait 60ms and expect at least 50ms to account for timer precision
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(logger.getDuration()).toBeGreaterThanOrEqual(50);
    });
  });

  describe("file output", () => {
    it("should write entries to file in text format", () => {
      const logFile = join(TEST_LOG_DIR, "text-output.log");
      const logger = new TestLogger({
        testName: "file-text-test",
        outputFile: logFile,
        format: "text",
        consoleOutput: false,
      });

      logger.info("test message");
      logger.step("test step");

      expect(existsSync(logFile)).toBe(true);

      const content = readFileSync(logFile, "utf-8");
      expect(content).toContain("=== Test: file-text-test ===");
      expect(content).toContain("test message");
      expect(content).toContain("test step");
    });

    it("should write entries to file in JSON format", () => {
      const logFile = join(TEST_LOG_DIR, "json-output.log");
      const logger = new TestLogger({
        testName: "file-json-test",
        outputFile: logFile,
        format: "json",
        consoleOutput: false,
      });

      logger.info("test message", { key: "value" });
      logger.error("error message");

      expect(existsSync(logFile)).toBe(true);

      const lines = readFileSync(logFile, "utf-8").trim().split("\n");
      expect(lines.length).toBe(2);

      const firstEntry = JSON.parse(lines[0]);
      expect(firstEntry.level).toBe("info");
      expect(firstEntry.message).toBe("test message");
      expect(firstEntry.data).toEqual({ key: "value" });
    });

    it("should create parent directories for output file", () => {
      const logFile = join(TEST_LOG_DIR, "nested", "deep", "output.log");
      const logger = new TestLogger({
        testName: "nested-dir-test",
        outputFile: logFile,
        consoleOutput: false,
      });

      logger.info("test");

      expect(existsSync(logFile)).toBe(true);
    });
  });

  describe("error tracking", () => {
    it("should report hasErrors() correctly", () => {
      const logger = new TestLogger({
        testName: "error-test",
        consoleOutput: false,
      });

      expect(logger.hasErrors()).toBe(false);

      logger.info("normal message");
      expect(logger.hasErrors()).toBe(false);

      logger.error("error message");
      expect(logger.hasErrors()).toBe(true);
    });

    it("should filter entries by level", () => {
      const logger = new TestLogger({
        testName: "filter-level-test",
        minLevel: "debug",
        consoleOutput: false,
      });

      logger.debug("debug 1");
      logger.info("info 1");
      logger.debug("debug 2");
      logger.error("error 1");

      const debugEntries = logger.getEntriesByLevel("debug");
      expect(debugEntries).toHaveLength(2);

      const errorEntries = logger.getEntriesByLevel("error");
      expect(errorEntries).toHaveLength(1);
    });
  });

  describe("summary", () => {
    it("should output summary with counts", () => {
      const logFile = join(TEST_LOG_DIR, "summary.log");
      const logger = new TestLogger({
        testName: "summary-test",
        outputFile: logFile,
        format: "text",
        consoleOutput: false,
      });

      logger.step("step 1");
      logger.step("step 2");
      logger.info("info");

      logger.summary();

      const content = readFileSync(logFile, "utf-8");
      expect(content).toContain("=== Summary: summary-test ===");
      expect(content).toContain("Steps: 2");
      expect(content).toContain("Errors: 0");
      expect(content).toContain("Status: PASSED");
    });

    it("should report FAILED status when errors exist", () => {
      const logFile = join(TEST_LOG_DIR, "summary-failed.log");
      const logger = new TestLogger({
        testName: "summary-failed-test",
        outputFile: logFile,
        format: "text",
        consoleOutput: false,
      });

      logger.error("something went wrong");
      logger.summary();

      const content = readFileSync(logFile, "utf-8");
      expect(content).toContain("Errors: 1");
      expect(content).toContain("Status: FAILED");
    });
  });
});
