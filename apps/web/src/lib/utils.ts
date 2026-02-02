import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely stringify JSON for use in <script> tags.
 * Escapes < characters to prevent XSS via </script> injection.
 * Also escapes U+2028 and U+2029 to prevent JS syntax errors.
 */
export function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Safely parse a date string to milliseconds timestamp.
 * Returns null if the string is invalid or produces an invalid date.
 *
 * Use this instead of `new Date(str).getTime()` to avoid NaN propagation.
 */
export function safeDateMs(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const ms = date.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Safely parse a date string to Date object.
 * Returns null if the string is invalid or produces an invalid date.
 */
export function safeParseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return Number.isFinite(date.getTime()) ? date : null;
}
