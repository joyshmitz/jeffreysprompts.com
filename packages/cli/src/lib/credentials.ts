/**
 * Credential Storage Module
 *
 * Securely stores and retrieves authentication tokens for the CLI.
 * - XDG Base Directory compliant storage location
 * - Atomic file operations (no partial writes)
 * - Token expiry checking with buffer
 * - Environment variable override for CI/CD
 */

import { homedir } from "os";
import { join, dirname } from "path";
import { readFile, writeFile, mkdir, unlink, rename } from "fs/promises";
import { existsSync } from "fs";

export interface Credentials {
  access_token: string;
  refresh_token?: string;
  expires_at: string; // ISO 8601
  email: string;
  tier: "free" | "premium";
  user_id: string;
}

/**
 * Get XDG Base Directory compliant credentials path
 * Re-reads HOME env var each time for testability
 */
export function getCredentialsPath(): string {
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  // Use process.env.HOME directly for testability (homedir() caches)
  const home = process.env.HOME || homedir();
  const configDir = xdgConfig || join(home, ".config");
  return join(configDir, "jfp", "credentials.json");
}

/**
 * Get config directory path
 */
function getConfigDir(): string {
  return dirname(getCredentialsPath());
}

/**
 * Load credentials from disk
 * Returns null if not logged in or credentials are invalid
 */
export async function loadCredentials(): Promise<Credentials | null> {
  const path = getCredentialsPath();

  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = await readFile(path, "utf-8");
    const creds = JSON.parse(content) as Credentials;

    // Basic validation
    if (!creds.access_token || !creds.email) {
      return null;
    }

    return creds;
  } catch {
    // Corrupt file or parse error
    return null;
  }
}

/**
 * Check if credentials are expired
 * Uses 5-minute buffer for clock skew
 */
export function isExpired(creds: Credentials): boolean {
  if (!creds.expires_at) return false;

  const expiresAt = new Date(creds.expires_at);
  const now = new Date();

  // Consider expired 5 minutes before actual expiry (buffer for clock skew)
  const bufferMs = 5 * 60 * 1000;
  return now.getTime() > expiresAt.getTime() - bufferMs;
}

/**
 * Save credentials to disk
 * Atomic write with temp file to prevent corruption
 */
export async function saveCredentials(creds: Credentials): Promise<void> {
  const path = getCredentialsPath();
  const dir = getConfigDir();

  // Ensure config directory exists with secure permissions
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true, mode: 0o700 });
  }

  // Write atomically via temp file
  const tempPath = `${path}.tmp`;
  const content = JSON.stringify(creds, null, 2);

  await writeFile(tempPath, content, { mode: 0o600 }); // User read/write only
  await rename(tempPath, path);
}

/**
 * Clear stored credentials (logout)
 */
export async function clearCredentials(): Promise<void> {
  const path = getCredentialsPath();

  if (existsSync(path)) {
    await unlink(path);
  }
}

/**
 * Get access token for API calls
 * Returns null if not logged in
 * Handles environment variable override (for CI/CD)
 */
export async function getAccessToken(): Promise<string | null> {
  // Environment variable takes precedence (for CI/CD)
  const envToken = process.env.JFP_TOKEN;
  if (envToken) {
    return envToken;
  }

  const creds = await loadCredentials();
  if (!creds) {
    return null;
  }

  // Force re-login if expired (auto-refresh can be added later)
  if (isExpired(creds)) {
    return null;
  }

  return creds.access_token;
}

/**
 * Check if user is currently logged in
 */
export async function isLoggedIn(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

/**
 * Get current user info if logged in
 */
export async function getCurrentUser(): Promise<{ email: string; tier: string; userId: string } | null> {
  const creds = await loadCredentials();
  if (!creds || isExpired(creds)) {
    return null;
  }

  return {
    email: creds.email,
    tier: creds.tier,
    userId: creds.user_id,
  };
}
