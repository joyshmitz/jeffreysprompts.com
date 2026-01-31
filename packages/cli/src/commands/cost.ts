import chalk from "chalk";
import {
  DEFAULT_MODEL,
  DEFAULT_PRICING_TABLE,
  estimateCost,
  estimatePromptTokens,
  listPricedModels,
} from "@jeffreysprompts/core";
import { loadRegistry } from "../lib/registry-loader";
import { shouldOutputJson } from "../lib/utils";
import { isLoggedIn, loadCredentials } from "../lib/credentials";

interface CostOptions {
  json?: boolean;
  model?: string;
  outputTokens?: string;
  inputTokens?: string;
  priceIn?: string;
  priceOut?: string;
}

function writeJson(payload: Record<string, unknown>): void {
  console.log(JSON.stringify(payload, null, 2));
}

function writeJsonError(code: string, message: string, extra: Record<string, unknown> = {}): void {
  writeJson({ error: true, code, message, ...extra });
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseNonNegative(value: string | undefined, _field: string): number | null {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  if (!Number.isFinite(parsed) || parsed < 0) {
    return NaN;
  }
  return parsed;
}

async function requirePremium(options: { json?: boolean }, env = process.env): Promise<void> {
  const loggedIn = await isLoggedIn(env);
  if (!loggedIn) {
    if (shouldOutputJson(options)) {
      writeJsonError("not_authenticated", "Cost estimation requires login.", {
        hint: "Run 'jfp login' to sign in",
      });
    } else {
      console.log(chalk.yellow("Cost estimation requires login."));
      console.log(chalk.dim("Run 'jfp login' to sign in to JeffreysPrompts Premium"));
    }
    process.exit(1);
  }

  const creds = await loadCredentials(env);
  if (creds?.tier === "premium") return;

  if (shouldOutputJson(options)) {
    writeJsonError("premium_required", "Cost estimation requires a JeffreysPrompts Pro subscription.", {
      hint: "Visit https://pro.jeffreysprompts.com/pricing to upgrade",
    });
  } else {
    console.log(chalk.yellow("Cost estimation requires a JeffreysPrompts Pro subscription."));
    console.log(chalk.dim("Upgrade at https://pro.jeffreysprompts.com/pricing"));
    console.log(chalk.dim("Run 'jfp login' after upgrading."));
  }
  process.exit(1);
}

function formatCurrency(amount: number, currency: string): string {
  if (currency !== "USD") return `${amount.toFixed(6)} ${currency}`;
  return `$${amount.toFixed(6)}`;
}

export async function costCommand(
  promptId: string,
  options: CostOptions = {},
  env: NodeJS.ProcessEnv = process.env
): Promise<void> {
  await requirePremium(options, env);

  const registry = await loadRegistry();
  const prompt = registry.prompts.find((item) => item.id === promptId);

  if (!prompt) {
    if (shouldOutputJson(options)) {
      writeJsonError("prompt_not_found", `No prompt with id '${promptId}'`);
    } else {
      console.error(chalk.red(`No prompt with id '${promptId}'`));
    }
    process.exit(1);
  }

  const model = options.model ?? DEFAULT_MODEL;
  const inputOverride = parseNonNegative(options.inputTokens, "inputTokens");
  if (inputOverride !== null && !Number.isFinite(inputOverride)) {
    if (shouldOutputJson(options)) {
      writeJsonError("invalid_input_tokens", "Invalid --input-tokens value. Provide a non-negative number.");
    } else {
      console.error(chalk.red("Invalid --input-tokens value. Provide a non-negative number."));
    }
    process.exit(1);
  }

  const outputTokens = parseNonNegative(options.outputTokens, "outputTokens");
  if (outputTokens !== null && !Number.isFinite(outputTokens)) {
    if (shouldOutputJson(options)) {
      writeJsonError("invalid_output_tokens", "Invalid --output-tokens value. Provide a non-negative number.");
    } else {
      console.error(chalk.red("Invalid --output-tokens value. Provide a non-negative number."));
    }
    process.exit(1);
  }

  const priceIn = parseNonNegative(options.priceIn, "priceIn");
  const priceOut = parseNonNegative(options.priceOut, "priceOut");
  if ((priceIn === null) !== (priceOut === null)) {
    if (shouldOutputJson(options)) {
      writeJsonError("missing_pricing", "Provide both --price-in and --price-out or neither.");
    } else {
      console.error(chalk.red("Provide both --price-in and --price-out or neither."));
    }
    process.exit(1);
  }
  if ((priceIn !== null && !Number.isFinite(priceIn)) || (priceOut !== null && !Number.isFinite(priceOut))) {
    if (shouldOutputJson(options)) {
      writeJsonError("invalid_pricing", "Invalid pricing values. Provide non-negative numbers.");
    } else {
      console.error(chalk.red("Invalid pricing values. Provide non-negative numbers."));
    }
    process.exit(1);
  }

  const promptEstimate = estimatePromptTokens(prompt);
  const tokenEstimate = inputOverride ?? promptEstimate?.tokens ?? null;
  const tokenSource = inputOverride !== null ? "override" : promptEstimate?.source ?? "unknown";
  if (tokenEstimate === null) {
    if (shouldOutputJson(options)) {
      writeJsonError("missing_token_estimate", "Prompt has no estimated tokens and could not be estimated.");
    } else {
      console.error(chalk.red("Prompt has no estimated tokens and could not be estimated."));
    }
    process.exit(1);
  }

  const pricingTable =
    priceIn !== null && priceOut !== null
      ? { [model]: { inputPer1k: priceIn, outputPer1k: priceOut, currency: "USD" } }
      : DEFAULT_PRICING_TABLE;

  const estimate = estimateCost({
    model,
    inputTokens: tokenEstimate,
    outputTokens: outputTokens ?? 0,
    pricingTable,
  });

  if (!estimate) {
    const available = listPricedModels(DEFAULT_PRICING_TABLE);
    if (shouldOutputJson(options)) {
      writeJsonError("unknown_model", `No pricing configured for model '${model}'.`, {
        availableModels: available,
        hint: "Use --price-in/--price-out to provide pricing overrides.",
      });
    } else {
      console.error(chalk.red(`No pricing configured for model '${model}'.`));
      if (available.length > 0) {
        console.error(chalk.dim(`Available models: ${available.join(", ")}`));
      }
      console.error(chalk.dim("Use --price-in/--price-out to provide pricing overrides."));
    }
    process.exit(1);
  }

  if (shouldOutputJson(options)) {
    writeJson({
      prompt: { id: prompt.id, title: prompt.title },
      model: estimate.model,
      tokens: {
        input: estimate.inputTokens,
        output: estimate.outputTokens,
        total: estimate.totalTokens,
        source: tokenSource,
      },
      pricing: {
        inputPer1k: pricingTable[model].inputPer1k,
        outputPer1k: pricingTable[model].outputPer1k,
        currency: pricingTable[model].currency,
        unit: estimate.unit,
      },
      cost: {
        input: estimate.inputCost,
        output: estimate.outputCost,
        total: estimate.totalCost,
        currency: estimate.currency,
      },
    });
    return;
  }

  console.log(chalk.bold.cyan(`\nCost estimate for "${prompt.title}" (${prompt.id})`));
  console.log(chalk.dim(`Model: ${estimate.model}`));
  console.log(
    chalk.dim(
      `Tokens: input ${estimate.inputTokens} (${tokenSource}), output ${estimate.outputTokens}, total ${estimate.totalTokens}`
    )
  );
  console.log(
    chalk.dim(
      `Pricing: ${formatCurrency(pricingTable[model].inputPer1k, estimate.currency)}/1k input, ` +
        `${formatCurrency(pricingTable[model].outputPer1k, estimate.currency)}/1k output`
    )
  );
  console.log(chalk.green(`Estimated cost: ${formatCurrency(estimate.totalCost, estimate.currency)}`));
  console.log();
}
