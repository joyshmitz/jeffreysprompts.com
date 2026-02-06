/**
 * Unit tests for report-store
 * @module lib/reporting/report-store.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  isReportReason,
  isReportContentType,
  getReportReasonLabel,
  createContentReport,
  getContentReport,
  listContentReports,
  getReportStats,
  updateContentReport,
  hasRecentReport,
} from "./report-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_content_report_store__"];
}

function seedReport(overrides?: Record<string, unknown>) {
  return createContentReport({
    contentType: "prompt",
    contentId: `p-${crypto.randomUUID().slice(0, 8)}`,
    reason: "spam",
    reporter: { id: "reporter-1" },
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("report-store", () => {
  beforeEach(() => {
    clearStore();
  });

  // -----------------------------------------------------------------------
  // Type guards & labels
  // -----------------------------------------------------------------------

  describe("isReportReason", () => {
    it("returns true for valid reasons", () => {
      expect(isReportReason("spam")).toBe(true);
      expect(isReportReason("offensive")).toBe(true);
      expect(isReportReason("copyright")).toBe(true);
      expect(isReportReason("harmful")).toBe(true);
      expect(isReportReason("other")).toBe(true);
    });

    it("returns false for invalid reasons", () => {
      expect(isReportReason("unknown")).toBe(false);
      expect(isReportReason("")).toBe(false);
    });
  });

  describe("isReportContentType", () => {
    it("returns true for valid content types", () => {
      expect(isReportContentType("prompt")).toBe(true);
      expect(isReportContentType("bundle")).toBe(true);
      expect(isReportContentType("workflow")).toBe(true);
      expect(isReportContentType("collection")).toBe(true);
    });

    it("returns false for invalid content types", () => {
      expect(isReportContentType("invalid")).toBe(false);
    });
  });

  describe("getReportReasonLabel", () => {
    it("returns label for known reasons", () => {
      expect(getReportReasonLabel("spam")).toBe("Spam or misleading content");
      expect(getReportReasonLabel("harmful")).toBe("Contains harmful content");
    });

    it("returns the value itself for unknown reasons", () => {
      expect(getReportReasonLabel("unknown-reason")).toBe("unknown-reason");
    });
  });

  // -----------------------------------------------------------------------
  // createContentReport
  // -----------------------------------------------------------------------

  describe("createContentReport", () => {
    it("creates a report with correct fields", () => {
      const report = createContentReport({
        contentType: "prompt",
        contentId: "p1",
        reason: "spam",
        details: "This is spam content.",
        contentTitle: "Bad Prompt",
        reporter: { id: "r1", name: "Reporter" },
      });

      expect(report.id).toBeTruthy();
      expect(report.contentType).toBe("prompt");
      expect(report.contentId).toBe("p1");
      expect(report.reason).toBe("spam");
      expect(report.details).toBe("This is spam content.");
      expect(report.contentTitle).toBe("Bad Prompt");
      expect(report.status).toBe("pending");
      expect(report.reporter.id).toBe("r1");
      expect(report.reporter.name).toBe("Reporter");
      expect(report.createdAt).toBeTruthy();
      expect(report.reviewedAt).toBeNull();
      expect(report.action).toBeNull();
    });

    it("defaults optional fields", () => {
      const report = createContentReport({
        contentType: "prompt",
        contentId: "p1",
        reason: "other",
      });

      expect(report.contentTitle).toBeNull();
      expect(report.details).toBeNull();
      expect(report.reporter.id).toBe("anonymous");
      expect(report.reporter.name).toBe("Anonymous");
      expect(report.authorTier).toBe("standard");
    });

    it("assigns unique IDs", () => {
      const r1 = seedReport();
      const r2 = seedReport();
      expect(r1.id).not.toBe(r2.id);
    });

    it("stores author tier", () => {
      const report = createContentReport({
        contentType: "prompt",
        contentId: "p1",
        reason: "spam",
        authorTier: "premium",
      });
      expect(report.authorTier).toBe("premium");
    });
  });

  // -----------------------------------------------------------------------
  // getContentReport
  // -----------------------------------------------------------------------

  describe("getContentReport", () => {
    it("returns report by ID", () => {
      const report = seedReport();
      expect(getContentReport(report.id)?.id).toBe(report.id);
    });

    it("returns null for unknown ID", () => {
      expect(getContentReport("nope")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // listContentReports
  // -----------------------------------------------------------------------

  describe("listContentReports", () => {
    it("returns all reports by default", () => {
      seedReport();
      seedReport();
      const reports = listContentReports();
      expect(reports).toHaveLength(2);
    });

    it("includes priority info in results", () => {
      seedReport();
      const reports = listContentReports();
      expect(reports[0].priority).toBeDefined();
      expect(reports[0].priority.score).toBeGreaterThanOrEqual(0);
      expect(reports[0].priority.level).toBeTruthy();
    });

    it("filters by status", () => {
      const r1 = seedReport();
      seedReport();
      updateContentReport({ reportId: r1.id, action: "dismiss" });

      const pending = listContentReports({ status: "pending" });
      expect(pending).toHaveLength(1);

      const dismissed = listContentReports({ status: "dismissed" });
      expect(dismissed).toHaveLength(1);
    });

    it("filters by content type", () => {
      seedReport({ contentType: "prompt" });
      seedReport({ contentType: "bundle" });

      const prompts = listContentReports({ contentType: "prompt" });
      expect(prompts).toHaveLength(1);
      expect(prompts[0].contentType).toBe("prompt");
    });

    it("filters by reason", () => {
      seedReport({ reason: "spam" });
      seedReport({ reason: "harmful" });

      const spam = listContentReports({ reason: "spam" });
      expect(spam).toHaveLength(1);
    });

    it("returns all when filter is 'all'", () => {
      seedReport({ reason: "spam" });
      seedReport({ reason: "harmful" });
      expect(listContentReports({ reason: "all" })).toHaveLength(2);
      expect(listContentReports({ status: "all" })).toHaveLength(2);
      expect(listContentReports({ contentType: "all" })).toHaveLength(2);
    });

    it("sorts by priority by default", () => {
      // harmful > spam in severity
      seedReport({ reason: "spam" });
      seedReport({ reason: "harmful" });

      const reports = listContentReports();
      expect(reports[0].reason).toBe("harmful");
    });

    it("respects limit and pagination", () => {
      for (let i = 0; i < 5; i++) seedReport();
      const page1 = listContentReports({ limit: 2, page: 1 });
      const page2 = listContentReports({ limit: 2, page: 2 });
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  // -----------------------------------------------------------------------
  // getReportStats
  // -----------------------------------------------------------------------

  describe("getReportStats", () => {
    it("returns zeroed stats when empty", () => {
      const stats = getReportStats();
      expect(stats.pending).toBe(0);
      expect(stats.reviewed).toBe(0);
      expect(stats.actioned).toBe(0);
      expect(stats.dismissed).toBe(0);
    });

    it("counts reports by status", () => {
      const r1 = seedReport();
      seedReport();
      seedReport();
      updateContentReport({ reportId: r1.id, action: "dismiss" });

      const stats = getReportStats();
      expect(stats.pending).toBe(2);
      expect(stats.dismissed).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // updateContentReport
  // -----------------------------------------------------------------------

  describe("updateContentReport", () => {
    it("sets action and updates status to actioned", () => {
      const report = seedReport();
      const updated = updateContentReport({ reportId: report.id, action: "warn" });
      expect(updated?.action).toBe("warn");
      expect(updated?.status).toBe("actioned");
      expect(updated?.reviewedAt).toBeTruthy();
    });

    it("sets status to dismissed for dismiss action", () => {
      const report = seedReport();
      const updated = updateContentReport({ reportId: report.id, action: "dismiss" });
      expect(updated?.status).toBe("dismissed");
    });

    it("stores reviewer info", () => {
      const report = seedReport();
      const updated = updateContentReport({
        reportId: report.id,
        action: "remove",
        reviewerId: "admin-1",
        notes: "Confirmed violation.",
      });
      expect(updated?.reviewedBy).toBe("admin-1");
      expect(updated?.reviewNotes).toBe("Confirmed violation.");
    });

    it("returns null for unknown report", () => {
      expect(updateContentReport({ reportId: "nope", action: "dismiss" })).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // hasRecentReport
  // -----------------------------------------------------------------------

  describe("hasRecentReport", () => {
    it("returns true when recent report exists", () => {
      createContentReport({
        contentType: "prompt",
        contentId: "p1",
        reason: "spam",
        reporter: { id: "r1" },
      });

      expect(
        hasRecentReport({
          contentType: "prompt",
          contentId: "p1",
          reporterId: "r1",
          windowMs: 60_000,
        })
      ).toBe(true);
    });

    it("returns false for different reporter", () => {
      createContentReport({
        contentType: "prompt",
        contentId: "p1",
        reason: "spam",
        reporter: { id: "r1" },
      });

      expect(
        hasRecentReport({
          contentType: "prompt",
          contentId: "p1",
          reporterId: "r2",
          windowMs: 60_000,
        })
      ).toBe(false);
    });

    it("returns false for different content", () => {
      createContentReport({
        contentType: "prompt",
        contentId: "p1",
        reason: "spam",
        reporter: { id: "r1" },
      });

      expect(
        hasRecentReport({
          contentType: "prompt",
          contentId: "p2",
          reporterId: "r1",
          windowMs: 60_000,
        })
      ).toBe(false);
    });

    it("returns false when no reports exist", () => {
      expect(
        hasRecentReport({
          contentType: "prompt",
          contentId: "p1",
          reporterId: "r1",
          windowMs: 60_000,
        })
      ).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Priority scoring
  // -----------------------------------------------------------------------

  describe("priority scoring", () => {
    it("harmful reports get higher priority than spam", () => {
      seedReport({ reason: "harmful", contentId: "p1" });
      seedReport({ reason: "spam", contentId: "p2" });

      const reports = listContentReports({ sort: "priority" });
      expect(reports[0].reason).toBe("harmful");
      expect(reports[0].priority.score).toBeGreaterThan(reports[1].priority.score);
    });

    it("multiple reports on same content increase priority", () => {
      seedReport({ contentType: "prompt", contentId: "contested", reporter: { id: "r1" } });
      seedReport({ contentType: "prompt", contentId: "contested", reporter: { id: "r2" } });
      seedReport({ contentType: "prompt", contentId: "solo", reporter: { id: "r3" } });

      const reports = listContentReports({ sort: "priority" });
      const contested = reports.filter((r) => r.contentId === "contested");
      const solo = reports.filter((r) => r.contentId === "solo");

      expect(contested[0].priority.reportCount).toBe(2);
      expect(solo[0].priority.reportCount).toBe(1);
    });

    it("premium author tier reduces priority score", () => {
      seedReport({ reason: "spam", contentId: "standard-p", authorTier: "standard" });
      seedReport({ reason: "spam", contentId: "premium-p", authorTier: "premium" });

      const reports = listContentReports({ sort: "priority" });
      const standard = reports.find((r) => r.contentId === "standard-p")!;
      const premium = reports.find((r) => r.contentId === "premium-p")!;

      expect(standard.priority.score).toBeGreaterThan(premium.priority.score);
    });

    it("assigns SLA status based on age", () => {
      const report = seedReport();
      const reports = listContentReports();
      // New report should be "ok"
      expect(reports.find((r) => r.id === report.id)?.priority.slaStatus).toBe("ok");
    });

    it("has valid priority levels", () => {
      seedReport();
      const reports = listContentReports();
      const validLevels = ["critical", "high", "medium", "low"];
      expect(validLevels).toContain(reports[0].priority.level);
    });
  });
});
