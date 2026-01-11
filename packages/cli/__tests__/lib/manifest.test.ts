import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  readManifest,
  writeManifest,
  createEmptyManifest,
  upsertManifestEntry,
  removeManifestEntry,
} from "../../src/lib/manifest";

let testDir: string;

beforeAll(() => {
  testDir = mkdtempSync(join(tmpdir(), "jfp-manifest-test-"));
});

afterAll(() => {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors in test environment
  }
});

describe("manifest read/write", () => {
  it("writes and reads manifest.json with real JSON", () => {
    const entry = {
      id: "idea-wizard",
      kind: "prompt",
      version: "1.0.0",
      hash: "hash-abc",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const manifest = {
      generatedAt: "2026-01-02T00:00:00.000Z",
      jfpVersion: "1.2.3",
      entries: [entry],
    };

    writeManifest(testDir, manifest);

    const manifestPath = join(testDir, "manifest.json");
    expect(existsSync(manifestPath)).toBe(true);

    const raw = readFileSync(manifestPath, "utf-8");
    expect(raw).toContain("\"entries\"");

    const loaded = readManifest(testDir);
    expect(loaded?.entries.length).toBe(1);
    expect(loaded?.entries[0].id).toBe("idea-wizard");
    expect(loaded?.entries[0].hash).toBe("hash-abc");
  });

  it("returns null when manifest.json is invalid JSON", () => {
    const manifestPath = join(testDir, "manifest.json");
    writeFileSync(manifestPath, "{ not: valid json");

    const loaded = readManifest(testDir);
    expect(loaded).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    const manifestPath = join(testDir, "manifest.json");
    const invalid = {
      generatedAt: "2026-01-02T00:00:00.000Z",
      jfpVersion: "1.2.3",
      entries: [
        {
          id: "idea-wizard",
          kind: "prompt",
          version: "1.0.0",
          hash: "hash-abc",
          // updatedAt missing
        },
      ],
    };
    writeFileSync(manifestPath, JSON.stringify(invalid, null, 2));

    const loaded = readManifest(testDir);
    expect(loaded).toBeNull();
  });
});

describe("manifest entry helpers", () => {
  it("upserts and removes entries with real JSON persistence", () => {
    let manifest = createEmptyManifest("1.2.3");
    manifest = upsertManifestEntry(manifest, {
      id: "idea-wizard",
      kind: "prompt",
      version: "1.0.0",
      hash: "hash-1",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    writeManifest(testDir, manifest);

    let loaded = readManifest(testDir);
    expect(loaded?.entries.length).toBe(1);
    expect(loaded?.entries[0].id).toBe("idea-wizard");

    manifest = upsertManifestEntry(manifest, {
      id: "idea-wizard",
      kind: "prompt",
      version: "1.0.1",
      hash: "hash-2",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });

    writeManifest(testDir, manifest);

    loaded = readManifest(testDir);
    expect(loaded?.entries.length).toBe(1);
    expect(loaded?.entries[0].version).toBe("1.0.1");

    manifest = removeManifestEntry(manifest, "idea-wizard");
    writeManifest(testDir, manifest);

    loaded = readManifest(testDir);
    expect(loaded?.entries.length).toBe(0);
  });
});
