/**
 * Collections Command
 *
 * Manage user collections (premium feature)
 * - jfp collections: List all user collections
 * - jfp collections <name>: Show prompts in a collection
 * - jfp collections <name> --add <prompt-id>: Add prompt to collection
 */

import { atomicWriteFileSync, exitWithDeprecatedSkillCommand, isSafeSkillId, shouldOutputJson } from "../lib/utils";
import Table from "cli-table3";
import boxen from "boxen";
import chalk from "chalk";
import { ApiClient, isAuthError } from "../lib/api-client";
import { isLoggedIn, loadCredentials } from "../lib/credentials";
import { generatePromptMarkdown } from "@jeffreysprompts/core/export/markdown";
import { type Prompt } from "@jeffreysprompts/core/prompts";
import { resolvePromptById } from "../lib/prompt-resolution";
import { loadRegistry, type LoadedRegistry } from "../lib/registry-loader";

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  promptCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionDetail extends CollectionItem {
  prompts: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
  }>;
}

interface CollectionsListOptions {
  json?: boolean;
}

interface CollectionShowOptions {
  json?: boolean;
  add?: string; // Prompt ID to add to collection
  export?: boolean;
  format?: "skill" | "md";
  stdout?: boolean;
}

interface CollectionCreateOptions {
  json?: boolean;
  description?: string;
}

interface CollectionExportOptions {
  json?: boolean;
  format?: "skill" | "md";
  stdout?: boolean;
}

interface CollectionExportResult {
  id: string;
  file?: string;
  source?: string;
  content?: string;
}

function writeJson(payload: Record<string, unknown>): void {
  console.log(JSON.stringify(payload));
}

function writeJsonError(
  code: string,
  message: string,
  extra: Record<string, unknown> = {}
): void {
  writeJson({ error: true, code, message, ...extra });
}

/**
 * Check if user is logged in and show appropriate message if not
 * Returns false if not logged in (and command should exit)
 */
async function requireAuth(
  options: { json?: boolean },
  env = process.env
): Promise<boolean> {
  const loggedIn = await isLoggedIn(env);

  if (!loggedIn) {
    if (shouldOutputJson(options)) {
      writeJsonError("not_authenticated", "You must be logged in to use collections", {
        hint: "Run 'jfp login' to sign in",
      });
    } else {
      console.log(chalk.yellow("You must be logged in to use collections"));
      console.log(chalk.dim("Run 'jfp login' to sign in to JeffreysPrompts Premium"));
    }
    process.exit(1);
  }

  return true;
}

/**
 * Check if user has premium tier
 * Returns false if free tier (and command should exit)
 */
async function requirePremium(
  options: { json?: boolean },
  env = process.env
): Promise<boolean> {
  if (env.JFP_TOKEN) {
    return true;
  }

  const creds = await loadCredentials(env);

  if (creds?.tier === "premium") {
    return true;
  }

  if (shouldOutputJson(options)) {
    writeJsonError("premium_required", "Collections require a premium subscription", {
      hint: "Visit https://pro.jeffreysprompts.com/pricing to upgrade",
    });
  } else {
    console.log(chalk.yellow("Collections require a premium subscription"));
    console.log(chalk.dim("Visit https://pro.jeffreysprompts.com/pricing to upgrade"));
  }
  process.exit(1);

  return false;
}

/**
 * Helper to check if request requires premium tier
 */
function isPremiumError(response: { status: number; error?: string }): boolean {
  return (
    response.status === 403 &&
    (response.error?.toLowerCase().includes("premium") ?? false)
  );
}

