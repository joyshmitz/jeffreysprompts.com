---
name: skill-maker
description: Convert prompts into Claude Code SKILL.md files with proper frontmatter and structure
version: 1.0.0
author: Jeffrey Emanuel
category: automation
tags: ["skills", "claude-code", "export", "meta"]
---

# Skill Maker

Convert prompts from JeffreysPrompts.com into properly formatted Claude Code SKILL.md files. This is a meta-skill: a skill that makes other skills.

## SKILL.md Format

Every Claude Code skill follows this structure:

```markdown
---
name: skill-name-kebab-case
description: What this skill does and when to invoke it
version: 1.0.0
author: Author Name
category: category-name
tags: ["tag1", "tag2"]
source: https://jeffreysprompts.com/prompts/skill-id
x_jfp_generated: true
---

# Skill Title

[The main prompt content here]

## When to Use

- Scenario 1
- Scenario 2

## Tips

- Tip 1
- Tip 2

---

*From [JeffreysPrompts.com](https://jeffreysprompts.com/prompts/skill-id)*
```

## Conversion Steps

1. **Create frontmatter** from prompt metadata:
   - `name`: Use the prompt's `id`
   - `description`: Use the prompt's `description`
   - `version`: Use the prompt's `version`
   - `author`: Use the prompt's `author`
   - `category`: Use the prompt's `category`
   - `tags`: Quote each tag in the array
   - `source`: Generate URL from id
   - `x_jfp_generated`: Always `true` (marks it as auto-generated)

2. **Create title** as H1 heading using the prompt's `title`

3. **Insert content** as the main body (preserve formatting)

4. **Add "When to Use"** section if `whenToUse` array exists

5. **Add "Tips"** section if `tips` array exists

6. **Add attribution footer** linking back to source

## Example Conversion

**Input prompt object:**
```typescript
{
  id: "idea-wizard",
  title: "The Idea Wizard",
  description: "Generate 30 ideas, evaluate each, distill to best 5",
  category: "ideation",
  tags: ["brainstorming", "improvement", "ultrathink"],
  author: "Jeffrey Emanuel",
  version: "1.0.0",
  content: `Come up with your very best ideas...`,
  whenToUse: ["When starting a new feature", "When stuck"],
  tips: ["Run at session start", "Combine with ultrathink"],
}
```

**Output SKILL.md:**
```markdown
---
name: idea-wizard
description: Generate 30 ideas, evaluate each, distill to best 5
version: 1.0.0
author: Jeffrey Emanuel
category: ideation
tags: ["brainstorming", "improvement", "ultrathink"]
source: https://jeffreysprompts.com/prompts/idea-wizard
x_jfp_generated: true
---

# The Idea Wizard

Come up with your very best ideas...

## When to Use

- When starting a new feature
- When stuck

## Tips

- Run at session start
- Combine with ultrathink

---

*From [JeffreysPrompts.com](https://jeffreysprompts.com/prompts/idea-wizard)*
```

## Bundle Skills

To create a bundle skill (multiple prompts in one):

1. Use the bundle `id` as the skill name
2. Use bundle `description` for skill description
3. Include all prompts separated by horizontal rules (`---`)
4. Add a "Prompts Included" section listing all prompts

## Usage Notes

- The `x_jfp_generated: true` marker identifies auto-generated skills
- Users can edit generated skills, but updates will only overwrite if unchanged
- Skills install to `~/.config/claude/skills/<skill-id>/SKILL.md` (personal) or `.claude/skills/<skill-id>/SKILL.md` (project)
- Claude Code auto-discovers skills and can invoke them by name

---

*From [JeffreysPrompts.com](https://jeffreysprompts.com) - The meta-skill that makes skills*
