/**
 * Prompt Permalink Page
 *
 * Server-rendered page for individual prompts with:
 * - Full prompt content display
 * - Copy, install, download buttons
 * - Meta tags for social sharing
 * - Static generation via generateStaticParams
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prompts, getPrompt } from "@jeffreysprompts/core/prompts";
import { PromptContent } from "./PromptContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return prompts.map((prompt) => ({
    id: prompt.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const prompt = getPrompt(id);

  if (!prompt) {
    return {
      title: "Prompt Not Found | JeffreysPrompts",
    };
  }

  const description = prompt.description.slice(0, 160);
  const title = `${prompt.title} | JeffreysPrompts`;

  return {
    title,
    description,
    keywords: [prompt.category, ...prompt.tags].join(", "),
    authors: [{ name: prompt.author }],
    openGraph: {
      title: prompt.title,
      description,
      type: "article",
      url: `https://jeffreysprompts.com/prompts/${prompt.id}`,
      siteName: "JeffreysPrompts",
    },
    twitter: {
      card: "summary_large_image",
      title: prompt.title,
      description,
      creator: prompt.twitter ?? "@doodlestein",
    },
  };
}

export default async function PromptPage({ params }: PageProps) {
  const { id } = await params;
  const prompt = getPrompt(id);

  if (!prompt) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <PromptContent prompt={prompt} />
    </main>
  );
}
