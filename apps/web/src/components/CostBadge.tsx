"use client";

/**
 * CostBadge - Displays estimated cost for running a prompt
 *
 * Uses the core cost estimation utilities to calculate and display
 * approximate costs based on token count and selected model.
 */

import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  estimateCost,
  DEFAULT_MODEL,
  DEFAULT_PRICING_TABLE,
  type CurrencyCode,
} from "@jeffreysprompts/core";

interface CostBadgeProps {
  /** Estimated input tokens */
  tokens: number;
  /** Model to use for pricing (defaults to gpt-4o-mini) */
  model?: string;
  /** Output tokens estimate (defaults to 0 for prompt-only display) */
  outputTokens?: number;
  /** Size variant */
  variant?: "compact" | "detailed";
  /** Additional CSS classes */
  className?: string;
}

function formatCost(amount: number, currency: CurrencyCode): string {
  if (currency !== "USD") return `${amount.toFixed(4)} ${currency}`;
  // For very small amounts, show more decimals
  if (amount < 0.01) {
    return `$${amount.toFixed(4)}`;
  }
  return `$${amount.toFixed(2)}`;
}

export function CostBadge({
  tokens,
  model = DEFAULT_MODEL,
  outputTokens = 0,
  variant = "compact",
  className,
}: CostBadgeProps) {
  const estimate = estimateCost({
    model,
    inputTokens: tokens,
    outputTokens,
    pricingTable: DEFAULT_PRICING_TABLE,
  });

  // If no pricing data for the model, don't render
  if (!estimate) {
    return null;
  }

  const formattedCost = formatCost(estimate.totalCost, estimate.currency);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500",
          className
        )}
        title={`Estimated cost using ${model}: ${formattedCost} (${tokens} input tokens)`}
      >
        <DollarSign className="w-3 h-3" />
        <span>{formattedCost}</span>
      </div>
    );
  }

  // Detailed variant with model info
  return (
    <div
      className={cn(
        "flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <DollarSign className="w-3.5 h-3.5" />
        <span className="font-medium">{formattedCost}</span>
        <span className="text-neutral-400 dark:text-neutral-500">est.</span>
      </div>
      <span className="text-xs text-neutral-400 dark:text-neutral-500">
        {model} @ {tokens} tokens
      </span>
    </div>
  );
}

export default CostBadge;
