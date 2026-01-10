#!/usr/bin/env bun
// scripts/validate-prompts.ts
// CI validation script for prompt definitions

import { prompts } from "@jeffreysprompts/core/prompts";
import { bundles } from "@jeffreysprompts/core/prompts/bundles";
import { PromptSchema } from "@jeffreysprompts/core/prompts/schema";

interface ValidationError {
  id: string;
  type: "schema" | "duplicate" | "format" | "content" | "bundle";
  message: string;
}

function validate(): ValidationError[] {
  const errors: ValidationError[] = [];
  const ids = new Set<string>();

  console.log("Validating prompts...\n");

  for (const prompt of prompts) {
    // Schema validation
    const result = PromptSchema.safeParse(prompt);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          id: prompt.id,
          type: "schema",
          message: `${issue.path.join(".")}: ${issue.message}`,
        });
      }
    }

    // Duplicate ID check
    if (ids.has(prompt.id)) {
      errors.push({
        id: prompt.id,
        type: "duplicate",
        message: "Duplicate ID detected",
      });
    }
    ids.add(prompt.id);

    // ID format check (lowercase kebab-case, starting with letter)
    if (!/^[a-z][a-z0-9-]*$/.test(prompt.id)) {
      errors.push({
        id: prompt.id,
        type: "format",
        message: "ID must be lowercase kebab-case starting with a letter",
      });
    }

    // Content check
    if (!prompt.content?.trim()) {
      errors.push({
        id: prompt.id,
        type: "content",
        message: "Empty or missing content",
      });
    }

    // Content minimum length check
    if (prompt.content && prompt.content.trim().length < 20) {
      errors.push({
        id: prompt.id,
        type: "content",
        message: "Content is too short (minimum 20 characters)",
      });
    }
  }

  // Validate bundles reference valid prompt IDs
  console.log("Validating bundles...\n");
  
  for (const bundle of bundles) {
    for (const promptId of bundle.promptIds) {
      if (!ids.has(promptId)) {
        errors.push({
          id: bundle.id,
          type: "bundle",
          message: `Bundle references non-existent prompt: ${promptId}`,
        });
      }
    }
  }

  return errors;
}

function main() {
  console.log("=".repeat(60));
  console.log("  JeffreysPrompts Validation Script");
  console.log("=".repeat(60));
  console.log();

  const errors = validate();

  if (errors.length === 0) {
    console.log(`✅ Validated ${prompts.length} prompts successfully`);
    console.log(`✅ Validated ${bundles.length} bundles successfully`);
    console.log();
    process.exit(0);
  }

  console.error("❌ Validation failed:\n");

  // Group errors by ID
  const byId = new Map<string, ValidationError[]>();
  for (const error of errors) {
    const list = byId.get(error.id) || [];
    list.push(error);
    byId.set(error.id, list);
  }

  for (const [id, idErrors] of byId) {
    console.error(`  [${id}]`);
    for (const error of idErrors) {
      console.error(`    - [${error.type}] ${error.message}`);
    }
    console.error();
  }

  console.error(`Total: ${errors.length} error(s) in ${byId.size} item(s)`);
  process.exit(1);
}

main();
