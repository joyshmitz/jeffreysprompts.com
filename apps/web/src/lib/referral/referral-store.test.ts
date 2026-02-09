/**
 * Unit tests for referral-store
 * @module lib/referral/referral-store.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrCreateReferralCode,
  getReferralCodeByCode,
  getReferralCodeByUserId,
  applyReferralCode,
  convertReferral,
  awardReferralReward,
  getReferralsByReferrer,
  getReferralByReferee,
  getReferralStats,
  getReferralUrl,
  REFERRAL_CONSTANTS,
} from "./referral-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_referral_store__"];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("referral-store", () => {
  beforeEach(() => {
    clearStore();
  });

  // -----------------------------------------------------------------------
  // getOrCreateReferralCode
  // -----------------------------------------------------------------------

  describe("getOrCreateReferralCode", () => {
    it("creates a referral code for a user", () => {
      const code = getOrCreateReferralCode("user-1");
      expect(code.id).toBeTruthy();
      expect(code.userId).toBe("user-1");
      expect(code.code).toBeTruthy();
      expect(code.code.length).toBe(8);
      expect(code.createdAt).toBeTruthy();
    });

    it("returns the same code on subsequent calls", () => {
      const first = getOrCreateReferralCode("user-1");
      const second = getOrCreateReferralCode("user-1");
      expect(first.id).toBe(second.id);
      expect(first.code).toBe(second.code);
    });

    it("creates different codes for different users", () => {
      const code1 = getOrCreateReferralCode("user-1");
      const code2 = getOrCreateReferralCode("user-2");
      expect(code1.code).not.toBe(code2.code);
    });

    it("generates codes using the expected safe character set", () => {
      for (let i = 0; i < 50; i += 1) {
        const code = getOrCreateReferralCode(`charset-user-${i}`);
        expect(code.code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
      }
    });
  });

  // -----------------------------------------------------------------------
  // getReferralCodeByCode
  // -----------------------------------------------------------------------

  describe("getReferralCodeByCode", () => {
    it("returns code by code string", () => {
      const created = getOrCreateReferralCode("user-1");
      const found = getReferralCodeByCode(created.code);
      expect(found?.id).toBe(created.id);
    });

    it("normalizes code to uppercase", () => {
      const created = getOrCreateReferralCode("user-1");
      const found = getReferralCodeByCode(created.code.toLowerCase());
      expect(found?.id).toBe(created.id);
    });

    it("returns null for unknown code", () => {
      expect(getReferralCodeByCode("XXXXXXXX")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getReferralCodeByUserId
  // -----------------------------------------------------------------------

  describe("getReferralCodeByUserId", () => {
    it("returns code for user who has one", () => {
      const created = getOrCreateReferralCode("user-1");
      const found = getReferralCodeByUserId("user-1");
      expect(found?.id).toBe(created.id);
    });

    it("returns null for user with no code", () => {
      expect(getReferralCodeByUserId("nobody")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // applyReferralCode
  // -----------------------------------------------------------------------

  describe("applyReferralCode", () => {
    it("creates a referral when valid code is applied", () => {
      const code = getOrCreateReferralCode("referrer");
      const result = applyReferralCode({ code: code.code, refereeId: "referee" });

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.referrerId).toBe("referrer");
        expect(result.refereeId).toBe("referee");
        expect(result.codeUsed).toBe(code.code);
        expect(result.status).toBe("pending");
        expect(result.refereeReward).toBeTruthy();
        expect(result.referrerReward).toBeNull();
      }
    });

    it("prevents self-referral", () => {
      const code = getOrCreateReferralCode("user-1");
      const result = applyReferralCode({ code: code.code, refereeId: "user-1" });
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("own referral code");
      }
    });

    it("prevents using a code twice by same referee", () => {
      const code = getOrCreateReferralCode("referrer");
      applyReferralCode({ code: code.code, refereeId: "referee" });
      const result = applyReferralCode({ code: code.code, refereeId: "referee" });
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("already used");
      }
    });

    it("returns error for invalid code", () => {
      const result = applyReferralCode({ code: "INVALID1", refereeId: "referee" });
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("allows multiple referees to use same referrer code", () => {
      const code = getOrCreateReferralCode("referrer");
      const r1 = applyReferralCode({ code: code.code, refereeId: "referee-1" });
      const r2 = applyReferralCode({ code: code.code, refereeId: "referee-2" });
      expect("error" in r1).toBe(false);
      expect("error" in r2).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // convertReferral
  // -----------------------------------------------------------------------

  describe("convertReferral", () => {
    it("converts a pending referral", () => {
      const code = getOrCreateReferralCode("referrer");
      applyReferralCode({ code: code.code, refereeId: "referee" });

      const result = convertReferral("referee");
      expect(result).not.toBeNull();
      expect(result?.status).toBe("converted");
      expect(result?.convertedAt).toBeTruthy();
    });

    it("returns null for user with no referral", () => {
      expect(convertReferral("nobody")).toBeNull();
    });

    it("returns null for already converted referral", () => {
      const code = getOrCreateReferralCode("referrer");
      applyReferralCode({ code: code.code, refereeId: "referee" });
      convertReferral("referee");

      expect(convertReferral("referee")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // awardReferralReward
  // -----------------------------------------------------------------------

  describe("awardReferralReward", () => {
    it("awards reward for converted referral", () => {
      const code = getOrCreateReferralCode("referrer");
      const referral = applyReferralCode({ code: code.code, refereeId: "referee" });
      if ("error" in referral) throw new Error("unexpected");

      convertReferral("referee");
      const result = awardReferralReward(referral.id);

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.status).toBe("rewarded");
        expect(result.referrerReward).toBeTruthy();
        expect(result.rewardedAt).toBeTruthy();
      }
    });

    it("returns error for unconverted referral", () => {
      const code = getOrCreateReferralCode("referrer");
      const referral = applyReferralCode({ code: code.code, refereeId: "referee" });
      if ("error" in referral) throw new Error("unexpected");

      const result = awardReferralReward(referral.id);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("converted");
      }
    });

    it("returns error for unknown referral", () => {
      const result = awardReferralReward("nonexistent");
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("not found");
      }
    });

    it("enforces yearly reward cap", () => {
      const code = getOrCreateReferralCode("referrer");

      // Create and reward MAX_REWARD_MONTHS_PER_YEAR referrals
      for (let i = 0; i < REFERRAL_CONSTANTS.MAX_REWARD_MONTHS_PER_YEAR; i++) {
        const ref = applyReferralCode({ code: code.code, refereeId: `referee-${i}` });
        if ("error" in ref) throw new Error("unexpected");
        convertReferral(`referee-${i}`);
        awardReferralReward(ref.id);
      }

      // Next award should be capped
      const extraRef = applyReferralCode({ code: code.code, refereeId: "referee-extra" });
      if ("error" in extraRef) throw new Error("unexpected");
      convertReferral("referee-extra");
      const result = awardReferralReward(extraRef.id);

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("yearly reward cap");
      }
    });
  });

  // -----------------------------------------------------------------------
  // getReferralsByReferrer
  // -----------------------------------------------------------------------

  describe("getReferralsByReferrer", () => {
    it("returns all referrals for a referrer", () => {
      const code = getOrCreateReferralCode("referrer");
      applyReferralCode({ code: code.code, refereeId: "r1" });
      applyReferralCode({ code: code.code, refereeId: "r2" });

      const referrals = getReferralsByReferrer("referrer");
      expect(referrals).toHaveLength(2);
    });

    it("returns empty array for user with no referrals", () => {
      expect(getReferralsByReferrer("nobody")).toEqual([]);
    });

    it("sorts by newest first", () => {
      const code = getOrCreateReferralCode("referrer");
      applyReferralCode({ code: code.code, refereeId: "r1" });
      applyReferralCode({ code: code.code, refereeId: "r2" });

      const referrals = getReferralsByReferrer("referrer");
      for (let i = 1; i < referrals.length; i++) {
        expect(
          new Date(referrals[i - 1].createdAt).getTime()
        ).toBeGreaterThanOrEqual(new Date(referrals[i].createdAt).getTime());
      }
    });
  });

  // -----------------------------------------------------------------------
  // getReferralByReferee
  // -----------------------------------------------------------------------

  describe("getReferralByReferee", () => {
    it("returns referral for referee", () => {
      const code = getOrCreateReferralCode("referrer");
      applyReferralCode({ code: code.code, refereeId: "referee" });

      const referral = getReferralByReferee("referee");
      expect(referral).not.toBeNull();
      expect(referral?.refereeId).toBe("referee");
    });

    it("returns null for user with no referral", () => {
      expect(getReferralByReferee("nobody")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getReferralStats
  // -----------------------------------------------------------------------

  describe("getReferralStats", () => {
    it("returns zeroed stats for user with no referrals", () => {
      const stats = getReferralStats("nobody");
      expect(stats.totalReferrals).toBe(0);
      expect(stats.pendingReferrals).toBe(0);
      expect(stats.convertedReferrals).toBe(0);
      expect(stats.rewardedReferrals).toBe(0);
      expect(stats.totalRewardsEarned).toBe(0);
    });

    it("counts referrals by status", () => {
      const code = getOrCreateReferralCode("referrer");
      applyReferralCode({ code: code.code, refereeId: "r1" }); // pending
      const r2 = applyReferralCode({ code: code.code, refereeId: "r2" });
      if ("error" in r2) throw new Error("unexpected");
      convertReferral("r2"); // converted
      const r3 = applyReferralCode({ code: code.code, refereeId: "r3" });
      if ("error" in r3) throw new Error("unexpected");
      convertReferral("r3");
      awardReferralReward(r3.id); // rewarded

      const stats = getReferralStats("referrer");
      expect(stats.totalReferrals).toBe(3);
      expect(stats.pendingReferrals).toBe(1);
      expect(stats.convertedReferrals).toBe(1);
      expect(stats.rewardedReferrals).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // getReferralUrl
  // -----------------------------------------------------------------------

  describe("getReferralUrl", () => {
    it("generates correct URL", () => {
      expect(getReferralUrl("ABC123XY")).toBe(
        "https://jeffreysprompts.com/r/ABC123XY"
      );
    });
  });

  // -----------------------------------------------------------------------
  // REFERRAL_CONSTANTS
  // -----------------------------------------------------------------------

  describe("REFERRAL_CONSTANTS", () => {
    it("exports expected constants", () => {
      expect(REFERRAL_CONSTANTS.REFERRER_REWARD_MONTHS).toBe(1);
      expect(REFERRAL_CONSTANTS.MAX_REWARD_MONTHS_PER_YEAR).toBe(12);
      expect(REFERRAL_CONSTANTS.REFEREE_EXTENDED_TRIAL_DAYS).toBe(30);
      expect(REFERRAL_CONSTANTS.REFEREE_DISCOUNT_PERCENT).toBe(20);
    });
  });
});