async function resolvePromptForExport(
  promptId: string,
  options: CollectionExportOptions,
  env = process.env,
  registry?: LoadedRegistry
): Promise<{ prompt?: Prompt; source?: string; error?: string }> {
  const resolved = await resolvePromptById(promptId, { env, registry });

  if (resolved.prompt) {
    return { prompt: resolved.prompt, source: resolved.source };
  }

  if (resolved.error === "auth_expired") {
    if (shouldOutputJson(options)) {
      writeJsonError(
        "auth_expired",
        "Session expired. Please run 'jfp login' again."
      );
    } else {
      console.log(chalk.yellow("Session expired. Please run 'jfp login' again."));
    }
    process.exit(1);
  }

  if (resolved.error === "premium_required") {
    if (shouldOutputJson(options)) {
      writeJsonError(
        "premium_required",
        "Exporting collections requires a premium subscription"
      );
    } else {
      console.log(
        chalk.yellow("Exporting collections requires a premium subscription")
      );
    }
    process.exit(1);
  }

  return { error: resolved.message || "Failed to load prompt content" };
}

/**
 * List all user collections
 */
export async function collectionsCommand(
  options: CollectionsListOptions,
  env = process.env
): Promise<void> {
  await requireAuth(options, env);
  await requirePremium(options, env);

  const apiClient = new ApiClient({ env });
  const response = await apiClient.get<CollectionItem[]>("/cli/collections");

  if (!response.ok) {
    if (isAuthError(response)) {
      if (shouldOutputJson(options)) {
        writeJsonError(
          "auth_expired",
          "Session expired. Please run 'jfp login' again."
        );
      } else {
        console.log(chalk.yellow("Session expired. Please run 'jfp login' again."));
      }
      process.exit(1);
    }

    if (isPremiumError(response)) {
      if (shouldOutputJson(options)) {
        writeJsonError(
          "premium_required",
          "Collections require a premium subscription"
        );
      } else {
        console.log(chalk.yellow("Collections require a premium subscription"));
      }
      process.exit(1);
    }

    if (shouldOutputJson(options)) {
      writeJsonError("api_error", response.error || "Failed to fetch collections");
    } else {
      console.log(
        chalk.red("Failed to fetch collections: " + (response.error || "Unknown error"))
      );
    }
    process.exit(1);
  }

  const collections = response.data || [];

  if (shouldOutputJson(options)) {
    writeJson({ collections, count: collections.length });
    return;
  }

  if (collections.length === 0) {
    console.log(chalk.dim("You don't have any collections yet."));
    console.log(
      chalk.dim(
        "Create a collection at jeffreysprompts.com or use 'jfp collections <name> --add <prompt-id>'"
      )
    );
    return;
  }

  const table = new Table({
    head: ["Name", "Prompts", "Updated"],
    style: { head: ["cyan"] },
  });

  for (const collection of collections) {
    table.push([
      chalk.bold(collection.name),
      chalk.yellow(collection.promptCount.toString()),
      chalk.dim(new Date(collection.updatedAt).toLocaleDateString()),
    ]);
  }

  console.log(table.toString());
  console.log(
    chalk.dim(
      `\nFound ${collections.length} collections. Use "jfp collections <name>" for details.`
    )
  );
}

/**
 * Show collection details or add prompt to collection
 */
