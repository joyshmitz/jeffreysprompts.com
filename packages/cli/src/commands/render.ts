import { existsSync, readFileSync, statSync } from "fs";
import { input, select, editor } from "@inquirer/prompts";
import { getPrompt } from "@jeffreysprompts/core/prompts";
import {
  renderPrompt,
  getMissingVariables,
  extractVariables,
} from "@jeffreysprompts/core/template/render";
import type { PromptVariable, PromptVariableType } from "@jeffreysprompts/core/prompts/types";
import chalk from "chalk";
import { shouldOutputJson } from "../lib/utils";

interface RenderOptions {
  context?: string;
  stdin?: boolean;
  maxContext?: string;
  fill?: boolean;
  json?: boolean;
}

// Default max context size (200KB)
const DEFAULT_MAX_CONTEXT = 204800;

// Max file size for 'file' type variables (100KB)
const MAX_FILE_VAR_SIZE = 102400;

// Parse --VAR=value args from raw argv (since cac doesn't handle dynamic flags well)
function parseVariables(args: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const arg of args) {
    const match = arg.match(/^--([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      vars[match[1]] = match[2];
    }
  }
  return vars;
}

/**
 * Read file contents with size capping for 'file' type variables
 */
function readFileVariable(path: string, varName: string): string {
  if (!existsSync(path)) {
    throw new Error(`File not found for variable ${varName}: ${path}`);
  }

  const stats = statSync(path);
  if (stats.size > MAX_FILE_VAR_SIZE) {
    const content = readFileSync(path, "utf-8").slice(0, MAX_FILE_VAR_SIZE);
    return content + `\n\n[File truncated to ${MAX_FILE_VAR_SIZE} bytes from ${stats.size} bytes]`;
  }

  return readFileSync(path, "utf-8");
}

/**
 * Prompt user interactively for a variable value
 */
async function promptForVariable(
  variable: PromptVariable,
  currentValue?: string
): Promise<string> {
  const defaultVal = currentValue || variable.default;

  switch (variable.type) {
    case "select":
      if (!variable.options?.length) {
        // Fall back to text input if no options
        return input({
          message: `${variable.label}${variable.description ? ` (${variable.description})` : ""}:`,
          default: defaultVal,
        });
      }
      return select({
        message: `${variable.label}${variable.description ? ` (${variable.description})` : ""}:`,
        choices: variable.options.map((opt) => ({ value: opt, name: opt })),
        default: defaultVal,
      });

    case "multiline":
      return editor({
        message: `${variable.label}${variable.description ? ` (${variable.description})` : ""}:`,
        default: defaultVal,
      });

    case "file":
      const filePath = await input({
        message: `${variable.label} (file path)${variable.description ? ` - ${variable.description}` : ""}:`,
        default: defaultVal,
        validate: (val) => {
          if (!val.trim()) return variable.required ? "File path is required" : true;
          if (!existsSync(val)) return `File not found: ${val}`;
          return true;
        },
      });
      if (!filePath.trim()) return "";
      return readFileVariable(filePath, variable.name);

    case "path":
      return input({
        message: `${variable.label} (path)${variable.description ? ` - ${variable.description}` : ""}:`,
        default: defaultVal,
        validate: (val) => {
          if (!val.trim() && variable.required) return "Path is required";
          return true;
        },
      });

    case "text":
    default:
      return input({
        message: `${variable.label}${variable.description ? ` (${variable.description})` : ""}:`,
        default: defaultVal,
      });
  }
}

/**
 * Process variable values, handling special types like 'file' and 'path'
 */
function processVariableValue(
  value: string,
  variable: PromptVariable | undefined
): string {
  if (!variable) return value;

  // For 'file' type passed via CLI flag, read the file contents
  if (variable.type === "file" && value && existsSync(value)) {
    return readFileVariable(value, variable.name);
  }

  // For 'path' type, just pass through the raw value
  return value;
}

export async function renderCommand(id: string, options: RenderOptions) {
  const prompt = getPrompt(id);
  if (!prompt) {
    if (shouldOutputJson(options)) {
      console.log(JSON.stringify({ error: "not_found", message: `Prompt not found: ${id}` }));
    } else {
      console.error(chalk.red(`Prompt not found: ${id}`));
    }
    process.exit(1);
  }

  // Parse CLI variables
  let variables = parseVariables(process.argv);

  // Process variable values based on their types
  const processedVars: Record<string, string> = {};
  for (const [name, value] of Object.entries(variables)) {
    const varDef = prompt.variables?.find((v) => v.name === name);
    processedVars[name] = processVariableValue(value, varDef);
  }
  variables = processedVars;

  // Interactive fill mode: prompt for missing variables
  if (options.fill && prompt.variables?.length) {
    const contentVars = extractVariables(prompt.content);
    const promptVars = prompt.variables.filter((v) => contentVars.includes(v.name));

    for (const varDef of promptVars) {
      if (!variables[varDef.name]) {
        try {
          const value = await promptForVariable(varDef, variables[varDef.name]);
          if (value) {
            variables[varDef.name] = value;
          }
        } catch (err) {
          // User cancelled (Ctrl+C)
          if (shouldOutputJson(options)) {
            console.log(JSON.stringify({ error: "cancelled", message: "User cancelled input" }));
          } else {
            console.error(chalk.yellow("\nCancelled."));
          }
          process.exit(130);
        }
      }
    }
  }

  // Check for missing required variables
  const missing = getMissingVariables(prompt, variables);
  if (missing.length > 0 && !options.fill) {
    if (shouldOutputJson(options)) {
      console.log(JSON.stringify({
        error: "missing_variables",
        message: `Missing required variables: ${missing.join(", ")}`,
        missing,
        hint: "Use --fill to prompt interactively or provide --VAR=value flags",
      }));
    } else {
      console.error(chalk.red(`Missing required variables: ${missing.join(", ")}`));
      console.log(chalk.dim("Use --fill to prompt interactively or provide --VAR=value flags"));
    }
    process.exit(1);
  }

  // Handle context
  let context = "";
  const parsedMax = Number.parseInt(options.maxContext || String(DEFAULT_MAX_CONTEXT), 10);
  const maxContext = Number.isFinite(parsedMax) ? parsedMax : DEFAULT_MAX_CONTEXT;
  let contextSource = "";

  if (options.stdin) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    context = Buffer.concat(chunks).toString("utf-8");
    contextSource = "stdin";
  } else if (options.context) {
    if (!existsSync(options.context)) {
      if (shouldOutputJson(options)) {
        console.log(JSON.stringify({ error: "file_not_found", message: `Context file not found: ${options.context}` }));
      } else {
        console.error(chalk.red(`Context file not found: ${options.context}`));
      }
      process.exit(1);
    }
    context = readFileSync(options.context, "utf-8");
    contextSource = options.context;
  }

  let truncated = false;
  if (context.length > maxContext) {
    context = context.slice(0, maxContext);
    truncated = true;
  }

  // Render the prompt with variables
  let rendered = renderPrompt(prompt, variables);

  // Append context if provided
  if (context) {
    rendered += "\n\n---\n\n## Context\n\n" + context;
    if (truncated) {
      const note = contextSource === "stdin"
        ? `[Context truncated to ${maxContext} bytes]`
        : `[Context from ${contextSource} truncated to ${maxContext} bytes]`;
      rendered += `\n\n${note}`;
    }
  }

  // Output
  if (shouldOutputJson(options)) {
    console.log(JSON.stringify({
      id: prompt.id,
      title: prompt.title,
      rendered,
      variables: Object.keys(variables).length > 0 ? variables : undefined,
      context: context ? { source: contextSource, truncated, bytes: context.length } : undefined,
    }, null, 2));
  } else {
    console.log(rendered);
  }
}
