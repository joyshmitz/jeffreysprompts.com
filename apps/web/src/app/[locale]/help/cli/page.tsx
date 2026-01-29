import type { Metadata } from "next";
import { HelpLayout, ArticleCard } from "@/components/help/HelpLayout";
import { helpCategories } from "@/lib/help-categories";

export const metadata: Metadata = {
  title: "CLI Tool - Help Center",
  description:
    "Learn how to use the jfp command-line interface for accessing prompts from your terminal.",
};

export default function CLIPage() {
  const category = helpCategories.find((c) => c.slug === "cli");

  return (
    <HelpLayout
      title="CLI Tool"
      description="Using the jfp command-line interface"
      category="cli"
    >
      <div className="grid gap-4">
        {category?.articles.map((article) => (
          <ArticleCard
            key={article.slug}
            href={`/help/cli/${article.slug}`}
            title={article.title}
            iconName="Terminal"
          />
        ))}
      </div>

      <div className="mt-8 p-5 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
          Why use the CLI?
        </h3>
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
          <li>Access prompts without leaving your terminal</li>
          <li>Integrate prompts into scripts and automation</li>
          <li>Fuzzy search with fzf-style interface</li>
          <li>JSON output for programmatic use</li>
          <li>Works great with AI coding agents</li>
        </ul>
      </div>
    </HelpLayout>
  );
}
