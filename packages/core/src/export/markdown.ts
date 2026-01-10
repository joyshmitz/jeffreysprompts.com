// packages/core/src/export/markdown.ts
// Generate standalone markdown files from prompts

import type { Prompt } from "../prompts/types";

/**
 * Generate standalone markdown for a single prompt
 */
export function generatePromptMarkdown(prompt: Prompt): string {
  const sections: string[] = [
    `# ${prompt.title}`,
    "",
    `> ${prompt.description}`,
    "",
    `**Category:** ${prompt.category}`,
    `**Tags:** ${prompt.tags.join(", ")}`,
    `**Author:** ${prompt.author}${prompt.twitter ? ` (${prompt.twitter})` : ""}`,
    `**Version:** ${prompt.version}`,
    "",
    "## Prompt",
    "",
    "```",
    prompt.content,
    "```",
  ];

  if (prompt.whenToUse?.length) {
    sections.push("", "## When to Use", "");
    for (const item of prompt.whenToUse) {
      sections.push(`- ${item}`);
    }
  }

  if (prompt.tips?.length) {
    sections.push("", "## Tips", "");
    for (const tip of prompt.tips) {
      sections.push(`- ${tip}`);
    }
  }

  if (prompt.examples?.length) {
    sections.push("", "## Examples", "");
    for (const example of prompt.examples) {
      sections.push(`- ${example}`);
    }
  }

  sections.push(
    "",
    "---",
    "",
    `*From [JeffreysPrompts.com](https://jeffreysprompts.com/prompts/${prompt.id})*`
  );

  return sections.join("\n") + "\n";
}

/**
 * Generate markdown bundle for multiple prompts
 */
export function generateBundleMarkdown(prompts: Prompt[], title: string): string {
  const sections: string[] = [
    `# ${title}`,
    "",
    `A collection of ${prompts.length} prompts from JeffreysPrompts.com`,
    "",
    "## Table of Contents",
    "",
  ];

  for (const prompt of prompts) {
    sections.push(`- [${prompt.title}](#${prompt.id})`);
  }

  sections.push("");

  for (const prompt of prompts) {
    sections.push(
      "---",
      "",
      `<a id="${prompt.id}"></a>`,
      "",
      generatePromptMarkdown(prompt)
    );
  }

  return sections.join("\n");
}
