import type { Metadata } from "next";
import Link from "next/link";
import { HelpLayout, ArticleContent } from "@/components/help/HelpLayout";

export const metadata: Metadata = {
  title: "Using Prompts with AI Models - Help Center",
  description: "Learn how to effectively use JeffreysPrompts with Claude, ChatGPT, and other AI coding assistants.",
};

export default function UsingPromptsPage() {
  return (
    <HelpLayout
      title="Using Prompts with AI Models"
      category="getting-started"
    >
      <ArticleContent>
        <p className="lead">
          Once you&apos;ve found a prompt, here&apos;s how to use it effectively with your AI coding
          assistant.
        </p>

        <h2>Basic usage</h2>
        <p>
          The simplest way to use a prompt:
        </p>
        <ol>
          <li>Click the <strong>Copy</strong> button on any prompt</li>
          <li>Open your AI assistant (Claude, ChatGPT, Cursor, etc.)</li>
          <li>Paste the prompt</li>
          <li>Add any context specific to your situation</li>
          <li>Send the message</li>
        </ol>

        <h2>Filling in variables</h2>
        <p>
          Many prompts contain variables marked with brackets like <code>[language]</code> or{" "}
          <code>[file_path]</code>. Replace these with your specific values before sending.
        </p>
        <p>
          For example, if a prompt says:
        </p>
        <pre>
          Review this [language] code for potential bugs:
        </pre>
        <p>
          You would change it to:
        </p>
        <pre>
          Review this TypeScript code for potential bugs:
        </pre>

        <h2>Adding context</h2>
        <p>
          AI assistants work best with context. After the prompt, consider adding:
        </p>
        <ul>
          <li>The relevant code or file contents</li>
          <li>Error messages you&apos;re seeing</li>
          <li>What you&apos;ve already tried</li>
          <li>Constraints or requirements</li>
          <li>Your tech stack or framework</li>
        </ul>

        <h2>Using as system prompts</h2>
        <p>
          Some prompts work best as system prompts or custom instructions. These set the context
          for an entire conversation rather than a single message. To use a prompt this way:
        </p>
        <ul>
          <li><strong>Claude</strong> - Use Projects or paste at the start of a conversation</li>
          <li><strong>ChatGPT</strong> - Add to Custom Instructions in settings</li>
          <li><strong>Cursor</strong> - Add to your Cursor rules file</li>
        </ul>

        <h2>Combining prompts</h2>
        <p>
          You can combine multiple prompts for complex tasks. For example:
        </p>
        <ul>
          <li>Use a code review prompt first</li>
          <li>Then follow up with a refactoring prompt</li>
          <li>Finally use a documentation prompt</li>
        </ul>
        <p>
          The{" "}
          <Link href="/help/prompts/saving-to-basket">basket feature</Link> makes it easy to collect
          and export multiple prompts together.
        </p>

        <h2>Tips for best results</h2>
        <ul>
          <li>
            <strong>Be specific</strong> - Add details about your situation even if the prompt is
            general
          </li>
          <li>
            <strong>Iterate</strong> - If the first response isn&apos;t quite right, refine your
            request
          </li>
          <li>
            <strong>Provide examples</strong> - Show the AI what you&apos;re looking for when
            possible
          </li>
          <li>
            <strong>Check the output</strong> - Always review AI-generated code before using it
          </li>
        </ul>

        <h2>Model-specific notes</h2>
        <h3>Claude</h3>
        <p>
          Claude works well with detailed, structured prompts. It respects formatting and follows
          multi-step instructions reliably.
        </p>

        <h3>ChatGPT / GPT-4</h3>
        <p>
          GPT-4 handles most prompts well. For complex prompts, you may want to break them into
          smaller steps.
        </p>

        <h3>Cursor</h3>
        <p>
          When using prompts in Cursor, you can reference specific files using the @ symbol. Many
          prompts work well as Cursor rules for consistent behavior.
        </p>

        <h2>Next steps</h2>
        <ul>
          <li>
            <Link href="/help/prompts/copying-prompts">Learn about advanced copying options</Link>
          </li>
          <li>
            <Link href="/help/cli/basic-usage">Use prompts from the command line</Link>
          </li>
        </ul>
      </ArticleContent>
    </HelpLayout>
  );
}
