import type { Metadata } from "next";
import Link from "next/link";
import { HelpLayout, ArticleContent } from "@/components/help/HelpLayout";

export const metadata: Metadata = {
  title: "Browsing and Finding Prompts - Help Center",
  description: "Learn how to browse, search, and discover prompts on JeffreysPrompts.com.",
};

export default function BrowsingPromptsPage() {
  return (
    <HelpLayout
      title="Browsing and Finding Prompts"
      category="getting-started"
    >
      <ArticleContent>
        <p className="lead">
          JeffreysPrompts offers several ways to find the perfect prompt for your needs.
        </p>

        <h2>Categories</h2>
        <p>
          Prompts are organized into categories based on their purpose. Common categories include:
        </p>
        <ul>
          <li><strong>Code Review</strong> - Prompts for reviewing and improving code</li>
          <li><strong>Debugging</strong> - Prompts for finding and fixing bugs</li>
          <li><strong>Documentation</strong> - Prompts for writing docs and comments</li>
          <li><strong>Architecture</strong> - Prompts for system design and planning</li>
          <li><strong>Testing</strong> - Prompts for writing and improving tests</li>
          <li><strong>Refactoring</strong> - Prompts for improving code structure</li>
        </ul>
        <p>
          Click on any category to see all prompts in that category.
        </p>

        <h2>Search</h2>
        <p>
          Use the search bar to find prompts by keyword. The search looks at prompt titles,
          descriptions, and content. You can access search in several ways:
        </p>
        <ul>
          <li>Click the search icon in the navigation bar</li>
          <li>Press <kbd>Cmd+K</kbd> (Mac) or <kbd>Ctrl+K</kbd> (Windows/Linux)</li>
          <li>Use the search box on the homepage</li>
        </ul>

        <h2>Filtering</h2>
        <p>
          On the browse page, you can filter prompts by:
        </p>
        <ul>
          <li><strong>Category</strong> - Show only prompts in a specific category</li>
          <li><strong>Compatibility</strong> - Filter by AI model (Claude, GPT-4, etc.)</li>
          <li><strong>Complexity</strong> - Simple one-liners vs. detailed system prompts</li>
        </ul>

        <h2>Sorting</h2>
        <p>
          You can sort the prompt list by:
        </p>
        <ul>
          <li><strong>Popular</strong> - Most copied prompts first</li>
          <li><strong>Recent</strong> - Newest prompts first</li>
          <li><strong>Alphabetical</strong> - A to Z by title</li>
        </ul>

        <h2>Quick actions</h2>
        <p>
          When viewing a prompt, you can quickly:
        </p>
        <ul>
          <li><strong>Copy</strong> - Copy the prompt to your clipboard</li>
          <li><strong>Save</strong> - Add to your basket or collection (requires account)</li>
          <li><strong>Share</strong> - Get a link to share with others</li>
          <li><strong>View source</strong> - See the prompt on GitHub</li>
        </ul>

        <h2>Next steps</h2>
        <ul>
          <li>
            <Link href="/help/getting-started/using-prompts">Learn how to use prompts effectively</Link>
          </li>
          <li>
            <Link href="/help/prompts/saving-to-basket">Learn about saving prompts to your basket</Link>
          </li>
        </ul>
      </ArticleContent>
    </HelpLayout>
  );
}
