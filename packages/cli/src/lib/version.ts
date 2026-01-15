/**
 * Parse a version string into major, minor, patch numbers.
 * "v1.2.3" -> [1, 2, 3]
 * "1.2.3-beta" -> [1, 2, 3]
 */
export function parseVersion(v: string): [number, number, number] {
  const clean = v.replace(/^v/, "");
  const parts = clean.split(".").map((p) => parseInt(p, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

/**
 * Compare two version strings.
 * Returns -1 if a < b, 1 if a > b, 0 if equal.
 * Handles simple semver: 1.0.0 > 1.0.0-beta
 */
export function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseVersion(a);
  const [bMajor, bMinor, bPatch] = parseVersion(b);

  if (aMajor !== bMajor) return aMajor < bMajor ? -1 : 1;
  if (aMinor !== bMinor) return aMinor < bMinor ? -1 : 1;
  if (aPatch !== bPatch) return aPatch < bPatch ? -1 : 1;

  // Numeric parts are equal. Check for pre-release suffixes.
  // A version with a hyphen (pre-release) is OLDER than one without (stable).
  const aIsPrerelease = a.includes("-");
  const bIsPrerelease = b.includes("-");

  if (aIsPrerelease && !bIsPrerelease) return -1; // 1.0.0-beta < 1.0.0
  if (!aIsPrerelease && bIsPrerelease) return 1;  // 1.0.0 > 1.0.0-beta

  // If both are pre-release or both stable, compare lexically or treat as equal
  // For simplicity, we treat them as equal if numeric parts match and prerelease status matches
  // (unless we want to parse "beta.1" vs "beta.2")
  return 0;
}