export async function collectionShowCommand(
  name: string,
  options: CollectionShowOptions,
  env = process.env
): Promise<void> {
  await requireAuth(options, env);
  await requirePremium(options, env);

  // Handle --add flag
  if (options.add) {
    return addToCollection(name, options.add, options, env);
  }

  // Handle --export flag
  if (options.export) {
    return exportCollectionCommand(name, options, env);
  }

  const apiClient = new ApiClient({ env });
  // Fetch collection details
  const response = await apiClient.get<CollectionDetail>(
    `/cli/collections/${encodeURIComponent(name)}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      if (shouldOutputJson(options)) {
        writeJsonError("not_found", `Collection not found: ${name}`);
      } else {
        console.log(chalk.red(`Collection not found: ${name}`));
        console.log(chalk.dim("Use 'jfp collections' to list your collections"));
      }
      process.exit(1);
    }

    if (isAuthError(response)) {
      if (shouldOutputJson(options)) {
        writeJsonError(
          "auth_expired",
          "Session expired. Please run 'jfp login' again."
        );
      } else {
        console.log(chalk.yellow("Session expired. Please run 'jfp login' again."));
      }
      process.exit(1);
    }

    if (shouldOutputJson(options)) {
      writeJsonError("api_error", response.error || "Failed to fetch collection");
    } else {
      console.log(
        chalk.red(
          "Failed to fetch collection: " + (response.error || "Unknown error")
        )
      );
    }
    process.exit(1);
  }

  const collection = response.data!;

  if (shouldOutputJson(options)) {
    const { prompts, ...meta } = collection;
    writeJson({
      collection: meta,
      items: prompts,
      count: prompts.length,
    });
    return;
  }

  // Build formatted output
  let content = chalk.bold.cyan(collection.name) + "\n";
  if (collection.description) {
    content += chalk.dim(collection.description) + "\n";
  }
  content += "\n";

  content += chalk.green("Prompts:") + " " + collection.promptCount + "\n";
  content +=
    chalk.green("Updated:") +
    " " +
    new Date(collection.updatedAt).toLocaleDateString() +
    "\n";

  if (collection.prompts.length > 0) {
    content += "\n" + chalk.dim("─".repeat(50)) + "\n\n";
    content += chalk.bold("Prompts in Collection") + "\n\n";

    for (const prompt of collection.prompts) {
      content += "  " + chalk.cyan("•") + " " + chalk.bold(prompt.title) + "\n";
      content += "    " + chalk.dim(prompt.description) + "\n";
      content +=
        "    " +
        chalk.dim("ID: " + prompt.id + " | Category: " + prompt.category) +
        "\n\n";
    }
  } else {
    content += "\n" + chalk.dim("This collection is empty.") + "\n";
  }

  console.log(
    boxen(content, {
      padding: 1,
      borderStyle: "round",
      borderColor: "cyan",
    })
  );

  console.log(
    chalk.dim("\nAdd a prompt: jfp collections " + name + " --add <prompt-id>")
  );
  console.log(chalk.dim("Export prompts: jfp collections " + name + " --export"));
}

/**
 * Create a new collection
 */
export async function collectionCreateCommand(
  name: string,
  options: CollectionCreateOptions,
  env = process.env
): Promise<void> {
  await requireAuth(options, env);
  await requirePremium(options, env);

  const trimmedName = name.trim();
  if (!trimmedName) {
    if (shouldOutputJson(options)) {
      writeJsonError("missing_argument", "Collection name is required");
    } else {
      console.log(chalk.red("Collection name is required"));
      console.log(chalk.dim("Usage: jfp collections create <name>"));
    }
    process.exit(1);
  }

  const apiClient = new ApiClient({ env });
  const response = await apiClient.post<
    CollectionItem | { collection: CollectionItem }
  >("/cli/collections", { name: trimmedName, description: options.description });

  if (!response.ok) {
    if (response.status === 409) {
      if (shouldOutputJson(options)) {
        writeJsonError(
          "already_exists",
          `Collection already exists: ${trimmedName}`
        );
      } else {
        console.log(chalk.yellow(`Collection already exists: ${trimmedName}`));
      }
      process.exit(1);
    }

    if (isAuthError(response)) {
      if (shouldOutputJson(options)) {
        writeJsonError(
          "auth_expired",
          "Session expired. Please run 'jfp login' again."
        );
      } else {
        console.log(chalk.yellow("Session expired. Please run 'jfp login' again."));
      }
      process.exit(1);
    }

    if (isPremiumError(response)) {
      if (shouldOutputJson(options)) {
        writeJsonError(
          "premium_required",
          "Collections require a premium subscription"
        );
      } else {
        console.log(chalk.yellow("Collections require a premium subscription"));
      }
      process.exit(1);
    }

    if (shouldOutputJson(options)) {
      writeJsonError("api_error", response.error || "Failed to create collection");
    } else {
      console.log(
        chalk.red(
          "Failed to create collection: " + (response.error || "Unknown error")
        )
      );
    }
    process.exit(1);
  }

  const data = response.data as CollectionItem | { collection: CollectionItem };
  const collection =
    (data as { collection?: CollectionItem }).collection ?? (data as CollectionItem);

  if (shouldOutputJson(options)) {
    writeJson({
      created: true,
      collection,
    });
    return;
  }

  console.log(chalk.green(`Created collection "${collection.name}"`));
  console.log(
    chalk.dim(`Add prompts with: jfp collections add ${collection.name} <prompt-id>`)
  );
}

/**
 * Add a prompt to a collection (explicit command form)
 */
export async function collectionAddCommand(
  name: string,
  promptId: string,
  options: CollectionShowOptions,
  env = process.env
): Promise<void> {
  await requireAuth(options, env);
  await requirePremium(options, env);
  return addToCollection(name, promptId, options, env);
}

/**
 * Export prompts from a collection
 */
export async function exportCollectionCommand(
  name: string,
  options: CollectionExportOptions,
  env = process.env
): Promise<void> {
  await requireAuth(options, env);
  await requirePremium(options, env);
  const jsonOutput = shouldOutputJson(options);

  const apiClient = new ApiClient({ env });
  const response = await apiClient.get<CollectionDetail>(
    `/cli/collections/${encodeURIComponent(name)}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      if (shouldOutputJson(options)) {
        writeJsonError("not_found", `Collection not found: ${name}`);
      } else {
        console.log(chalk.red(`Collection not found: ${name}`));
      }
      process.exit(1);
    }

    if (isAuthError(response)) {
      if (shouldOutputJson(options)) {
        writeJsonError(
          "auth_expired",
          "Session expired. Please run 'jfp login' again."
        );
      } else {
        console.log(chalk.yellow("Session expired. Please run 'jfp login' again."));
      }
      process.exit(1);
    }

    if (shouldOutputJson(options)) {
      writeJsonError("api_error", response.error || "Failed to fetch collection");
    } else {
      console.log(
        chalk.red(
          "Failed to fetch collection: " + (response.error || "Unknown error")
        )
      );
    }
    process.exit(1);
  }

  const collection = response.data!;
  const promptIds = collection.prompts?.map((prompt) => prompt.id) ?? [];

  if (promptIds.length === 0) {
    if (shouldOutputJson(options)) {
      writeJson({
        exported: [],
        failed: [],
        count: 0,
        collection: collection.name,
      });
    } else {
      console.log(chalk.dim(`Collection "${collection.name}" is empty.`));
    }
    return;
  }

  if (options.format === "skill") {
    exitWithDeprecatedSkillCommand(
      options,
      "Skill export moved to jsm. Run: jsm --help"
    );
  }

  const exported: CollectionExportResult[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  const registry = await loadRegistry(env);

  for (const [index, promptId] of promptIds.entries()) {
    const resolved = await resolvePromptForExport(promptId, options, env, registry);
    if (!resolved.prompt) {
      failed.push({
        id: promptId,
        error: resolved.error || "Failed to resolve prompt",
      });
      continue;
    }

    const content = generatePromptMarkdown(resolved.prompt);

    if (options.stdout) {
      if (jsonOutput) {
        exported.push({
          id: resolved.prompt.id,
          source: resolved.source,
          content,
        });
      } else {
        console.log(content);
        if (index < promptIds.length - 1) {
          console.log("\n---\n");
        }
        exported.push({ id: resolved.prompt.id, source: resolved.source });
      }
      continue;
    }

    if (!isSafeSkillId(resolved.prompt.id)) {
      failed.push({
        id: resolved.prompt.id,
        error: "Unsafe prompt id for filename",
      });
      continue;
    }

    const filename = `${resolved.prompt.id}.md`;

    try {
      atomicWriteFileSync(filename, content);
      exported.push({
        id: resolved.prompt.id,
        file: filename,
        source: resolved.source,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push({ id: resolved.prompt.id, error: message });
      if (!jsonOutput) {
        console.error(chalk.red(`Failed to write ${filename}: ${message}`));
      }
    }
  }

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          success: failed.length === 0,
          collection: collection.name,
          exported,
          failed: failed.length > 0 ? failed : undefined,
        },
        null,
        2
      )
    );
    if (failed.length > 0) {
      process.exit(1);
    }
    return;
  }

  if (exported.length > 0 && !options.stdout) {
    console.log(
      chalk.green(
        `Exported ${exported.length} prompt(s) from "${collection.name}".`
      )
    );
  }

  if (failed.length > 0) {
    if (options.stdout) {
      console.error(
        chalk.red(
          `Failed to export ${failed.length} prompt(s) from "${collection.name}".`
        )
      );
      for (const item of failed) {
        console.error(chalk.dim(`- ${item.id}: ${item.error}`));
      }
    } else {
      console.log(chalk.red(`Failed to export ${failed.length} prompt(s).`));
    }
    process.exit(1);
  }
}

