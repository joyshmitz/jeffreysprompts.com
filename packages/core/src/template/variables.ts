// packages/core/src/template/variables.ts
// Variable helpers and dynamic defaults

/**
 * Simple basename implementation (avoids Node.js path dependency)
 */
function getBasename(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
}

/**
 * Get dynamic variable defaults based on environment
 * These are computed at runtime by CLI/web, not stored in prompts
 */
export function getDynamicDefaults(cwd?: string): Record<string, string> {
  const defaults: Record<string, string> = {};

  if (cwd) {
    defaults.CWD = cwd;
    defaults.PROJECT_NAME = getBasename(cwd);
  }

  // Git branch would be added by CLI layer
  // defaults.GIT_BRANCH = ...

  return defaults;
}

/**
 * Variable display helpers
 */
export function formatVariableName(name: string): string {
  // UPPER_SNAKE_CASE -> Title Case
  return name
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate placeholder text for a variable input
 */
export function getVariablePlaceholder(name: string, type: string): string {
  switch (type) {
    case "file":
      return "Select a file...";
    case "path":
      return "/path/to/directory";
    case "multiline":
      return "Enter text (multiple lines allowed)...";
    default:
      return formatVariableName(name);
  }
}
