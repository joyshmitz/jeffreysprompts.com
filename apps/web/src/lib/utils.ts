import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely stringify JSON for use in <script> tags.
 * Escapes < characters to prevent XSS via </script> injection.
 */
export function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
