/**
 * Unit tests for profile-store
 * @module lib/profile/profile-store.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateReputationScore,
  calculateBadges,
  getProfileById,
  getProfileByUsername,
  getPublicProfile,
  createProfile,
  updateProfile,
  updateUserStats,
  listPublicProfiles,
  BADGE_CONFIG,
  REPUTATION_WEIGHTS,
  BADGE_CRITERIA,
} from "./profile-store";
import type { UserStats } from "./profile-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_profile_store__"];
}

function baseStats(): UserStats {
  return {
    prompts: 0,
    packs: 0,
    skills: 0,
    savesReceived: 0,
    ratingsReceived: 0,
    averageRating: 0,
    featuredCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("profile-store", () => {
  beforeEach(() => {
    clearStore();
  });

  // -----------------------------------------------------------------------
  // calculateReputationScore
  // -----------------------------------------------------------------------

  describe("calculateReputationScore", () => {
    it("returns 0 for empty stats and recent join", () => {
      const score = calculateReputationScore(baseStats(), new Date().toISOString());
      expect(score).toBe(0);
    });

    it("increases with prompts published", () => {
      const stats = { ...baseStats(), prompts: 10 };
      const score = calculateReputationScore(stats, new Date().toISOString());
      expect(score).toBe(10 * REPUTATION_WEIGHTS.publicPrompt);
    });

    it("increases with saves received", () => {
      const stats = { ...baseStats(), savesReceived: 50 };
      const score = calculateReputationScore(stats, new Date().toISOString());
      expect(score).toBe(50 * REPUTATION_WEIGHTS.saveReceived);
    });

    it("increases with ratings received", () => {
      const stats = { ...baseStats(), ratingsReceived: 20 };
      const score = calculateReputationScore(stats, new Date().toISOString());
      expect(score).toBe(20 * REPUTATION_WEIGHTS.positiveRating);
    });

    it("gives bonus for featured content", () => {
      const stats = { ...baseStats(), featuredCount: 2 };
      const score = calculateReputationScore(stats, new Date().toISOString());
      expect(score).toBe(2 * REPUTATION_WEIGHTS.featuredContent);
    });

    it("includes account age bonus (capped)", () => {
      // Join date 100 days ago
      const joinDate = new Date(Date.now() - 100 * 86400000).toISOString();
      const score = calculateReputationScore(baseStats(), joinDate);
      const expected = Math.round(100 * REPUTATION_WEIGHTS.accountAgeDays);
      expect(score).toBe(expected);
    });

    it("caps account age bonus at 365 days", () => {
      const joinDate = new Date(Date.now() - 500 * 86400000).toISOString();
      const score = calculateReputationScore(baseStats(), joinDate);
      const expected = Math.round(365 * REPUTATION_WEIGHTS.accountAgeDays);
      expect(score).toBe(expected);
    });
  });

  // -----------------------------------------------------------------------
  // calculateBadges
  // -----------------------------------------------------------------------

  describe("calculateBadges", () => {
    it("awards new_member for recent accounts", () => {
      const badges = calculateBadges(baseStats(), new Date().toISOString());
      expect(badges.some((b) => b.type === "new_member")).toBe(true);
    });

    it("does not award new_member for old accounts", () => {
      const joinDate = new Date(Date.now() - 60 * 86400000).toISOString();
      const badges = calculateBadges(baseStats(), joinDate);
      expect(badges.some((b) => b.type === "new_member")).toBe(false);
    });

    it("awards contributor for 5+ prompts", () => {
      const stats = { ...baseStats(), prompts: 5 };
      const badges = calculateBadges(stats, new Date().toISOString());
      expect(badges.some((b) => b.type === "contributor")).toBe(true);
    });

    it("does not award contributor for <5 prompts", () => {
      const stats = { ...baseStats(), prompts: 4 };
      const badges = calculateBadges(stats, new Date().toISOString());
      expect(badges.some((b) => b.type === "contributor")).toBe(false);
    });

    it("awards popular for 100+ saves", () => {
      const stats = { ...baseStats(), savesReceived: 100 };
      const badges = calculateBadges(stats, new Date().toISOString());
      expect(badges.some((b) => b.type === "popular")).toBe(true);
    });

    it("awards top_rated for 90%+ average with ratings", () => {
      const stats = { ...baseStats(), averageRating: 92, ratingsReceived: 10 };
      const badges = calculateBadges(stats, new Date().toISOString());
      expect(badges.some((b) => b.type === "top_rated")).toBe(true);
    });

    it("does not award top_rated with zero ratings", () => {
      const stats = { ...baseStats(), averageRating: 100, ratingsReceived: 0 };
      const badges = calculateBadges(stats, new Date().toISOString());
      expect(badges.some((b) => b.type === "top_rated")).toBe(false);
    });

    it("awards featured_author for any featured content", () => {
      const stats = { ...baseStats(), featuredCount: 1 };
      const badges = calculateBadges(stats, new Date().toISOString());
      expect(badges.some((b) => b.type === "featured_author")).toBe(true);
    });

    it("awards founding_member for pre-June-2024 accounts", () => {
      const badges = calculateBadges(baseStats(), "2024-01-01T00:00:00Z");
      expect(badges.some((b) => b.type === "founding_member")).toBe(true);
    });

    it("does not award founding_member for post-June-2024 accounts", () => {
      const badges = calculateBadges(baseStats(), "2024-07-01T00:00:00Z");
      expect(badges.some((b) => b.type === "founding_member")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Seed data
  // -----------------------------------------------------------------------

  describe("seed data", () => {
    it("initializes with seed profiles", () => {
      const jeffrey = getProfileByUsername("jeffreyemanuel");
      expect(jeffrey).not.toBeNull();
      expect(jeffrey?.displayName).toBe("Jeffrey Emanuel");
    });

    it("seed profiles have calculated reputation", () => {
      const jeffrey = getProfileByUsername("jeffreyemanuel");
      expect(jeffrey?.reputationScore).toBeGreaterThan(0);
    });

    it("seed profiles have calculated badges", () => {
      const jeffrey = getProfileByUsername("jeffreyemanuel");
      expect(jeffrey?.badges.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // getProfileById / getProfileByUsername
  // -----------------------------------------------------------------------

  describe("getProfileById", () => {
    it("returns profile by ID", () => {
      const profile = getProfileById("usr_1");
      expect(profile?.id).toBe("usr_1");
    });

    it("returns null for unknown ID", () => {
      expect(getProfileById("nope")).toBeNull();
    });
  });

  describe("getProfileByUsername", () => {
    it("returns profile case-insensitively", () => {
      expect(getProfileByUsername("JeffreyEmanuel")).not.toBeNull();
      expect(getProfileByUsername("jeffreyemanuel")).not.toBeNull();
    });

    it("returns null for unknown username", () => {
      expect(getProfileByUsername("nobody")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getPublicProfile
  // -----------------------------------------------------------------------

  describe("getPublicProfile", () => {
    it("returns public profile data", () => {
      const pub = getPublicProfile("jeffreyemanuel");
      expect(pub).not.toBeNull();
      expect(pub?.username).toBe("jeffreyemanuel");
      expect(pub?.stats).toBeDefined();
      expect(pub?.badges).toBeDefined();
    });

    it("returns null for unknown username", () => {
      expect(getPublicProfile("nobody")).toBeNull();
    });

    it("returns null for private profiles", () => {
      const profile = createProfile({
        id: "private-user",
        username: "private_user",
        displayName: "Private",
      });
      updateProfile(profile.id, { isPublic: false });
      expect(getPublicProfile("private_user")).toBeNull();
    });

    it("hides reputation when showReputation is false", () => {
      const profile = createProfile({
        id: "hidden-rep",
        username: "hidden_rep",
        displayName: "Hidden",
      });
      updateProfile(profile.id, { showReputation: false });
      const pub = getPublicProfile("hidden_rep");
      expect(pub?.reputationScore).toBeNull();
    });

    it("shows reputation when showReputation is true", () => {
      const pub = getPublicProfile("jeffreyemanuel");
      expect(pub?.reputationScore).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------------------------------------------------
  // createProfile
  // -----------------------------------------------------------------------

  describe("createProfile", () => {
    it("creates a new profile", () => {
      const profile = createProfile({
        id: "new-user",
        username: "newuser",
        displayName: "New User",
      });

      expect(profile.id).toBe("new-user");
      expect(profile.username).toBe("newuser");
      expect(profile.displayName).toBe("New User");
      expect(profile.isPublic).toBe(true);
      expect(profile.stats.prompts).toBe(0);
      expect(profile.joinDate).toBeTruthy();
    });

    it("throws on duplicate username", () => {
      createProfile({ id: "u1", username: "taken", displayName: "First" });
      expect(() =>
        createProfile({ id: "u2", username: "taken", displayName: "Second" })
      ).toThrow(/already taken/i);
    });

    it("case-insensitive username uniqueness", () => {
      createProfile({ id: "u1", username: "MyUser", displayName: "First" });
      expect(() =>
        createProfile({ id: "u2", username: "myuser", displayName: "Second" })
      ).toThrow(/already taken/i);
    });

    it("calculates initial badges", () => {
      const profile = createProfile({
        id: "new",
        username: "newcomer",
        displayName: "New",
      });
      // Should have new_member badge
      expect(profile.badges.some((b) => b.type === "new_member")).toBe(true);
    });

    it("sets optional fields", () => {
      const profile = createProfile({
        id: "custom",
        username: "custom_user",
        displayName: "Custom",
        avatar: "https://example.com/avatar.png",
        bio: "Hello world",
      });
      expect(profile.avatar).toBe("https://example.com/avatar.png");
      expect(profile.bio).toBe("Hello world");
    });
  });

  // -----------------------------------------------------------------------
  // updateProfile
  // -----------------------------------------------------------------------

  describe("updateProfile", () => {
    it("updates display name", () => {
      createProfile({ id: "u", username: "u", displayName: "Old" });
      const updated = updateProfile("u", { displayName: "New" });
      expect(updated?.displayName).toBe("New");
    });

    it("updates bio", () => {
      const profile = createProfile({ id: "u", username: "u2", displayName: "U" });
      const updated = updateProfile(profile.id, { bio: "Updated bio" });
      expect(updated?.bio).toBe("Updated bio");
    });

    it("updates privacy settings", () => {
      const profile = createProfile({ id: "u", username: "u3", displayName: "U" });
      updateProfile(profile.id, { isPublic: false, showReputation: false });
      const found = getProfileById(profile.id);
      expect(found?.isPublic).toBe(false);
      expect(found?.showReputation).toBe(false);
    });

    it("returns null for unknown ID", () => {
      expect(updateProfile("nope", { bio: "test" })).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // updateUserStats
  // -----------------------------------------------------------------------

  describe("updateUserStats", () => {
    it("updates stats and recalculates reputation", () => {
      const profile = createProfile({ id: "s", username: "s1", displayName: "S" });
      const initialRep = profile.reputationScore;

      updateUserStats("s", { prompts: 10, savesReceived: 200 });
      const updated = getProfileById("s");

      expect(updated?.stats.prompts).toBe(10);
      expect(updated?.stats.savesReceived).toBe(200);
      expect(updated?.reputationScore).toBeGreaterThan(initialRep);
    });

    it("recalculates badges after stats update", () => {
      const profile = createProfile({ id: "b", username: "b1", displayName: "B" });
      expect(profile.badges.some((b) => b.type === "contributor")).toBe(false);

      updateUserStats("b", { prompts: 10 });
      const updated = getProfileById("b");
      expect(updated?.badges.some((b) => b.type === "contributor")).toBe(true);
    });

    it("returns null for unknown ID", () => {
      expect(updateUserStats("nope", { prompts: 5 })).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // listPublicProfiles
  // -----------------------------------------------------------------------

  describe("listPublicProfiles", () => {
    it("returns public profiles", () => {
      const profiles = listPublicProfiles();
      expect(profiles.length).toBeGreaterThan(0);
      // Should include seed profiles
      expect(profiles.some((p) => p.username === "jeffreyemanuel")).toBe(true);
    });

    it("excludes private profiles", () => {
      createProfile({ id: "priv", username: "private_list", displayName: "Priv" });
      updateProfile("priv", { isPublic: false });

      const profiles = listPublicProfiles();
      expect(profiles.some((p) => p.username === "private_list")).toBe(false);
    });

    it("sorts by reputation by default", () => {
      const profiles = listPublicProfiles({ sortBy: "reputation" });
      for (let i = 1; i < profiles.length; i++) {
        const prevRep = profiles[i - 1].reputationScore ?? 0;
        const currRep = profiles[i].reputationScore ?? 0;
        expect(prevRep).toBeGreaterThanOrEqual(currRep);
      }
    });

    it("sorts by prompts", () => {
      const profiles = listPublicProfiles({ sortBy: "prompts" });
      for (let i = 1; i < profiles.length; i++) {
        expect(profiles[i - 1].stats.prompts).toBeGreaterThanOrEqual(profiles[i].stats.prompts);
      }
    });

    it("respects limit", () => {
      const profiles = listPublicProfiles({ limit: 1 });
      expect(profiles).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Constants exports
  // -----------------------------------------------------------------------

  describe("exports", () => {
    it("exports BADGE_CONFIG with all badge types", () => {
      expect(BADGE_CONFIG.new_member).toBeDefined();
      expect(BADGE_CONFIG.contributor).toBeDefined();
      expect(BADGE_CONFIG.premium).toBeDefined();
      expect(BADGE_CONFIG.verified).toBeDefined();
    });

    it("exports REPUTATION_WEIGHTS", () => {
      expect(REPUTATION_WEIGHTS.publicPrompt).toBe(10);
    });

    it("exports BADGE_CRITERIA", () => {
      expect(BADGE_CRITERIA.contributor.minPrompts).toBe(5);
      expect(BADGE_CRITERIA.popular.minSaves).toBe(100);
    });
  });
});
