---
name: prompt-formatter
description: Convert raw prompt text into TypeScript registry entries for JeffreysPrompts.com
version: 1.0.0
author: Jeffrey Emanuel
category: automation
tags: ["prompts", "typescript", "formatting"]
---

# Prompt Formatter

Convert raw prompt text into properly formatted TypeScript registry entries for the JeffreysPrompts.com `registry.ts` file.

## Prompt Categories

Use exactly one of these categories:

- `ideation` - Brainstorming, idea generation, creativity
- `documentation` - READMEs, docs, comments, changelogs
- `automation` - Robot mode, CLI, agent optimization, scripting
- `refactoring` - Code improvement, cleanup, restructuring
- `testing` - Test generation, coverage, test-first development
- `debugging` - Bug finding, fixing, troubleshooting
- `workflow` - Process improvement, productivity, task management
- `communication` - Writing, feedback, code reviews

## Output Format

Generate a TypeScript object matching this interface:

```typescript
{
  id: "kebab-case-id",           // Lowercase, unique, stable forever
  title: "Human-Readable Title",
  description: "One-line description for cards and search (max 80 chars)",
  category: "ideation",           // One of the categories above
  tags: ["tag1", "tag2"],         // 2-5 relevant tags, lowercase
  author: "Jeffrey Emanuel",
  twitter: "@doodlestein",
  version: "1.0.0",
  featured: false,                // true for standout prompts
  difficulty: "intermediate",     // "beginner" | "intermediate" | "advanced"
  estimatedTokens: 500,           // Approximate input token count
  created: "2026-01-10",          // ISO 8601 date
  content: `The actual prompt content here...

Use template literals for multi-line content.
Preserve all formatting and line breaks.`,
  whenToUse: [
    "Scenario 1 when this prompt is useful",
    "Scenario 2",
  ],
  tips: [
    "Tip for getting best results",
    "Another tip",
  ],
}
```

## Guidelines

1. **ID Rules**: Use lowercase kebab-case (e.g., `idea-wizard`). Once published, IDs never change.

2. **Description**: Single sentence, max 80 characters. Focus on what the prompt does.

3. **Tags**: 2-5 tags, lowercase, reflecting key concepts. Reuse existing tags when possible:
   - `ultrathink`, `brainstorming`, `improvement`, `evaluation`
   - `documentation`, `readme`, `docs`
   - `cli`, `automation`, `agent`, `robot-mode`
   - `refactoring`, `cleanup`, `restructure`

4. **Content**: Preserve exact formatting. Use template literals for multi-line.

5. **When to Use**: 2-4 scenarios where this prompt shines.

6. **Tips**: 2-4 practical tips for best results.

## Example Conversion

**Raw input:**
```
Update the README and other documentation to reflect all of the recent changes to the project.

Frame all updates as if they were always present (i.e., don't say "we added X" or "X is now Y" — just describe the current state).

Make sure to add any new commands, options, or features that have been added.

Use ultrathink.
```

**Formatted output:**
```typescript
{
  id: "readme-reviser",
  title: "The README Reviser",
  description: "Update documentation for recent changes, framing them as how it always was",
  category: "documentation",
  tags: ["documentation", "readme", "docs", "ultrathink"],
  author: "Jeffrey Emanuel",
  twitter: "@doodlestein",
  version: "1.0.0",
  featured: true,
  difficulty: "beginner",
  estimatedTokens: 300,
  created: "2025-01-09",
  content: `Update the README and other documentation to reflect all of the recent changes to the project.

Frame all updates as if they were always present (i.e., don't say "we added X" or "X is now Y" — just describe the current state).

Make sure to add any new commands, options, or features that have been added.

Use ultrathink.`,
  whenToUse: [
    "After completing a feature or significant code change",
    "When documentation is out of sync with code",
    "Before releasing a new version",
    "When onboarding new contributors",
  ],
  tips: [
    "Run after every significant feature completion",
    "Check for removed features that need to be undocumented",
    "Ensure examples still work with current code",
  ],
}
```

---

*From [JeffreysPrompts.com](https://jeffreysprompts.com) - The prompt formatter skill*
