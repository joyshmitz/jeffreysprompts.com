import type { Metadata } from "next";
import { HelpLayout, ArticleCard } from "@/components/help/HelpLayout";
import { helpCategories } from "@/lib/help-categories";

export const metadata: Metadata = {
  title: "Prompts & Collections - Help Center",
  description: "Learn how to manage, organize, and export prompts on JeffreysPrompts.com.",
};

export default function PromptsPage() {
  const category = helpCategories.find((c) => c.slug === "prompts");

  return (
    <HelpLayout
      title="Prompts & Collections"
      description="Managing and organizing your prompts"
      category="prompts"
    >
      <div className="grid gap-4">
        {category?.articles.map((article) => (
          <ArticleCard
            key={article.slug}
            href={`/help/prompts/${article.slug}`}
            title={article.title}
            iconName="Sparkles"
          />
        ))}
      </div>
    </HelpLayout>
  );
}
