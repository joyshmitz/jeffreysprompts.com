/**
 * YAML escaping utilities for skill/bundle generation
 */

/**
 * Escape a string for safe use in a YAML double-quoted array element.
 * Handles backslashes, double quotes, and newlines.
 */
export function escapeYamlArrayItem(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

/**
 * Escape a string for safe YAML scalar value.
 * Quotes strings containing special YAML characters.
 */
export function escapeYamlValue(value: string): string {
  // Check if value needs quoting (contains special chars, newlines, or starts/contains special chars)
  if (
    value.includes(":") ||
    value.includes("#") ||
    value.includes("\n") ||
    value.includes('"') ||
    value.includes("'") ||
    value.includes("[") ||
    value.includes("]") ||
    value.includes("{") ||
    value.includes("}") ||
    value.includes(">") ||
    value.includes("|") ||
    value.includes("\\") ||
    value.startsWith(" ") ||
    value.endsWith(" ") ||
    value.startsWith("@") ||
    value.startsWith("!") ||
    value.startsWith("&") ||
    value.startsWith("*")
  ) {
    // Use double quotes with escaped internal characters
    return `"${escapeYamlArrayItem(value)}"`;
  }
  return value;
}