/**
 * Add a prompt to a collection
 */
async function addToCollection(
  collectionName: string,
  promptId: string,
  options: CollectionShowOptions,
  env = process.env
): Promise<void> {
  const prompt = (await resolvePromptById(promptId, { env })).prompt;
  const promptTitle = prompt?.title ?? promptId;

  const apiClient = new ApiClient({ env });
  const response = await apiClient.post<{
    success: boolean;
    collection: string;
    promptId: string;
  }>(`/cli/collections/${encodeURIComponent(collectionName)}/prompts`, {
    promptId,
  });

  if (!response.ok) {
    if (response.status === 404) {
      if (shouldOutputJson(options)) {
        writeJsonError("not_found", `Collection not found: ${collectionName}`, {
          hint: `Create it first with: jfp collections create "${collectionName}"`,
        });
      } else {
        console.log(chalk.red(`Collection not found: ${collectionName}`));
        console.log(
          chalk.dim(`Create it first with: jfp collections create "${collectionName}"`)
        );
      }
      process.exit(1);
    }

    if (response.status === 409) {
      // Already in collection
      if (shouldOutputJson(options)) {
        writeJson({
          added: false,
          already_exists: true,
          collection: collectionName,
          prompt_id: promptId,
          prompt_title: prompt?.title ?? null,
          message: `Prompt "${promptTitle}" is already in collection "${collectionName}"`,
        });
      } else {
        console.log(
          chalk.yellow(
            `Prompt "${promptTitle}" is already in collection "${collectionName}"`
          )
        );
      }
      return;
    }

    if (isAuthError(response)) {
      if (shouldOutputJson(options)) {
        writeJsonError(
          "auth_expired",
          "Session expired. Please run 'jfp login' again."
        );
      } else {
        console.log(chalk.yellow("Session expired. Please run 'jfp login' again."));
      }
      process.exit(1);
    }

    if (isPremiumError(response)) {
      if (shouldOutputJson(options)) {
        writeJsonError(
          "premium_required",
          "Adding to collections requires a premium subscription"
        );
      } else {
        console.log(
          chalk.yellow("Adding to collections requires a premium subscription")
        );
      }
      process.exit(1);
    }

    if (shouldOutputJson(options)) {
      writeJsonError(
        "api_error",
        response.error || "Failed to add prompt to collection"
      );
    } else {
      console.log(
        chalk.red("Failed to add prompt: " + (response.error || "Unknown error"))
      );
    }
    process.exit(1);
  }

  if (shouldOutputJson(options)) {
    writeJson({
      added: true,
      collection: collectionName,
      prompt_id: promptId,
      prompt_title: prompt?.title ?? null,
      message: `Added "${promptTitle}" to collection "${collectionName}"`,
    });
  } else {
    console.log(
      chalk.green(`Added "${promptTitle}" to collection "${collectionName}"`)
    );
  }
}
