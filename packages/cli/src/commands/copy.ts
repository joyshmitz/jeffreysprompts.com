import { spawn } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { input, select, editor } from "@inquirer/prompts";
import { getPrompt } from "@jeffreysprompts/core/prompts";
import {
  renderPrompt,
  getMissingVariables,
  extractVariables,
} from "@jeffreysprompts/core/template/render";
import type { PromptVariable } from "@jeffreysprompts/core/prompts/types";
import chalk from "chalk";
import { shouldOutputJson } from "../lib/utils";

interface CopyOptions {
  fill?: boolean;
  json?: boolean;
}

// Max file size for 'file' type variables (100KB)
const MAX_FILE_VAR_SIZE = 102400;

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

  if (variable.type === "file" && value && existsSync(value)) {
    return readFileVariable(value, variable.name);
  }

  return value;
}

/**
 * Copy text to clipboard using platform-specific tools
 */
async function copyToClipboard(text: string): Promise<boolean> {
  const platform = process.platform;
  let cmd: string;
  let args: string[] = [];

  if (platform === "darwin") {
    cmd = "pbcopy";
  } else if (platform === "win32") {
    cmd = "clip";
  } else {
    // Linux: prefer wl-copy (Wayland), fall back to xclip (X11)
    const hasWlCopy = await new Promise<boolean>((resolve) => {
      const check = spawn("which", ["wl-copy"]);
      check.on("close", (code) => resolve(code === 0));
      check.on("error", () => resolve(false));
    });

    if (hasWlCopy) {
      cmd = "wl-copy";
    } else {
      cmd = "xclip";
      args = ["-selection", "clipboard"];
    }
  }

  return new Promise<boolean>((resolve) => {
    const proc = spawn(cmd, args, { stdio: ["pipe", "inherit", "inherit"] });

    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));

    proc.stdin?.write(text);
    proc.stdin?.end();
  });
}

export async function copyCommand(id: string, options: CopyOptions) {
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
        } catch {
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

  // Render the prompt
  const rendered = renderPrompt(prompt, variables);

  // Copy to clipboard
  const success = await copyToClipboard(rendered);

  if (shouldOutputJson(options)) {
    if (success) {
      console.log(JSON.stringify({
        success: true,
        id: prompt.id,
        title: prompt.title,
        bytes: rendered.length,
        message: `Copied "${prompt.title}" to clipboard`,
      }));
    } else {
      console.log(JSON.stringify({
        success: false,
        error: "clipboard_failed",
        message: "Failed to copy to clipboard - no clipboard tool available",
        fallback: rendered,
      }));
      process.exit(1);
    }
  } else {
    if (success) {
      console.log(chalk.green(`✓ Copied "${prompt.title}" to clipboard`));
      console.log(chalk.dim(`  ${rendered.length} bytes`));
    } else {
      console.error(chalk.yellow("Clipboard tool not found. Outputting to stdout:"));
      console.log();
      console.log(rendered);
    }
  }
}
