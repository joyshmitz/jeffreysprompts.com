import type { Metadata } from "next";
import { bundles } from "@jeffreysprompts/core/prompts/bundles";
import { BundleCard } from "@/components/BundleCard";

export const metadata: Metadata = {
  title: "Prompt Bundles | Jeffrey's Prompts",
  description: "Curated collections of related prompts for common workflows. Install all prompts in a bundle with a single command.",
  openGraph: {
    title: "Prompt Bundles",
    description: "Curated collections of related prompts. Install all prompts in a bundle with a single command.",
    type: "website",
    url: "https://jeffreysprompts.com/bundles",
    siteName: "Jeffrey's Prompts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Bundles | Jeffrey's Prompts",
    description: "Curated collections of related prompts for common workflows.",
    creator: "@doodlestein",
  },
};

export default function BundlesPage() {
  // Sort bundles: featured first, then by title
  const sortedBundles = [...bundles].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <div className="border-b dark:border-neutral-800">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            Prompt Bundles
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl">
            Curated collections of related prompts. Install all prompts in a bundle
            with a single command.
          </p>
        </div>
      </div>

      {/* Bundle Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBundles.map((bundle, index) => (
            <BundleCard key={bundle.id} bundle={bundle} index={index} />
          ))}
        </div>

        {sortedBundles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">
              No bundles available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
