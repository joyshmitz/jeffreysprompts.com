import type { Metadata } from "next";
import Link from "next/link";
import { HelpLayout, ArticleContent } from "@/components/help/HelpLayout";

export const metadata: Metadata = {
  title: "Saving to Your Basket - Help Center",
  description: "Learn how to save prompts to your basket for later use and bulk export.",
};

export default function SavingToBasketPage() {
  return (
    <HelpLayout
      title="Saving to Your Basket"
      category="prompts"
    >
      <ArticleContent>
        <p className="lead">
          The basket is your personal collection of prompts that you can access later or export together.
        </p>

        <h2>What is the basket?</h2>
        <p>
          Think of the basket like a shopping cart for prompts. As you browse, you can add prompts
          to your basket to:
        </p>
        <ul>
          <li>Save prompts you want to use later</li>
          <li>Collect related prompts for a project</li>
          <li>Export multiple prompts at once</li>
          <li>Share a curated set of prompts with your team</li>
        </ul>

        <h2>Adding prompts to your basket</h2>
        <p>
          There are several ways to add a prompt to your basket:
        </p>
        <ul>
          <li>Click the <strong>Save</strong> button on any prompt</li>
          <li>Press <kbd>s</kbd> when viewing a prompt</li>
          <li>Right-click and select &quot;Add to basket&quot;</li>
        </ul>
        <p>
          A badge on the basket icon shows how many prompts you&apos;ve saved.
        </p>

        <h2>Viewing your basket</h2>
        <p>
          Click the basket icon in the navigation bar to view your saved prompts. From here you can:
        </p>
        <ul>
          <li>Review all saved prompts</li>
          <li>Remove individual prompts</li>
          <li>Clear the entire basket</li>
          <li>Export all prompts</li>
        </ul>

        <h2>Basket persistence</h2>
        <p>
          Your basket is saved automatically:
        </p>
        <ul>
          <li><strong>Without an account</strong> — Basket is saved in your browser&apos;s local storage.
            It persists across sessions but is specific to that browser.</li>
          <li><strong>With an account</strong> — Basket syncs to your account and is available on
            any device where you sign in.</li>
        </ul>

        <h2>Creating collections</h2>
        <p>
          If you have an account, you can upgrade your basket to a named collection:
        </p>
        <ol>
          <li>Open your basket</li>
          <li>Click &quot;Save as collection&quot;</li>
          <li>Give it a name (e.g., &quot;Code Review Toolkit&quot;)</li>
          <li>Optionally add a description</li>
        </ol>
        <p>
          Collections are permanent and can be shared with others.
        </p>

        <h2>Next steps</h2>
        <ul>
          <li>
            <Link href="/help/prompts/exporting">Export your basket as Markdown or Skills</Link>
          </li>
          <li>
            <Link href="/help/getting-started/using-prompts">Learn how to use prompts effectively</Link>
          </li>
        </ul>
      </ArticleContent>
    </HelpLayout>
  );
}
