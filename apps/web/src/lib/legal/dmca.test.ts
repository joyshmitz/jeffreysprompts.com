/**
 * Unit tests for dmca store
 * @module lib/legal/dmca.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  isDmcaStatus,
  createDmcaRequest,
  getDmcaRequest,
  listDmcaRequests,
  getDmcaStats,
  submitCounterNotice,
  updateDmcaRequestStatus,
  issueCopyrightStrike,
  getActiveStrikeCount,
  DMCA_STATUSES,
} from "./dmca";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_dmca_store__"];
}

function seedRequest(overrides?: Record<string, unknown>) {
  return createDmcaRequest({
    claimantName: "John Doe",
    claimantEmail: "john@example.com",
    claimantAddress: "123 Main St",
    copyrightedWorkDescription: "Original blog post about AI prompts",
    infringingContentUrl: "https://jeffreysprompts.com/prompts/test",
    signature: "John Doe",
    signatureDate: "2026-02-01",
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("dmca", () => {
  beforeEach(() => {
    clearStore();
  });

  // -----------------------------------------------------------------------
  // Type guards & constants
  // -----------------------------------------------------------------------

  describe("isDmcaStatus", () => {
    it("returns true for valid statuses", () => {
      expect(isDmcaStatus("pending")).toBe(true);
      expect(isDmcaStatus("removed")).toBe(true);
      expect(isDmcaStatus("counter_pending")).toBe(true);
      expect(isDmcaStatus("restored")).toBe(true);
      expect(isDmcaStatus("dismissed")).toBe(true);
    });

    it("returns false for invalid status", () => {
      expect(isDmcaStatus("invalid")).toBe(false);
    });
  });

  describe("DMCA_STATUSES", () => {
    it("has all five statuses", () => {
      expect(DMCA_STATUSES).toHaveLength(5);
    });
  });

  // -----------------------------------------------------------------------
  // createDmcaRequest
  // -----------------------------------------------------------------------

  describe("createDmcaRequest", () => {
    it("creates a request with correct fields", () => {
      const request = createDmcaRequest({
        claimantName: "  Jane Doe  ",
        claimantEmail: "  Jane@Example.COM  ",
        claimantAddress: "  456 Oak Ave  ",
        copyrightedWorkDescription: "My original work",
        infringingContentUrl: "https://example.com/infringing",
        signature: "  Jane Doe  ",
        signatureDate: "2026-02-01",
        contentType: "prompt",
        contentId: "p-123",
        contentOwnerId: "owner-1",
      });

      expect(request.id).toBeTruthy();
      expect(request.claimantName).toBe("Jane Doe"); // trimmed
      expect(request.claimantEmail).toBe("jane@example.com"); // normalized
      expect(request.claimantAddress).toBe("456 Oak Ave");
      expect(request.signature).toBe("Jane Doe");
      expect(request.status).toBe("pending");
      expect(request.contentType).toBe("prompt");
      expect(request.contentId).toBe("p-123");
      expect(request.contentOwnerId).toBe("owner-1");
      expect(request.counterNoticeAt).toBeNull();
      expect(request.resolvedAt).toBeNull();
      expect(request.resolution).toBeNull();
    });

    it("defaults optional fields to null", () => {
      const request = seedRequest();
      expect(request.copyrightedWorkUrl).toBeNull();
      expect(request.contentType).toBeNull();
      expect(request.contentId).toBeNull();
      expect(request.contentOwnerId).toBeNull();
    });

    it("assigns unique IDs", () => {
      const r1 = seedRequest();
      const r2 = seedRequest();
      expect(r1.id).not.toBe(r2.id);
    });
  });

  // -----------------------------------------------------------------------
  // getDmcaRequest
  // -----------------------------------------------------------------------

  describe("getDmcaRequest", () => {
    it("returns request by ID", () => {
      const request = seedRequest();
      expect(getDmcaRequest(request.id)?.id).toBe(request.id);
    });

    it("returns null for unknown ID", () => {
      expect(getDmcaRequest("nope")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // listDmcaRequests
  // -----------------------------------------------------------------------

  describe("listDmcaRequests", () => {
    it("returns all requests", () => {
      seedRequest();
      seedRequest();
      expect(listDmcaRequests()).toHaveLength(2);
    });

    it("filters by status", () => {
      const r1 = seedRequest();
      seedRequest();
      updateDmcaRequestStatus({ requestId: r1.id, status: "dismissed" });

      expect(listDmcaRequests({ status: "pending" })).toHaveLength(1);
      expect(listDmcaRequests({ status: "dismissed" })).toHaveLength(1);
    });

    it("returns all when status is 'all'", () => {
      seedRequest();
      const r2 = seedRequest();
      updateDmcaRequestStatus({ requestId: r2.id, status: "dismissed" });
      expect(listDmcaRequests({ status: "all" })).toHaveLength(2);
    });

    it("supports search", () => {
      seedRequest({ claimantName: "Alice Smith" });
      seedRequest({ claimantName: "Bob Jones" });

      expect(listDmcaRequests({ search: "alice" })).toHaveLength(1);
      expect(listDmcaRequests({ search: "bob" })).toHaveLength(1);
    });

    it("respects limit and pagination", () => {
      for (let i = 0; i < 5; i++) seedRequest();
      const page1 = listDmcaRequests({ limit: 2, page: 1 });
      const page2 = listDmcaRequests({ limit: 2, page: 2 });
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  // -----------------------------------------------------------------------
  // getDmcaStats
  // -----------------------------------------------------------------------

  describe("getDmcaStats", () => {
    it("returns zeroed stats when empty", () => {
      const stats = getDmcaStats();
      expect(stats.pending).toBe(0);
      expect(stats.removed).toBe(0);
      expect(stats.counter_pending).toBe(0);
      expect(stats.restored).toBe(0);
      expect(stats.dismissed).toBe(0);
    });

    it("counts requests by status", () => {
      seedRequest();
      seedRequest();
      const r3 = seedRequest();
      updateDmcaRequestStatus({ requestId: r3.id, status: "dismissed" });

      const stats = getDmcaStats();
      expect(stats.pending).toBe(2);
      expect(stats.dismissed).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // submitCounterNotice
  // -----------------------------------------------------------------------

  describe("submitCounterNotice", () => {
    it("submits a counter notice", () => {
      const request = seedRequest();
      const updated = submitCounterNotice({
        requestId: request.id,
        name: "Counter Person",
        email: "counter@example.com",
        address: "789 Elm St",
        statement: "I am the original author.",
        signature: "Counter Person",
      });

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe("counter_pending");
      expect(updated?.counterNoticeAt).toBeTruthy();
      expect(updated?.counterNoticeContent).toBe("I am the original author.");
      expect(updated?.counterName).toBe("Counter Person");
      expect(updated?.counterEmail).toBe("counter@example.com");
    });

    it("returns null for unknown request", () => {
      expect(
        submitCounterNotice({
          requestId: "nope",
          name: "N",
          email: "n@example.com",
          address: "N",
          statement: "N",
          signature: "N",
        })
      ).toBeNull();
    });

    it("returns null for dismissed request", () => {
      const request = seedRequest();
      updateDmcaRequestStatus({ requestId: request.id, status: "dismissed" });

      expect(
        submitCounterNotice({
          requestId: request.id,
          name: "N",
          email: "n@example.com",
          address: "N",
          statement: "N",
          signature: "N",
        })
      ).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // updateDmcaRequestStatus
  // -----------------------------------------------------------------------

  describe("updateDmcaRequestStatus", () => {
    it("updates status to removed", () => {
      const request = seedRequest();
      const updated = updateDmcaRequestStatus({
        requestId: request.id,
        status: "removed",
        resolvedBy: "admin-1",
        reviewNotes: "Confirmed infringement.",
      });

      expect(updated?.status).toBe("removed");
      expect(updated?.resolvedAt).toBeTruthy();
      expect(updated?.resolvedBy).toBe("admin-1");
      expect(updated?.reviewNotes).toBe("Confirmed infringement.");
      expect(updated?.resolution).toBe("removed");
    });

    it("updates status to dismissed", () => {
      const request = seedRequest();
      const updated = updateDmcaRequestStatus({
        requestId: request.id,
        status: "dismissed",
      });
      expect(updated?.status).toBe("dismissed");
      expect(updated?.resolvedAt).toBeTruthy();
    });

    it("auto-issues copyright strike on removal with content owner", () => {
      const request = seedRequest({ contentOwnerId: "user-1" });
      updateDmcaRequestStatus({ requestId: request.id, status: "removed" });

      expect(getActiveStrikeCount("user-1")).toBe(1);
    });

    it("does not issue strike without content owner", () => {
      const request = seedRequest();
      updateDmcaRequestStatus({ requestId: request.id, status: "removed" });
      // No owner, no strike
      expect(getActiveStrikeCount("nobody")).toBe(0);
    });

    it("returns null for unknown request", () => {
      expect(
        updateDmcaRequestStatus({ requestId: "nope", status: "dismissed" })
      ).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Copyright strikes
  // -----------------------------------------------------------------------

  describe("issueCopyrightStrike", () => {
    it("creates a copyright strike", () => {
      const strike = issueCopyrightStrike({
        userId: "user-1",
        dmcaRequestId: "req-1",
        reason: "DMCA takedown",
      });

      expect(strike.id).toBeTruthy();
      expect(strike.userId).toBe("user-1");
      expect(strike.dmcaRequestId).toBe("req-1");
      expect(strike.reason).toBe("DMCA takedown");
      expect(strike.issuedAt).toBeTruthy();
      expect(strike.expiresAt).toBeNull();
    });

    it("supports expiration date", () => {
      const strike = issueCopyrightStrike({
        userId: "user-1",
        dmcaRequestId: "req-1",
        reason: "DMCA",
        expiresAt: "2027-01-01T00:00:00Z",
      });
      expect(strike.expiresAt).toBe("2027-01-01T00:00:00Z");
    });
  });

  describe("getActiveStrikeCount", () => {
    it("counts active strikes for a user", () => {
      issueCopyrightStrike({ userId: "user-1", dmcaRequestId: "r1", reason: "DMCA" });
      issueCopyrightStrike({ userId: "user-1", dmcaRequestId: "r2", reason: "DMCA" });
      issueCopyrightStrike({ userId: "user-2", dmcaRequestId: "r3", reason: "DMCA" });

      expect(getActiveStrikeCount("user-1")).toBe(2);
      expect(getActiveStrikeCount("user-2")).toBe(1);
    });

    it("excludes expired strikes", () => {
      issueCopyrightStrike({
        userId: "user-1",
        dmcaRequestId: "r1",
        reason: "DMCA",
        expiresAt: "2020-01-01T00:00:00Z", // expired
      });
      issueCopyrightStrike({
        userId: "user-1",
        dmcaRequestId: "r2",
        reason: "DMCA",
        expiresAt: "2099-01-01T00:00:00Z", // not expired
      });

      expect(getActiveStrikeCount("user-1")).toBe(1);
    });

    it("treats strikes without expiration as active", () => {
      issueCopyrightStrike({
        userId: "user-1",
        dmcaRequestId: "r1",
        reason: "DMCA",
      });

      expect(getActiveStrikeCount("user-1")).toBe(1);
    });

    it("returns 0 for user with no strikes", () => {
      expect(getActiveStrikeCount("nobody")).toBe(0);
    });
  });
});
