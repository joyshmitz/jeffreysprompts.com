/**
 * Unit tests for moderation action-store
 * @module lib/moderation/action-store.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  isModerationReason,
  getModerationReasonLabel,
  getActionSeverity,
  getActionTypeLabel,
  createModerationAction,
  getModerationAction,
  listModerationActions,
  getUserModerationHistory,
  // getActiveActionsForUser tested indirectly via checkUserStatus
  checkUserStatus,
  reverseModerationAction,
  getModerationStats,
  hasRecentAction,
} from "./action-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_moderation_action_store__"];
}

function seedAction(overrides?: Record<string, unknown>) {
  return createModerationAction({
    userId: `user-${crypto.randomUUID().slice(0, 8)}`,
    actionType: "warning",
    reason: "spam",
    performedBy: "admin-1",
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("action-store", () => {
  beforeEach(() => {
    clearStore();
  });

  // -----------------------------------------------------------------------
  // Type guards & labels
  // -----------------------------------------------------------------------

  describe("isModerationReason", () => {
    it("returns true for valid reasons", () => {
      expect(isModerationReason("spam")).toBe(true);
      expect(isModerationReason("harassment")).toBe(true);
      expect(isModerationReason("hate_speech")).toBe(true);
      expect(isModerationReason("other")).toBe(true);
    });

    it("returns false for invalid reasons", () => {
      expect(isModerationReason("invalid")).toBe(false);
    });
  });

  describe("getModerationReasonLabel", () => {
    it("returns label for known reasons", () => {
      expect(getModerationReasonLabel("spam")).toBe("Spam or misleading content");
      expect(getModerationReasonLabel("harassment")).toBe("Harassment or abuse");
    });

    it("returns value itself for unknown reasons", () => {
      expect(getModerationReasonLabel("unknown")).toBe("unknown");
    });
  });

  describe("getActionSeverity", () => {
    it("returns increasing severity", () => {
      expect(getActionSeverity("warning")).toBeLessThan(getActionSeverity("suspension"));
      expect(getActionSeverity("suspension")).toBeLessThan(getActionSeverity("indefinite_suspension"));
      expect(getActionSeverity("indefinite_suspension")).toBeLessThan(getActionSeverity("ban"));
    });
  });

  describe("getActionTypeLabel", () => {
    it("returns label for known types", () => {
      expect(getActionTypeLabel("warning")).toBe("Warning");
      expect(getActionTypeLabel("ban")).toBe("Permanent Ban");
    });
  });

  // -----------------------------------------------------------------------
  // createModerationAction
  // -----------------------------------------------------------------------

  describe("createModerationAction", () => {
    it("creates a moderation action", () => {
      const action = createModerationAction({
        userId: "user-1",
        actionType: "warning",
        reason: "spam",
        performedBy: "admin-1",
        details: "First offense.",
      });

      expect(action.id).toBeTruthy();
      expect(action.userId).toBe("user-1");
      expect(action.actionType).toBe("warning");
      expect(action.reason).toBe("spam");
      expect(action.performedBy).toBe("admin-1");
      expect(action.details).toBe("First offense.");
      expect(action.severity).toBe(getActionSeverity("warning"));
      expect(action.reversedAt).toBeNull();
    });

    it("sets endsAt for suspension with duration", () => {
      const action = createModerationAction({
        userId: "user-1",
        actionType: "suspension",
        reason: "harassment",
        performedBy: "admin-1",
        durationDays: 7,
      });

      expect(action.endsAt).toBeTruthy();
      const endsAt = new Date(action.endsAt!).getTime();
      const startsAt = new Date(action.startsAt).getTime();
      const dayMs = 7 * 24 * 60 * 60 * 1000;
      expect(endsAt - startsAt).toBeCloseTo(dayMs, -3); // within a second
    });

    it("does not set endsAt for non-suspension types", () => {
      const warning = createModerationAction({
        userId: "user-1",
        actionType: "warning",
        reason: "spam",
        performedBy: "admin-1",
        durationDays: 7,
      });
      expect(warning.endsAt).toBeNull();

      const ban = createModerationAction({
        userId: "user-2",
        actionType: "ban",
        reason: "harassment",
        performedBy: "admin-1",
        durationDays: 7,
      });
      expect(ban.endsAt).toBeNull();
    });

    it("defaults optional fields to null", () => {
      const action = seedAction();
      expect(action.contentId).toBeNull();
      expect(action.contentType).toBeNull();
      expect(action.details).toBeNull();
      expect(action.internalNotes).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getModerationAction
  // -----------------------------------------------------------------------

  describe("getModerationAction", () => {
    it("returns action by ID", () => {
      const action = seedAction();
      expect(getModerationAction(action.id)?.id).toBe(action.id);
    });

    it("returns null for unknown ID", () => {
      expect(getModerationAction("nope")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // listModerationActions
  // -----------------------------------------------------------------------

  describe("listModerationActions", () => {
    it("returns all active actions", () => {
      seedAction();
      seedAction();
      expect(listModerationActions()).toHaveLength(2);
    });

    it("filters by userId", () => {
      seedAction({ userId: "u1" });
      seedAction({ userId: "u2" });
      const u1Actions = listModerationActions({ userId: "u1" });
      expect(u1Actions).toHaveLength(1);
      expect(u1Actions[0].userId).toBe("u1");
    });

    it("filters by actionType", () => {
      seedAction({ actionType: "warning" });
      seedAction({ actionType: "ban" });
      const warnings = listModerationActions({ actionType: "warning" });
      expect(warnings).toHaveLength(1);
    });

    it("excludes reversed actions by default", () => {
      const action = seedAction();
      reverseModerationAction({ actionId: action.id, reversedBy: "admin" });
      expect(listModerationActions()).toHaveLength(0);
    });

    it("includes reversed when flag is set", () => {
      const action = seedAction();
      reverseModerationAction({ actionId: action.id, reversedBy: "admin" });
      expect(listModerationActions({ includeReversed: true })).toHaveLength(1);
    });

    it("respects pagination", () => {
      for (let i = 0; i < 5; i++) seedAction();
      const page1 = listModerationActions({ limit: 2, page: 1 });
      const page2 = listModerationActions({ limit: 2, page: 2 });
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // getUserModerationHistory
  // -----------------------------------------------------------------------

  describe("getUserModerationHistory", () => {
    it("returns all actions for user including reversed", () => {
      const a1 = createModerationAction({
        userId: "u1", actionType: "warning", reason: "spam", performedBy: "admin",
      });
      createModerationAction({
        userId: "u1", actionType: "suspension", reason: "harassment", performedBy: "admin",
      });
      reverseModerationAction({ actionId: a1.id, reversedBy: "admin" });

      const history = getUserModerationHistory("u1");
      expect(history).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // checkUserStatus
  // -----------------------------------------------------------------------

  describe("checkUserStatus", () => {
    it("returns active for user with no actions", () => {
      expect(checkUserStatus("clean-user").status).toBe("active");
    });

    it("returns warning for warned user", () => {
      createModerationAction({
        userId: "warned",
        actionType: "warning",
        reason: "spam",
        performedBy: "admin",
      });
      const status = checkUserStatus("warned");
      expect(status.status).toBe("warning");
      expect(status.actionType).toBe("warning");
    });

    it("returns suspended for suspended user", () => {
      createModerationAction({
        userId: "suspended",
        actionType: "suspension",
        reason: "harassment",
        performedBy: "admin",
        durationDays: 7,
      });
      const status = checkUserStatus("suspended");
      expect(status.status).toBe("suspended");
      expect(status.endsAt).toBeTruthy();
    });

    it("returns banned for banned user", () => {
      createModerationAction({
        userId: "banned",
        actionType: "ban",
        reason: "hate_speech",
        performedBy: "admin",
      });
      const status = checkUserStatus("banned");
      expect(status.status).toBe("banned");
    });

    it("returns most severe status when multiple actions exist", () => {
      createModerationAction({
        userId: "multi",
        actionType: "warning",
        reason: "spam",
        performedBy: "admin",
      });
      createModerationAction({
        userId: "multi",
        actionType: "ban",
        reason: "repeated_violations",
        performedBy: "admin",
      });
      expect(checkUserStatus("multi").status).toBe("banned");
    });

    it("returns active after action is reversed", () => {
      const action = createModerationAction({
        userId: "forgiven",
        actionType: "ban",
        reason: "spam",
        performedBy: "admin",
      });
      reverseModerationAction({ actionId: action.id, reversedBy: "admin" });
      expect(checkUserStatus("forgiven").status).toBe("active");
    });
  });

  // -----------------------------------------------------------------------
  // reverseModerationAction
  // -----------------------------------------------------------------------

  describe("reverseModerationAction", () => {
    it("reverses an action", () => {
      const action = seedAction();
      const reversed = reverseModerationAction({
        actionId: action.id,
        reversedBy: "admin-2",
        reason: "Mistake",
      });

      expect(reversed?.reversedAt).toBeTruthy();
      expect(reversed?.reversedBy).toBe("admin-2");
      expect(reversed?.reversalReason).toBe("Mistake");
    });

    it("returns null for unknown action", () => {
      expect(reverseModerationAction({ actionId: "nope", reversedBy: "admin" })).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getModerationStats
  // -----------------------------------------------------------------------

  describe("getModerationStats", () => {
    it("returns zeroed stats when empty", () => {
      const stats = getModerationStats();
      expect(stats.totalActions).toBe(0);
      expect(stats.activeActions).toBe(0);
    });

    it("counts actions by type", () => {
      seedAction({ actionType: "warning" });
      seedAction({ actionType: "warning" });
      seedAction({ actionType: "ban" });

      const stats = getModerationStats();
      expect(stats.totalActions).toBe(3);
      expect(stats.byType.warning).toBe(2);
      expect(stats.byType.ban).toBe(1);
    });

    it("counts actions by reason", () => {
      seedAction({ reason: "spam" });
      seedAction({ reason: "spam" });
      seedAction({ reason: "harassment" });

      const stats = getModerationStats();
      expect(stats.byReason.spam).toBe(2);
      expect(stats.byReason.harassment).toBe(1);
    });

    it("excludes reversed actions from active count", () => {
      const action = seedAction();
      seedAction();
      reverseModerationAction({ actionId: action.id, reversedBy: "admin" });

      const stats = getModerationStats();
      expect(stats.totalActions).toBe(2);
      expect(stats.activeActions).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // hasRecentAction
  // -----------------------------------------------------------------------

  describe("hasRecentAction", () => {
    it("returns true when recent action exists", () => {
      createModerationAction({
        userId: "u1",
        actionType: "warning",
        reason: "spam",
        performedBy: "admin",
      });
      expect(hasRecentAction({ userId: "u1", actionType: "warning", windowMs: 60_000 })).toBe(true);
    });

    it("returns false for different user", () => {
      createModerationAction({
        userId: "u1",
        actionType: "warning",
        reason: "spam",
        performedBy: "admin",
      });
      expect(hasRecentAction({ userId: "u2", actionType: "warning", windowMs: 60_000 })).toBe(false);
    });

    it("returns false for different action type", () => {
      createModerationAction({
        userId: "u1",
        actionType: "warning",
        reason: "spam",
        performedBy: "admin",
      });
      expect(hasRecentAction({ userId: "u1", actionType: "ban", windowMs: 60_000 })).toBe(false);
    });

    it("returns false when no actions exist", () => {
      expect(hasRecentAction({ userId: "u1", actionType: "warning", windowMs: 60_000 })).toBe(false);
    });

    it("ignores reversed actions", () => {
      const action = createModerationAction({
        userId: "u1",
        actionType: "warning",
        reason: "spam",
        performedBy: "admin",
      });
      reverseModerationAction({ actionId: action.id, reversedBy: "admin" });

      expect(hasRecentAction({ userId: "u1", actionType: "warning", windowMs: 60_000 })).toBe(false);
    });

    it("ignores expired actions", () => {
      const action = createModerationAction({
        userId: "u1",
        actionType: "suspension",
        reason: "spam",
        performedBy: "admin",
        durationDays: 1,
      });
      action.endsAt = new Date(Date.now() - 60_000).toISOString();

      expect(hasRecentAction({ userId: "u1", actionType: "suspension", windowMs: 60_000 })).toBe(false);
    });
  });
});
