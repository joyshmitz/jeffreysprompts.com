"use client";

import { useState, useCallback } from "react";
import { Copy, Check, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Prompt } from "@jeffreysprompts/core/prompts/types";

interface PromptCardProps {
  prompt: Prompt;
  onCopy?: (prompt: Prompt) => void;
  onClick?: (prompt: Prompt) => void;
}

export function PromptCard({ prompt, onCopy, onClick }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(prompt.content);
        setCopied(true);
        onCopy?.(prompt);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API not available
      }
    },
    [prompt, onCopy]
  );

  const handleClick = useCallback(() => {
    onClick?.(prompt);
  }, [prompt, onClick]);

  return (
    <Card
      className={cn(
        "group relative flex flex-col h-full cursor-pointer",
        "hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800",
        "transition-all duration-200 ease-out",
        "bg-white dark:bg-zinc-900/50"
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="outline" className="capitalize text-xs">
            {prompt.category}
          </Badge>
          {prompt.featured && (
            <Badge className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              Featured
            </Badge>
          )}
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
          {prompt.title}
        </h3>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
          {prompt.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-xs text-zinc-400 px-1">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t dark:border-zinc-800">
        {/* Content preview */}
        <div className="w-full">
          <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg overflow-hidden h-20 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-50 dark:to-zinc-800/50 pointer-events-none" />
            <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              {prompt.content.slice(0, 200)}...
            </p>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {prompt.estimatedTokens && (
                <span>~{prompt.estimatedTokens} tokens</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                View
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default PromptCard;
