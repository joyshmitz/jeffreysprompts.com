// CLI configuration management

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface JfpConfig {
  registry: {
    remote: string;
    manifestUrl: string;
    cachePath: string;
    metaPath: string;
    autoRefresh: boolean;
    timeoutMs: number;
  };
  updates: {
    autoUpdate: boolean;
    channel: "stable" | "beta";
    lastCheck: string | null;
  };
  skills: {
    personalDir: string;
    projectDir: string;
  };
  localPrompts: {
    enabled: boolean;
    dir: string;
  };
  analytics: {
    enabled: boolean;
  };
}

const CONFIG_DIR = join(homedir(), ".config", "jfp");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export const DEFAULT_CONFIG: JfpConfig = {
  registry: {
    remote: "https://jeffreysprompts.com/api/prompts",
    manifestUrl: "https://jeffreysprompts.com/registry.manifest.json",
    cachePath: join(CONFIG_DIR, "registry.json"),
    metaPath: join(CONFIG_DIR, "registry.meta.json"),
    autoRefresh: true,
    timeoutMs: 2000,
  },
  updates: {
    autoUpdate: false,
    channel: "stable",
    lastCheck: null,
  },
  skills: {
    personalDir: join(homedir(), ".config", "claude", "skills"),
    projectDir: ".claude/skills",
  },
  localPrompts: {
    enabled: true,
    dir: join(CONFIG_DIR, "local"),
  },
  analytics: {
    enabled: false,
  },
};

export function loadConfig(): JfpConfig {
  if (!existsSync(CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: JfpConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
