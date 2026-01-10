// Validate transcript for publication safety
// Fails if suspicious patterns remain after redaction
// Run in CI before merging transcript data

import { existsSync, readFileSync } from "fs";

const DEFAULT_INPUT = "apps/web/src/data/transcript.redacted.json";

interface ValidationRule {
  label: string;
  pattern: RegExp;
  severity: "error" | "warning";
  description: string;
}

interface ValidationResult {
  rule: string;
  severity: "error" | "warning";
  matches: Array<{
    match: string;
    context: string;
    line: number;
  }>;
}

// Patterns that should NOT appear in the redacted output
const VALIDATION_RULES: ValidationRule[] = [
  // API Keys - should be redacted
  {
    label: "OpenAI API key",
    pattern: /sk-[A-Za-z0-9]{20,}/g,
    severity: "error",
    description: "OpenAI API key detected (should be sk-REDACTED)",
  },
  {
    label: "GitHub token",
    pattern: /ghp_[A-Za-z0-9]{20,}/g,
    severity: "error",
    description: "GitHub personal access token detected",
  },
  {
    label: "Anthropic API key",
    pattern: /sk-ant-[A-Za-z0-9-]{20,}/g,
    severity: "error",
    description: "Anthropic API key detected",
  },
  {
    label: "AWS access key",
    pattern: /AKIA[A-Z0-9]{16}/g,
    severity: "error",
    description: "AWS access key ID detected",
  },
  {
    label: "Generic long token",
    pattern: /[A-Za-z0-9_-]{40,}/g,
    severity: "warning",
    description: "Potential long token or key detected (review manually)",
  },

  // Secret field values - should have [REDACTED] value
  {
    label: "Unredacted secret field",
    pattern: /"(?:api[_-]?key|secret|token|password|access[_-]?token|refresh[_-]?token)"\s*:\s*"(?!\[REDACTED\])[^"]{8,}"/gi,
    severity: "error",
    description: "Secret field contains value that wasn't redacted",
  },

  // Bearer tokens - should be redacted
  {
    label: "Bearer token",
    pattern: /Bearer\s+(?!\[REDACTED\])[A-Za-z0-9._~+\/=\-]{20,}/gi,
    severity: "error",
    description: "Bearer token detected (should be Bearer [REDACTED])",
  },

  // Env assignments with real values
  {
    label: "Env secret assignment",
    pattern: /(API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE_KEY)=(?!\[REDACTED\])[^\s"']{8,}/gi,
    severity: "error",
    description: "Environment variable assignment with unredacted secret",
  },

  // Unredacted paths
  {
    label: "macOS user path",
    pattern: /\/Users\/(?!<redacted>)[a-zA-Z][a-zA-Z0-9_-]{2,}\//g,
    severity: "error",
    description: "macOS path with real username (should be /Users/<redacted>/)",
  },
  {
    label: "Linux home path",
    pattern: /\/home\/(?!<redacted>|ubuntu)[a-zA-Z][a-zA-Z0-9_-]{2,}\//g,
    severity: "error",
    description: "Linux path with real username (should be /home/<redacted>/)",
  },
  {
    label: "Windows user path",
    pattern: /C:\\Users\\(?!<redacted>)[a-zA-Z][a-zA-Z0-9_-]{2,}\\/gi,
    severity: "error",
    description: "Windows path with real username",
  },

  // Common sensitive patterns
  {
    label: "Private key header",
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    severity: "error",
    description: "Private key detected - must not be published",
  },
  {
    label: "SSH key",
    pattern: /ssh-(rsa|ed25519|ecdsa)\s+[A-Za-z0-9+\/=]{40,}/g,
    severity: "error",
    description: "SSH public key detected (may reveal identity)",
  },

  // Email addresses (potential PII)
  {
    label: "Email address",
    pattern: /[a-zA-Z0-9._%+-]+@(?!example\.com|test\.com|anthropic\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    severity: "warning",
    description: "Email address detected (review if personal)",
  },

  // IP addresses (internal networks)
  {
    label: "Private IP address",
    pattern: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g,
    severity: "warning",
    description: "Private IP address detected",
  },
];

// Allowlist patterns that are OK to appear
// Note: No /g flag needed here since we only use .test() for matching
const ALLOWLIST: RegExp[] = [
  /sk-REDACTED/,
  /ghp_REDACTED/,
  /\[REDACTED\]/,
  /<redacted>/,
  /example\.com/,
  /test\.com/,
  /localhost/,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
];

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function getContext(content: string, index: number, matchLength: number): string {
  const start = Math.max(0, index - 30);
  const end = Math.min(content.length, index + matchLength + 30);
  let context = content.slice(start, end);

  // Replace newlines for display
  context = context.replace(/\n/g, "↵");

  // Add ellipsis if truncated
  if (start > 0) context = "..." + context;
  if (end < content.length) context = context + "...";

  return context;
}

function isAllowlisted(match: string): boolean {
  return ALLOWLIST.some((pattern) => pattern.test(match));
}

function validate(content: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const rule of VALIDATION_RULES) {
    const matches: ValidationResult["matches"] = [];

    // Reset regex state
    rule.pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = rule.pattern.exec(content)) !== null) {
      const matchStr = match[0];

      // Skip allowlisted matches
      if (isAllowlisted(matchStr)) continue;

      matches.push({
        match: matchStr.length > 60 ? matchStr.slice(0, 57) + "..." : matchStr,
        context: getContext(content, match.index, matchStr.length),
        line: getLineNumber(content, match.index),
      });

      // Prevent infinite loops on zero-width matches
      if (match.index === rule.pattern.lastIndex) {
        rule.pattern.lastIndex++;
      }
    }

    if (matches.length > 0) {
      results.push({
        rule: rule.label,
        severity: rule.severity,
        matches,
      });
    }
  }

  return results;
}

