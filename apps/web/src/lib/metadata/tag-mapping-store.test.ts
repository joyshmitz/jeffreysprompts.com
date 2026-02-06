/**
 * Unit tests for tag-mapping-store
 * @module lib/metadata/tag-mapping-store.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  listTagMappings,
  getTagMappingsRecord,
  upsertTagMapping,
  removeTagMapping,
  getTagMappingsMeta,
} from "./tag-mapping-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_tag_mapping_store__"];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("tag-mapping-store", () => {
  beforeEach(() => {
    // Ensure no persistence env vars leak
    delete process.env.JFP_TAG_MAPPINGS_PATH;
    delete process.env.JFP_TAG_MAPPINGS_FILE;
    clearStore();
  });

  // -----------------------------------------------------------------------
  // upsertTagMapping
  // -----------------------------------------------------------------------

  describe("upsertTagMapping", () => {
    it("creates a new tag mapping", () => {
      const mapping = upsertTagMapping({
        alias: "ai",
        canonical: "artificial-intelligence",
        updatedBy: "admin",
      });

      expect(mapping.alias).toBe("ai");
      expect(mapping.canonical).toBe("artificial-intelligence");
      expect(mapping.updatedBy).toBe("admin");
      expect(mapping.createdAt).toBeTruthy();
      expect(mapping.updatedAt).toBeTruthy();
    });

    it("normalizes tag values to lowercase with hyphens", () => {
      const mapping = upsertTagMapping({
        alias: "  Machine Learning  ",
        canonical: "ML Models",
        updatedBy: "admin",
      });

      expect(mapping.alias).toBe("machine-learning");
      expect(mapping.canonical).toBe("ml-models");
    });

    it("updates existing mapping", () => {
      upsertTagMapping({ alias: "ai", canonical: "artificial-intelligence", updatedBy: "admin1" });
      const updated = upsertTagMapping({ alias: "ai", canonical: "machine-learning", updatedBy: "admin2" });

      expect(updated.canonical).toBe("machine-learning");
      expect(updated.updatedBy).toBe("admin2");
    });

    it("throws when alias is empty", () => {
      expect(() =>
        upsertTagMapping({ alias: "", canonical: "something", updatedBy: "admin" })
      ).toThrow("alias_and_canonical_required");
    });

    it("throws when canonical is empty", () => {
      expect(() =>
        upsertTagMapping({ alias: "something", canonical: "", updatedBy: "admin" })
      ).toThrow("alias_and_canonical_required");
    });

    it("throws when alias matches canonical", () => {
      expect(() =>
        upsertTagMapping({ alias: "same", canonical: "same", updatedBy: "admin" })
      ).toThrow("alias_matches_canonical");
    });

    it("throws when tag value is too long", () => {
      const longTag = "a".repeat(81);
      expect(() =>
        upsertTagMapping({ alias: longTag, canonical: "short", updatedBy: "admin" })
      ).toThrow("tag_value_too_long");
    });

    it("defaults updatedBy to admin when empty", () => {
      const mapping = upsertTagMapping({ alias: "x", canonical: "y", updatedBy: "" });
      expect(mapping.updatedBy).toBe("admin");
    });
  });

  // -----------------------------------------------------------------------
  // listTagMappings
  // -----------------------------------------------------------------------

  describe("listTagMappings", () => {
    it("returns empty array when no mappings exist", () => {
      expect(listTagMappings()).toEqual([]);
    });

    it("returns all mappings in order", () => {
      upsertTagMapping({ alias: "a", canonical: "b", updatedBy: "admin" });
      upsertTagMapping({ alias: "c", canonical: "d", updatedBy: "admin" });

      const mappings = listTagMappings();
      expect(mappings).toHaveLength(2);
    });

    it("most recently touched mapping is first", () => {
      upsertTagMapping({ alias: "first", canonical: "b", updatedBy: "admin" });
      upsertTagMapping({ alias: "second", canonical: "d", updatedBy: "admin" });

      const mappings = listTagMappings();
      expect(mappings[0].alias).toBe("second");
      expect(mappings[1].alias).toBe("first");
    });

    it("touching an existing mapping moves it to front", () => {
      upsertTagMapping({ alias: "first", canonical: "b", updatedBy: "admin" });
      upsertTagMapping({ alias: "second", canonical: "d", updatedBy: "admin" });
      // Touch first again
      upsertTagMapping({ alias: "first", canonical: "updated", updatedBy: "admin" });

      const mappings = listTagMappings();
      expect(mappings[0].alias).toBe("first");
    });
  });

  // -----------------------------------------------------------------------
  // getTagMappingsRecord
  // -----------------------------------------------------------------------

  describe("getTagMappingsRecord", () => {
    it("returns empty object when no mappings", () => {
      expect(getTagMappingsRecord()).toEqual({});
    });

    it("returns alias -> canonical record", () => {
      upsertTagMapping({ alias: "ai", canonical: "artificial-intelligence", updatedBy: "admin" });
      upsertTagMapping({ alias: "ml", canonical: "machine-learning", updatedBy: "admin" });

      const record = getTagMappingsRecord();
      expect(record["ai"]).toBe("artificial-intelligence");
      expect(record["ml"]).toBe("machine-learning");
    });
  });

  // -----------------------------------------------------------------------
  // removeTagMapping
  // -----------------------------------------------------------------------

  describe("removeTagMapping", () => {
    it("removes an existing mapping", () => {
      upsertTagMapping({ alias: "ai", canonical: "artificial-intelligence", updatedBy: "admin" });
      const removed = removeTagMapping("ai");
      expect(removed).toBe(true);
      expect(listTagMappings()).toHaveLength(0);
    });

    it("returns false for nonexistent mapping", () => {
      expect(removeTagMapping("nope")).toBe(false);
    });

    it("normalizes alias before removing", () => {
      upsertTagMapping({ alias: "machine-learning", canonical: "ml", updatedBy: "admin" });
      expect(removeTagMapping("  Machine Learning  ")).toBe(true);
      expect(listTagMappings()).toHaveLength(0);
    });

    it("returns false for empty alias", () => {
      expect(removeTagMapping("")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // getTagMappingsMeta
  // -----------------------------------------------------------------------

  describe("getTagMappingsMeta", () => {
    it("returns null persistedPath when no env var set", () => {
      const meta = getTagMappingsMeta();
      expect(meta.persistedPath).toBeNull();
      expect(meta.lastPersistError).toBeNull();
    });
  });
});
