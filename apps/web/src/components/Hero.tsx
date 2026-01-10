"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Sparkles, Terminal, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PromptCategory } from "@jeffreysprompts/core/prompts/types";

interface HeroProps {
  promptCount: number;
  categoryCount: number;
  categories: PromptCategory[];
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: PromptCategory | null) => void;
  selectedCategory?: PromptCategory | null;
}

export function Hero({
  promptCount,
  categoryCount,
  categories,
  onSearch,
  onCategorySelect,
  selectedCategory,
}: HeroProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Initialize to "Ctrl" to match server-rendered HTML, update on mount
  const [modifierKey, setModifierKey] = useState("Ctrl");

  // Detect platform and update modifier key on client-side only
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.platform?.includes("Mac")) {
      setModifierKey("⌘");
    }
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.(searchQuery);
    },
    [searchQuery, onSearch]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      // TODO: Open spotlight search
    }
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient and orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950" />

        {/* Animated orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-400/20 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-gradient-to-tl from-blue-400/25 to-cyan-400/15 blur-3xl animate-pulse-slow animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-violet-400/10 to-transparent blur-2xl" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      </div>

      <div className="container-wide px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-indigo-100/80 dark:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Curated prompts for agentic coding
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Jeffrey&apos;s Prompts
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            A curated collection of battle-tested prompts for Claude, GPT, and other AI coding assistants.
            Copy, customize, and supercharge your development workflow.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{promptCount}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Prompts</div>
            </div>
            <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">{categoryCount}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Categories</div>
            </div>
            <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">Free</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Forever</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button size="lg" className="gap-2 px-6">
              <Download className="w-4 h-4" />
              Install CLI
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-6">
              <Terminal className="w-4 h-4" />
              <code className="text-xs font-mono">curl jeffreysprompts.com/install.sh | bash</code>
            </Button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto mb-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search prompts..."
                className="w-full h-12 pl-12 pr-24 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-zinc-400">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 font-mono">
                  {modifierKey}
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 font-mono">K</kbd>
              </div>
            </div>
          </form>

          {/* Category filter pills */}
          <div
            role="group"
            aria-label="Filter by category"
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <button
              type="button"
              aria-pressed={selectedCategory === null}
              className={cn(
                "inline-flex items-center rounded-full px-4 py-2 min-h-[44px] text-sm font-medium",
                "transition-all touch-manipulation",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                selectedCategory === null
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              )}
              onClick={() => onCategorySelect?.(null)}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={selectedCategory === category}
                className={cn(
                  "inline-flex items-center rounded-full px-4 py-2 min-h-[44px] text-sm font-medium capitalize",
                  "transition-all touch-manipulation",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  selectedCategory === category
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                )}
                onClick={() => onCategorySelect?.(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-400 animate-bounce">
        <span className="text-xs">Scroll to explore</span>
        <ArrowRight className="w-4 h-4 rotate-90" />
      </div>
    </section>
  );
}

export default Hero;
