// Registry loader with stale-while-revalidate pattern

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { Prompt } from "@jeffreysprompts/core/prompts/types";
import { prompts as bundledPrompts } from "@jeffreysprompts/core/prompts";
import type { RegistryPayload } from "@jeffreysprompts/core/export";
import { loadConfig } from "./config";

export interface RegistryMeta {
  version: string;
  etag: string | null;
  fetchedAt: string;
  promptCount: number;
}

export interface LoadedRegistry {
  prompts: Prompt[];
  meta: RegistryMeta | null;
  source: "cache" | "remote" | "bundled";
}

interface RegistryPayloadLike {
  prompts: Prompt[];
  version?: string;
}

function readJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}

function mergePrompts(base: Prompt[], extras: Prompt[]): Prompt[] {
  if (!extras.length) return base;
  const merged = base.slice();
  const indexById = new Map(merged.map((prompt, index) => [prompt.id, index]));
  for (const prompt of extras) {
    const index = indexById.get(prompt.id);
    if (index === undefined) {
      indexById.set(prompt.id, merged.length);
      merged.push(prompt);
    } else {
      merged[index] = prompt;
    }
  }
  return merged;
}

function loadLocalPrompts(dir: string): Prompt[] {
  if (!existsSync(dir)) return [];
  const prompts: Prompt[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const path = join(dir, entry.name);
    const parsed = readJsonFile<Prompt | Prompt[]>(path);
    if (!parsed) continue;
    if (Array.isArray(parsed)) {
      prompts.push(...parsed);
    } else {
      prompts.push(parsed);
    }
  }
  return prompts;
}

async function fetchRegistry(
  url: string,
  timeoutMs: number,
  etag?: string | null
): Promise<{ payload: RegistryPayload | null; meta: RegistryMeta | null; notModified: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: etag ? { "If-None-Match": etag } : undefined,
      signal: controller.signal,
    });

    if (res.status === 304) {
      return { payload: null, meta: null, notModified: true };
    }

    if (!res.ok) {
      return { payload: null, meta: null, notModified: false };
    }

    const payload = (await res.json()) as RegistryPayload;
    const meta: RegistryMeta = {
      version: payload.version ?? "unknown",
      etag: res.headers.get("etag"),
      fetchedAt: new Date().toISOString(),
      promptCount: payload.prompts?.length ?? 0,
    };

    return { payload, meta, notModified: false };
  } catch {
    return { payload: null, meta: null, notModified: false };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Load registry with SWR pattern:
 * 1. Return cached data immediately if available
 * 2. Fetch fresh data in background
 * 3. Fall back to bundled data if no cache and fetch fails
 */
export async function loadRegistry(): Promise<LoadedRegistry> {
  const config = loadConfig();
  const cachedPayload = readJsonFile<RegistryPayloadLike>(config.registry.cachePath);
  const cachedMeta = readJsonFile<RegistryMeta>(config.registry.metaPath);
  const localPrompts = config.localPrompts.enabled
    ? loadLocalPrompts(config.localPrompts.dir)
    : [];

  if (cachedPayload?.prompts?.length) {
    if (config.registry.autoRefresh) {
      void refreshRegistry().catch(() => undefined);
    }
    return {
      prompts: mergePrompts(cachedPayload.prompts, localPrompts),
      meta: cachedMeta,
      source: "cache",
    };
  }

  const remote = await fetchRegistry(
    config.registry.remote,
    config.registry.timeoutMs,
    cachedMeta?.etag ?? null
  );

  if (remote.payload && remote.meta) {
    writeJsonFile(config.registry.cachePath, remote.payload);
    writeJsonFile(config.registry.metaPath, remote.meta);
    return {
      prompts: mergePrompts(remote.payload.prompts, localPrompts),
      meta: remote.meta,
      source: "remote",
    };
  }

  return {
    prompts: mergePrompts(bundledPrompts, localPrompts),
    meta: null,
    source: "bundled",
  };
}

/**
 * Force refresh registry from remote
 */
export async function refreshRegistry(): Promise<LoadedRegistry> {
  const config = loadConfig();
  const cachedPayload = readJsonFile<RegistryPayloadLike>(config.registry.cachePath);
  const cachedMeta = readJsonFile<RegistryMeta>(config.registry.metaPath);
  const localPrompts = config.localPrompts.enabled
    ? loadLocalPrompts(config.localPrompts.dir)
    : [];

  const remote = await fetchRegistry(
    config.registry.remote,
    config.registry.timeoutMs,
    cachedMeta?.etag ?? null
  );

  if (remote.notModified && cachedPayload?.prompts?.length) {
    const refreshedMeta: RegistryMeta | null = cachedMeta
      ? { ...cachedMeta, fetchedAt: new Date().toISOString() }
      : null;
    if (refreshedMeta) {
      writeJsonFile(config.registry.metaPath, refreshedMeta);
    }
    return {
      prompts: mergePrompts(cachedPayload.prompts, localPrompts),
      meta: refreshedMeta,
      source: "cache",
    };
  }

  if (remote.payload && remote.meta) {
    writeJsonFile(config.registry.cachePath, remote.payload);
    writeJsonFile(config.registry.metaPath, remote.meta);
    return {
      prompts: mergePrompts(remote.payload.prompts, localPrompts),
      meta: remote.meta,
      source: "remote",
    };
  }

  if (cachedPayload?.prompts?.length) {
    return {
      prompts: mergePrompts(cachedPayload.prompts, localPrompts),
      meta: cachedMeta,
      source: "cache",
    };
  }

  return {
    prompts: mergePrompts(bundledPrompts, localPrompts),
    meta: null,
    source: "bundled",
  };
}
