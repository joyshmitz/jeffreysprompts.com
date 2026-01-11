import type { Metadata } from "next";
import { HelpLayout, ArticleCard } from "@/components/help/HelpLayout";
import { helpCategories } from "@/lib/help-categories";

export const metadata: Metadata = {
  title: "Getting Started - Help Center",
  description: "Learn the basics of JeffreysPrompts.com and get up and running quickly.",
};

export default function GettingStartedPage() {
  const category = helpCategories.find((c) => c.slug === "getting-started");

  return (
    <HelpLayout
      title="Getting Started"
      description="Learn the basics and get up and running quickly"
      category="getting-started"
    >
      <div className="grid gap-4">
        {category?.articles.map((article) => (
          <ArticleCard
            key={article.slug}
            href={`/help/getting-started/${article.slug}`}
            title={article.title}
            iconName="BookOpen"
          />
        ))}
      </div>
    </HelpLayout>
  );
}
