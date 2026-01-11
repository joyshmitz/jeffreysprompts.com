import type { Metadata } from "next";
import Link from "next/link";
import { HelpLayout, ArticleContent } from "@/components/help/HelpLayout";

export const metadata: Metadata = {
  title: "Copying Prompts - Help Center",
  description: "Learn how to copy prompts to your clipboard and use them with AI coding assistants.",
};

export default function CopyingPromptsPage() {
  return (
    <HelpLayout
      title="Copying Prompts"
      category="prompts"
    >
      <ArticleContent>
        <p className="lead">
          JeffreysPrompts makes it easy to copy prompts to your clipboard with a single click.
        </p>

        <h2>One-click copying</h2>
        <p>
          Every prompt has a <strong>Copy</strong> button in the top-right corner. Click it to copy
          the entire prompt to your clipboard, ready to paste into your AI assistant.
        </p>
        <p>
          You&apos;ll see a brief confirmation when the copy succeeds. If copying fails (usually due
          to browser permissions), you&apos;ll see an error message with instructions.
        </p>

        <h2>Keyboard shortcuts</h2>
        <p>
          When viewing a prompt, you can use these keyboard shortcuts:
        </p>
        <ul>
          <li><kbd>c</kbd> — Copy the prompt to clipboard</li>
          <li><kbd>s</kbd> — Save to your basket (requires account)</li>
          <li><kbd>Esc</kbd> — Close the prompt detail view</li>
        </ul>

        <h2>Copy with variables highlighted</h2>
        <p>
          Some prompts contain variables like <code>[language]</code> or <code>[file_path]</code>.
          When you copy a prompt:
        </p>
        <ul>
          <li>Variables are preserved exactly as written</li>
          <li>Replace them with your specific values before sending to your AI</li>
          <li>The variable format is designed to be easy to find and replace</li>
        </ul>

        <h2>Copy as different formats</h2>
        <p>
          Click the dropdown arrow next to the Copy button to see additional options:
        </p>
        <ul>
          <li><strong>Copy as plain text</strong> — The default, works everywhere</li>
          <li><strong>Copy as Markdown</strong> — Includes title and metadata</li>
          <li><strong>Copy with context</strong> — Includes usage tips and examples</li>
        </ul>

        <h2>Browser permissions</h2>
        <p>
          Modern browsers require permission to write to the clipboard. If prompted, allow clipboard
          access for the best experience. If you denied permission previously:
        </p>
        <ol>
          <li>Click the lock icon in your browser&apos;s address bar</li>
          <li>Find &quot;Clipboard&quot; in the permissions list</li>
          <li>Change it to &quot;Allow&quot;</li>
          <li>Refresh the page</li>
        </ol>

        <h2>Next steps</h2>
        <ul>
          <li>
            <Link href="/help/prompts/saving-to-basket">Save prompts to your basket for later</Link>
          </li>
          <li>
            <Link href="/help/prompts/exporting">Export prompts as Markdown or Skills</Link>
          </li>
        </ul>
      </ArticleContent>
    </HelpLayout>
  );
}
