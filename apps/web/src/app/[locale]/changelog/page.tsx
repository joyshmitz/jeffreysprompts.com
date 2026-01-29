import type { Metadata } from "next";
import { Sparkles, Zap, Bug, Calendar, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Changelog | JeffreysPrompts",
  description:
    "Stay up to date with the latest features, improvements, and fixes to JeffreysPrompts.",
};

// Changelog entries - TypeScript-native format
type ChangeType = "new" | "improved" | "fixed";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description?: string;
  changes: {
    type: ChangeType;
    text: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "0.9.0",
    date: "January 2026",
    title: "Admin Dashboard & Enhanced CLI",
    description: "Platform management tools and CLI improvements.",
    changes: [
      { type: "new", text: "Admin dashboard with user management and moderation queue" },
      { type: "new", text: "Admin API endpoints for stats, users, and content reports" },
      { type: "new", text: "Settings page for platform configuration" },
      { type: "improved", text: "CLI suggest command now validates --limit flag input" },
      { type: "improved", text: "Better error handling for hooks with undefined values" },
      { type: "fixed", text: "OG image label escaping for apostrophes" },
    ],
  },
  {
    version: "0.8.0",
    date: "January 2026",
    title: "Pricing & Legal Pages",
    description: "Public pricing page and legal documentation.",
    changes: [
      { type: "new", text: "Pricing page with Free and Pro tier comparison" },
      { type: "new", text: "Terms of Service page" },
      { type: "new", text: "Privacy Policy page" },
      { type: "new", text: "Community Guidelines page" },
      { type: "improved", text: "Trust signals and FAQ section on pricing" },
    ],
  },
  {
    version: "0.7.0",
    date: "January 2026",
    title: "Help Center & Documentation",
    description: "Comprehensive help system with searchable documentation.",
    changes: [
      { type: "new", text: "Help center with categorized documentation" },
      { type: "new", text: "CLI installation and usage guides" },
      { type: "new", text: "Getting started tutorials" },
      { type: "new", text: "Prompt usage and exporting guides" },
      { type: "improved", text: "Navigation with breadcrumbs for help pages" },
    ],
  },
  {
    version: "0.6.0",
    date: "January 2026",
    title: "Bundles & Workflows",
    description: "Curated prompt collections and multi-step workflows.",
    changes: [
      { type: "new", text: "Prompt bundles for common use cases" },
      { type: "new", text: "Workflow system for sequenced prompts" },
      { type: "new", text: "Bundle and workflow detail pages" },
      { type: "improved", text: "Enhanced prompt categorization" },
    ],
  },
  {
    version: "0.5.0",
    date: "January 2026",
    title: "Search & Discovery",
    description: "BM25 search engine and improved filtering.",
    changes: [
      { type: "new", text: "Full-text search with BM25 algorithm" },
      { type: "new", text: "Spotlight search (Cmd+K)" },
      { type: "new", text: "Category and tag filters" },
      { type: "improved", text: "Search result relevance scoring" },
      { type: "fixed", text: "Filter state persistence across navigation" },
    ],
  },
  {
    version: "0.4.0",
    date: "January 2026",
    title: "CLI Tool Launch",
    description: "Agent-optimized command-line interface.",
    changes: [
      { type: "new", text: "jfp CLI tool with fuzzy search" },
      { type: "new", text: "JSON output mode for agent integration" },
      { type: "new", text: "Skill installation to Claude Code" },
      { type: "new", text: "Interactive mode with fzf-style picker" },
      { type: "improved", text: "Token-efficient output format" },
    ],
  },
  {
    version: "0.3.0",
    date: "January 2026",
    title: "Basket & Export System",
    description: "Collect and export multiple prompts.",
    changes: [
      { type: "new", text: "Basket sidebar for collecting prompts" },
      { type: "new", text: "Export as SKILL.md for Claude Code" },
      { type: "new", text: "Markdown export option" },
      { type: "new", text: "Bulk download as ZIP" },
      { type: "improved", text: "One-click copy functionality" },
    ],
  },
  {
    version: "0.2.0",
    date: "January 2026",
    title: "TypeScript-Native Prompts",
    description: "Moved from markdown to TypeScript for type safety.",
    changes: [
      { type: "new", text: "TypeScript-native prompt registry" },
      { type: "new", text: "Zod schema validation" },
      { type: "improved", text: "Build-time type checking for prompts" },
      { type: "improved", text: "IDE autocomplete for categories and tags" },
      { type: "fixed", text: "Eliminated markdown parsing edge cases" },
    ],
  },
  {
    version: "0.1.0",
    date: "January 2026",
    title: "Initial Release",
    description: "JeffreysPrompts.com launches with curated prompt library.",
    changes: [
      { type: "new", text: "Curated prompt library with 10+ battle-tested prompts" },
      { type: "new", text: "Responsive web interface with dark mode" },
      { type: "new", text: "Prompt cards with metadata and descriptions" },
      { type: "new", text: "Making-of page with development transcript" },
    ],
  },
];

const changeTypeConfig = {
  new: {
    label: "New",
    icon: Sparkles,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  improved: {
    label: "Improved",
    icon: Zap,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  },
  fixed: {
    label: "Fixed",
    icon: Bug,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/60 via-white to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <div className="border-b border-neutral-200/70 dark:border-neutral-800/70">
        <div className="container mx-auto px-4 py-14">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              Product Updates
            </Badge>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white sm:text-5xl">
              Changelog
            </h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
              Stay up to date with the latest features, improvements, and fixes.
              We ship frequently to make JeffreysPrompts better for you.
            </p>
          </div>
        </div>
      </div>

      {/* Changelog entries */}
      <div className="container mx-auto px-4 py-12">
        <div className="relative mx-auto max-w-3xl">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-violet-300 via-violet-200 to-transparent dark:from-violet-600 dark:via-violet-800 md:left-8 md:block" />

          {/* Entries */}
          <div className="space-y-12">
            {changelog.map((entry, idx) => (
              <ChangelogEntryCard key={entry.version} entry={entry} isLatest={idx === 0} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-neutral-200/70 dark:border-neutral-800/70">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Have a feature request?
            </h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              We&apos;d love to hear your ideas for making JeffreysPrompts better.
            </p>
            <a
              href="https://github.com/Dicklesworthstone/jeffreysprompts.com/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Open an issue on GitHub
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangelogEntryCard({
  entry,
  isLatest,
}: {
  entry: ChangelogEntry;
  isLatest: boolean;
}) {
  return (
    <div className="relative md:pl-20">
      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-2 hidden h-4 w-4 rounded-full border-2 md:left-6 md:block ${
          isLatest
            ? "border-violet-500 bg-violet-500"
            : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900"
        }`}
      />

      <Card className={isLatest ? "border-violet-200 dark:border-violet-500/30" : ""}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge
              variant={isLatest ? "default" : "secondary"}
              className={isLatest ? "" : ""}
            >
              v{entry.version}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Calendar className="h-4 w-4" />
              {entry.date}
            </div>
            {isLatest && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                Latest
              </Badge>
            )}
          </div>

          {/* Title & description */}
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {entry.title}
          </h2>
          {entry.description && (
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {entry.description}
            </p>
          )}

          {/* Changes list */}
          <ul className="mt-4 space-y-2">
            {entry.changes.map((change, idx) => {
              const config = changeTypeConfig[change.type];
              const Icon = config.icon;
              return (
                <li key={idx} className="flex items-start gap-3">
                  <Badge variant="secondary" className={`mt-0.5 ${config.className}`}>
                    <Icon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {change.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
