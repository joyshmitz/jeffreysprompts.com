import { describe, it, expect } from "bun:test";
import { compareVersions, parseVersion } from "../../src/lib/version";

describe("version utils", () => {
  describe("parseVersion", () => {
    it("parses standard semver", () => {
      expect(parseVersion("1.2.3")).toEqual([1, 2, 3]);
    });

    it("parses version with v prefix", () => {
      expect(parseVersion("v1.2.3")).toEqual([1, 2, 3]);
    });

    it("parses partial versions", () => {
      expect(parseVersion("1.2")).toEqual([1, 2, 0]);
      expect(parseVersion("1")).toEqual([1, 0, 0]);
    });

    it("parses pre-release versions (ignoring suffix)", () => {
      expect(parseVersion("1.2.3-beta.1")).toEqual([1, 2, 3]);
    });
  });

  describe("compareVersions", () => {
    it("returns 0 for equal versions", () => {
      expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
      expect(compareVersions("v1.0.0", "1.0.0")).toBe(0);
    });

    it("correctly compares major versions", () => {
      expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
      expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
    });

    it("correctly compares minor versions", () => {
      expect(compareVersions("1.1.0", "1.0.0")).toBe(1);
      expect(compareVersions("1.0.0", "1.1.0")).toBe(-1);
    });

    it("correctly compares patch versions", () => {
      expect(compareVersions("1.0.1", "1.0.0")).toBe(1);
      expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
    });

    it("considers stable newer than pre-release (when numeric parts equal)", () => {
      expect(compareVersions("1.0.0", "1.0.0-beta")).toBe(1);
      expect(compareVersions("1.0.0-beta", "1.0.0")).toBe(-1);
    });

    it("considers different numeric parts normally regardless of pre-release", () => {
      expect(compareVersions("1.0.1-beta", "1.0.0")).toBe(1);
      expect(compareVersions("1.0.0", "1.0.1-beta")).toBe(-1);
    });
  });
});
