"use client";

/**
 * Swap Meet - Community Prompts Marketplace
 *
 * Browse and discover community-contributed prompts.
 * Features: search, filtering, sorting, infinite scroll.
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Star,
  Sparkles,
  Users,
  ArrowUpDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommunityPromptCard } from "@/components/swap-meet/CommunityPromptCard";
import type { CommunityPrompt } from "@/lib/swap-meet/types";
import { sortByTrending } from "@/lib/discovery/trending";
import { localizeHref } from "@/i18n/config";
import { communityPrompts } from "@/lib/swap-meet/data";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "ideation", label: "Ideation" },
  { value: "documentation", label: "Documentation" },
  { value: "automation", label: "Automation" },
  { value: "refactoring", label: "Refactoring" },
  { value: "testing", label: "Testing" },
  { value: "debugging", label: "Debugging" },
  { value: "workflow", label: "Workflow" },
  { value: "communication", label: "Communication" },
];

const sortOptions = [
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "newest", label: "Newest", icon: Clock },
  { value: "top-rated", label: "Top Rated", icon: Star },
  { value: "most-copied", label: "Most Copied", icon: Users },
];

export default function SwapMeetPage() {
  const router = useRouter();
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort prompts
  const filteredPrompts = useMemo(() => {
    let results = [...communityPrompts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      results = results.filter((p) => p.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case "trending":
        // Use multi-factor trending algorithm
        results = sortByTrending(results);
        break;
      case "newest":
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "top-rated":
        results.sort((a, b) => b.stats.rating - a.stats.rating);
        break;
      case "most-copied":
        results.sort((a, b) => b.stats.copies - a.stats.copies);
        break;
    }

    return results;
  }, [searchQuery, selectedCategory, sortBy]);

  const featuredPrompts = useMemo(
    () => communityPrompts.filter((p) => p.featured),
    []
  );

  const handlePromptClick = useCallback(
    (prompt: CommunityPrompt) => {
      router.push(localizeHref(locale, `/swap-meet/${prompt.id}`));
    },
    [locale, router]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/50 via-transparent to-transparent dark:from-violet-900/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              <Users className="h-4 w-4" />
              Community Marketplace
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
              Swap Meet
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
              Discover, share, and trade prompts with the community. Find the perfect prompt or share your own creations.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-8 max-w-2xl"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <Input
                type="search"
                placeholder="Search community prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 w-full rounded-xl border-neutral-200 bg-white pl-12 pr-4 text-lg shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600 dark:text-neutral-400"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900 dark:text-white">2,847</span>
              Community Prompts
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900 dark:text-white">1,234</span>
              Contributors
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900 dark:text-white">45.2K</span>
              Total Copies
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Section */}
      {featuredPrompts.length > 0 && !searchQuery && selectedCategory === "all" && (
        <section className="border-b border-neutral-200 bg-neutral-50/50 py-12 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Editor&apos;s Picks
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPrompts.slice(0, 3).map((prompt, index) => (
                <CommunityPromptCard
                  key={prompt.id}
                  prompt={prompt}
                  index={index}
                  onClick={handlePromptClick}
                  featured
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filter & Sort Bar */}
      <section className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.slice(0, 5).map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="rounded-full"
                >
                  {cat.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-full"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700"
            >
              <div className="flex flex-wrap gap-2">
                {categories.slice(5).map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                    className="rounded-full"
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Results Header */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Showing <span className="font-medium text-neutral-900 dark:text-white">{filteredPrompts.length}</span> prompts
              {searchQuery && (
                <span>
                  {" "}for &quot;<span className="font-medium">{searchQuery}</span>&quot;
                </span>
              )}
            </p>
          </div>

          {/* Prompt Grid */}
          {filteredPrompts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPrompts.map((prompt, index) => (
                <CommunityPromptCard
                  key={prompt.id}
                  prompt={prompt}
                  index={index}
                  onClick={handlePromptClick}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Search className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                No prompts found
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Load More (placeholder for infinite scroll) */}
          {filteredPrompts.length > 0 && (
            <div className="mt-12 text-center">
              <Button variant="outline" size="lg">
                Load More Prompts
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