function formatResults(results: ValidationResult[]): string {
  const lines: string[] = [];

  const errors = results.filter((r) => r.severity === "error");
  const warnings = results.filter((r) => r.severity === "warning");

  if (errors.length > 0) {
    lines.push("\n❌ ERRORS (must fix before publication):\n");
    for (const result of errors) {
      lines.push(`  ${result.rule} (${result.matches.length} occurrence(s))`);
      for (const match of result.matches.slice(0, 3)) {
        lines.push(`    Line ${match.line}: ${match.match}`);
        lines.push(`    Context: ${match.context}`);
      }
      if (result.matches.length > 3) {
        lines.push(`    ... and ${result.matches.length - 3} more`);
      }
      lines.push("");
    }
  }

  if (warnings.length > 0) {
    lines.push("\n⚠️  WARNINGS (review manually):\n");
    for (const result of warnings) {
      lines.push(`  ${result.rule} (${result.matches.length} occurrence(s))`);
      for (const match of result.matches.slice(0, 2)) {
        lines.push(`    Line ${match.line}: ${match.match}`);
      }
      if (result.matches.length > 2) {
        lines.push(`    ... and ${result.matches.length - 2} more`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function main() {
  const inputPath = process.argv[2] ?? DEFAULT_INPUT;
  const strictMode = process.argv.includes("--strict");

  if (!existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error("Run redact-transcript.ts first to create the redacted file.");
    process.exit(1);
  }

  console.log(`Validating: ${inputPath}`);
  if (strictMode) {
    console.log("Mode: strict (warnings treated as errors)");
  }

  const content = readFileSync(inputPath, "utf-8");
  const results = validate(content);

  const errors = results.filter((r) => r.severity === "error");
  const warnings = results.filter((r) => r.severity === "warning");

  if (results.length === 0) {
    console.log("\n✅ Validation passed - no suspicious patterns detected");
    console.log("   Safe to publish this transcript.\n");
    process.exit(0);
  }

  console.log(formatResults(results));

  const totalErrors = errors.reduce((sum, r) => sum + r.matches.length, 0);
  const totalWarnings = warnings.reduce((sum, r) => sum + r.matches.length, 0);

  console.log(`Summary: ${totalErrors} error(s), ${totalWarnings} warning(s)\n`);

  if (errors.length > 0) {
    console.log("❌ Publication blocked - fix errors above and run redact-transcript.ts again");
    process.exit(1);
  }

  if (strictMode && warnings.length > 0) {
    console.log("❌ Publication blocked (strict mode) - review warnings above");
    process.exit(1);
  }

  console.log("⚠️  Warnings present - review before publication");
  process.exit(0);
}

main();
