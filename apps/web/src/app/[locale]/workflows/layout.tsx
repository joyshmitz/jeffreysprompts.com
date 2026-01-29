import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workflow Builder | Jeffrey's Prompts",
  description: "Chain prompts together into powerful multi-step workflows. Build custom workflows or use curated templates. Export as markdown for any AI assistant.",
  openGraph: {
    title: "Workflow Builder",
    description: "Chain prompts together into powerful multi-step workflows. Export as markdown for any AI assistant.",
    type: "website",
    url: "https://jeffreysprompts.com/workflows",
    siteName: "Jeffrey's Prompts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workflow Builder | Jeffrey's Prompts",
    description: "Chain prompts together into powerful multi-step workflows.",
    creator: "@doodlestein",
  },
};

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
