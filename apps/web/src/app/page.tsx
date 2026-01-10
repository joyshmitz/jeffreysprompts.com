"use client";

import { useState, useMemo, useCallback } from "react";
import { prompts, categories } from "@jeffreysprompts/core/prompts/registry";
import { searchPrompts } from "@jeffreysprompts/core/search/engine";
import { Hero } from "@/components/Hero";
import { PromptGrid } from "@/components/PromptGrid";
import type { Prompt, PromptCategory } from "@jeffreysprompts/core/prompts/types";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | null>(null);

  // Filter prompts based on search and category
  const filteredPrompts = useMemo(() => {
    if (searchQuery.trim()) {
      const results = searchPrompts(searchQuery, {
        category: selectedCategory ?? undefined,
        limit: 50,
      });
      return results.map((r) => r.prompt);
    }

    if (selectedCategory) {
      return prompts.filter((p) => p.category === selectedCategory);
    }

    return prompts;
  }, [searchQuery, selectedCategory]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategorySelect = useCallback((category: PromptCategory | null) => {
    setSelectedCategory(category);
  }, []);

  const handlePromptClick = useCallback((prompt: Prompt) => {
    // TODO: Open prompt detail modal
    console.log("Clicked prompt:", prompt.id);
  }, []);

  const handlePromptCopy = useCallback((prompt: Prompt) => {
    // TODO: Show toast notification
    console.log("Copied prompt:", prompt.id);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero Section */}
      <Hero
        promptCount={prompts.length}
        categoryCount={categories.length}
        categories={categories}
        onSearch={handleSearch}
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />

      {/* Main Content */}
      <main className="container-wide px-4 sm:px-6 lg:px-8 py-12">
        {/* Results header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {selectedCategory ? (
                <span className="capitalize">{selectedCategory}</span>
              ) : searchQuery ? (
                "Search Results"
              ) : (
                "All Prompts"
              )}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? "s" : ""}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
        </div>

        {/* Prompt Grid */}
        <PromptGrid
          prompts={filteredPrompts}
          onPromptClick={handlePromptClick}
          onPromptCopy={handlePromptCopy}
        />
      </main>

      {/* Footer */}
      <footer className="border-t dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="container-wide px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                JeffreysPrompts.com
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Curated prompts for agentic coding
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/Dicklesworthstone/jeffreysprompts.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://x.com/doodlestein"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t dark:border-zinc-800 text-center">
            <p className="text-sm text-zinc-400">
              Install via CLI:{" "}
              <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded font-mono text-xs">
                curl -fsSL jeffreysprompts.com/install.sh | bash
              </code>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
