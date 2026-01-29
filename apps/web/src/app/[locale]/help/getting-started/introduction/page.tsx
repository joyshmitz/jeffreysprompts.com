import type { Metadata } from "next";
import Link from "next/link";
import { HelpLayout, ArticleContent } from "@/components/help/HelpLayout";

export const metadata: Metadata = {
  title: "Introduction to JeffreysPrompts - Help Center",
  description: "Learn what JeffreysPrompts.com is and how it can help you work more effectively with AI coding agents.",
};

export default function IntroductionPage() {
  return (
    <HelpLayout
      title="Introduction to JeffreysPrompts"
      category="getting-started"
    >
      <ArticleContent>
        <p className="lead">
          JeffreysPrompts.com is a curated library of battle-tested prompts designed to help
          developers work more effectively with AI coding agents like Claude, ChatGPT, and Cursor.
        </p>

        <h2>What is JeffreysPrompts?</h2>
        <p>
          AI coding assistants are powerful tools, but getting the best results often requires
          careful prompt engineering. JeffreysPrompts provides a collection of prompts that have
          been refined through real-world use to produce consistent, high-quality results.
        </p>
        <p>
          Our prompts cover a wide range of use cases, from code review and debugging to
          documentation and architecture planning. Each prompt is designed to be:
        </p>
        <ul>
          <li><strong>Battle-tested</strong> - Used in real projects and refined over time</li>
          <li><strong>Well-documented</strong> - Clear descriptions of when and how to use them</li>
          <li><strong>Model-agnostic</strong> - Work with Claude, GPT-4, and other major models</li>
          <li><strong>Open source</strong> - Free to use, modify, and share</li>
        </ul>

        <h2>Who is this for?</h2>
        <p>
          JeffreysPrompts is designed for developers who use AI coding assistants and want to:
        </p>
        <ul>
          <li>Get better results from AI coding tools</li>
          <li>Save time by using proven prompt patterns</li>
          <li>Learn prompt engineering techniques through examples</li>
          <li>Build consistent workflows with AI assistance</li>
        </ul>

        <h2>How to get started</h2>
        <p>
          Getting started with JeffreysPrompts is easy:
        </p>
        <ol>
          <li>
            <strong>Browse the library</strong> - Explore our{" "}
            <Link href="/prompts">prompt categories</Link> to find prompts for your use case
          </li>
          <li>
            <strong>Copy and use</strong> - Click the copy button on any prompt to copy it to your
            clipboard, then paste it into your AI assistant
          </li>
          <li>
            <strong>Customize as needed</strong> - Many prompts have variables you can fill in to
            match your specific situation
          </li>
        </ol>

        <h2>Optional features</h2>
        <p>
          While the core library is free and requires no account, you can optionally:
        </p>
        <ul>
          <li>
            <strong>Create an account</strong> - Save your favorite prompts and create custom
            collections
          </li>
          <li>
            <strong>Use the CLI</strong> - Access prompts directly from your terminal with the{" "}
            <code>jfp</code> command
          </li>
          <li>
            <strong>Export to tools</strong> - Export prompts as Claude Skills, custom instructions,
            or markdown files
          </li>
        </ul>

        <h2>Next steps</h2>
        <p>
          Ready to explore? Here are some good next steps:
        </p>
        <ul>
          <li>
            <Link href="/help/getting-started/browsing-prompts">Learn how to browse and search prompts</Link>
          </li>
          <li>
            <Link href="/help/getting-started/using-prompts">Learn how to use prompts effectively</Link>
          </li>
          <li>
            <Link href="/prompts">Browse the prompt library</Link>
          </li>
        </ul>
      </ArticleContent>
    </HelpLayout>
  );
}
