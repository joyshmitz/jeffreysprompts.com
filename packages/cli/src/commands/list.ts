import { prompts as publicPrompts, type Prompt } from "@jeffreysprompts/core/prompts";
import Table from "cli-table3";
import chalk from "chalk";
import { apiClient, isAuthError, requiresPremium } from "../lib/api-client";
import { isLoggedIn } from "../lib/credentials";
import { shouldOutputJson } from "../lib/utils";

interface ListOptions {
  category?: string;
  tag?: string;
  json?: boolean;
  mine?: boolean;
  saved?: boolean;
}

function normalizePromptPayload(payload: unknown): Prompt[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload as Prompt[];
  }
  if (typeof payload === "object" && payload !== null) {
    const data = payload as { prompts?: unknown };
    if (Array.isArray(data.prompts)) {
      return data.prompts as Prompt[];
    }
  }
  return [];
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

function applyFilters(results: Prompt[], options: ListOptions): Prompt[] {
  let filtered = results;

  if (options.category) {
    filtered = filtered.filter((p) => p.category === options.category);
  }

  if (options.tag) {
    filtered = filtered.filter((p) => p.tags.includes(options.tag!));
  }

  return filtered;
}

async function fetchPromptList(
  endpoint: string,
  options: ListOptions,
  contextLabel: string,
  allowFailure: boolean
): Promise<Prompt[]> {
  const response = await apiClient.get<unknown>(endpoint);

  if (response.ok) {
    return normalizePromptPayload(response.data);
  }

  if (allowFailure) {
    if (!shouldOutputJson(options)) {
      console.log(chalk.yellow(`Warning: Could not load ${contextLabel}. Showing public prompts only.`));
    }
    return [];
  }

  if (isAuthError(response)) {
    if (shouldOutputJson(options)) {
      console.log(JSON.stringify({
        success: false,
        error: "not_authenticated",
        message: "You must be logged in to list personal prompts",
      }));
    } else {
      console.log(chalk.yellow("You must be logged in to list personal prompts."));
      console.log(chalk.dim("Run 'jfp login' to sign in."));
    }
    process.exit(1);
  }

  if (requiresPremium(response)) {
    if (shouldOutputJson(options)) {
      console.log(JSON.stringify({
        success: false,
        error: "premium_required",
        message: "Listing personal prompts requires a Premium subscription",
      }));
    } else {
      console.log(chalk.yellow("Listing personal prompts requires a Premium subscription."));
      console.log(chalk.dim("Upgrade at https://pro.jeffreysprompts.com"));
    }
    process.exit(1);
  }

  if (shouldOutputJson(options)) {
    console.log(JSON.stringify({
      success: false,
      error: "api_error",
      status: response.status,
      message: response.error || "Failed to load personal prompts",
    }));
  } else {
    console.log(chalk.red(`Failed to load ${contextLabel}: ${response.error || "Unknown error"}`));
  }
  process.exit(1);
}

export async function listCommand(options: ListOptions) {
  let results = publicPrompts;

  const wantsMine = options.mine === true;
  const wantsSaved = options.saved === true;
  const loggedIn = await isLoggedIn();

  if ((wantsMine || wantsSaved) && !loggedIn) {
    if (shouldOutputJson(options)) {
      console.log(JSON.stringify({
        success: false,
        error: "not_authenticated",
        message: "You must be logged in to list personal prompts",
      }));
    } else {
      console.log(chalk.yellow("You must be logged in to list personal prompts."));
      console.log(chalk.dim("Run 'jfp login' to sign in."));
    }
    process.exit(1);
  }

  if (loggedIn) {
    if (wantsMine || wantsSaved) {
      const sources: Prompt[] = [];

      if (wantsMine) {
        sources.push(
          ...await fetchPromptList("/cli/prompts/mine", options, "your prompts", false)
        );
      }

      if (wantsSaved) {
        sources.push(
          ...await fetchPromptList("/cli/prompts/saved", options, "saved prompts", false)
        );
      }

      results = mergePrompts([], sources);
    } else {
      const personalPrompts = await fetchPromptList(
        "/cli/prompts/mine",
        options,
        "your prompts",
        true
      );
      results = mergePrompts(results, personalPrompts);
    }
  }

  results = applyFilters(results, options);

  if (shouldOutputJson(options)) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const table = new Table({
    head: ["ID", "Title", "Category", "Tags"],
    style: { head: ["cyan"] },
  });

  for (const prompt of results) {
    table.push([
      prompt.id,
      prompt.title,
      chalk.green(prompt.category),
      prompt.tags.slice(0, 3).join(", "),
    ]);
  }

  console.log(table.toString());
  console.log(chalk.dim(`
Found ${results.length} prompts`));
}
