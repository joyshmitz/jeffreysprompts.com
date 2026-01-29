import type { Metadata } from "next";
import { HelpLayout, ArticleCard } from "@/components/help/HelpLayout";
import { helpCategories } from "@/lib/help-categories";
import { BookOpen, Sparkles, Terminal, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Get help with JeffreysPrompts.com - Learn how to browse prompts, use the CLI, and get the most out of the platform.",
};

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Sparkles,
  Terminal,
};

export default function HelpPage() {
  return (
    <HelpLayout
      title="Help Center"
      description="Find answers to common questions and learn how to get the most out of JeffreysPrompts.com"
      showBreadcrumb={false}
    >
      {/* Quick search suggestion */}
      <div className="mb-8 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-border/60">
        <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          <Search className="h-5 w-5" />
          <span>
            Looking for something specific? Use the search bar in the sidebar or try{" "}
            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-mono">
              Cmd+K
            </kbd>{" "}
            to search the site.
          </span>
        </div>
      </div>

      {/* Categories grid */}
      <div className="space-y-10">
        {helpCategories.map((category) => {
          const Icon = iconMap[category.iconName] || BookOpen;
          return (
            <section key={category.slug}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {category.title}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {category.articles.map((article) => (
                  <ArticleCard
                    key={article.slug}
                    href={`/help/${category.slug}/${article.slug}`}
                    title={article.title}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Popular topics */}
      <section className="mt-12 pt-8 border-t border-border/60">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Popular Topics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard
            href="/help/getting-started/introduction"
            title="What is JeffreysPrompts?"
            description="Learn about our curated prompt library"
          />
          <ArticleCard
            href="/help/prompts/copying-prompts"
            title="How to copy prompts"
            description="One-click copying to your clipboard"
          />
          <ArticleCard
            href="/help/cli/installation"
            title="Install the CLI"
            description="Use prompts from your terminal"
          />
        </div>
      </section>
    </HelpLayout>
  );
}
