import { describe, it, expect } from "bun:test";
import {
  generateSkillMd,
  generateInstallScript,
  generateInstallOneLiner,
  generateSkillEntries,
  computeSkillHash,
  createManifestEntry,
} from "../../src/export/skills";
import type { Prompt } from "../../src/prompts/types";

// Test prompt
const testPrompt: Prompt = {
  id: "test-prompt",
  title: "Test Prompt",
  description: "A test prompt for unit testing",
  category: "testing",
  tags: ["test", "unit"],
  author: "Test Author",
  twitter: "@test",
  version: "1.0.0",
  created: "2025-01-01",
  content: "This is the prompt content.\n\nIt has multiple lines.",
  whenToUse: ["When testing", "When verifying"],
  tips: ["Tip 1", "Tip 2"],
};

const promptWithSpecialChars: Prompt = {
  id: "special-chars",
  title: "Special: Characters & More",
  description: 'Description with "quotes" and special: chars',
  category: "testing",
  tags: ["special", "yaml-escape"],
  author: "Author",
  twitter: "@author",
  version: "1.0.0",
  created: "2025-01-01",
  content: "Content with:\n- colons\n- newlines",
};

describe("generateSkillMd", () => {
  it("should generate valid YAML frontmatter", () => {
    const result = generateSkillMd(testPrompt);
    expect(result.startsWith("---\n")).toBe(true);
    expect(result).toContain("name: test-prompt");
    expect(result).toContain("version: 1.0.0");
    expect(result).toContain("x_jfp_generated: true");
  });

  it("should include prompt title as h1", () => {
    const result = generateSkillMd(testPrompt);
    expect(result).toContain("# Test Prompt");
  });

  it("should include prompt content", () => {
    const result = generateSkillMd(testPrompt);
    expect(result).toContain("This is the prompt content.");
    expect(result).toContain("It has multiple lines.");
  });

  it("should include When to Use section", () => {
    const result = generateSkillMd(testPrompt);
    expect(result).toContain("## When to Use");
    expect(result).toContain("- When testing");
    expect(result).toContain("- When verifying");
  });

  it("should include Tips section", () => {
    const result = generateSkillMd(testPrompt);
    expect(result).toContain("## Tips");
    expect(result).toContain("- Tip 1");
    expect(result).toContain("- Tip 2");
  });

  it("should include attribution footer", () => {
    const result = generateSkillMd(testPrompt);
    expect(result).toContain("JeffreysPrompts.com");
  });

  it("should include source URL", () => {
    const result = generateSkillMd(testPrompt);
    expect(result).toContain("source: https://jeffreysprompts.com/prompts/test-prompt");
  });

  it("should escape YAML special characters", () => {
    const result = generateSkillMd(promptWithSpecialChars);
    // Description with quotes should be escaped
    expect(result).toContain('description: "Description with');
    // Should be valid YAML (no parsing errors would occur)
    expect(result).toContain("---");
  });

  it("should handle prompts without optional fields", () => {
    const minimalPrompt: Prompt = {
      id: "minimal",
      title: "Minimal Prompt",
      description: "A minimal prompt",
      category: "testing",
      tags: [],
      author: "Author",
      twitter: "@a",
      version: "1.0.0",
      created: "2025-01-01",
      content: "Content",
    };
    const result = generateSkillMd(minimalPrompt);
    // Should not contain sections for missing optional fields
    expect(result).not.toContain("## When to Use");
    expect(result).not.toContain("## Tips");
    expect(result).not.toContain("## Examples");
  });
});

describe("generateInstallScript", () => {
  it("should generate valid bash script", () => {
    const result = generateInstallScript([testPrompt]);
    expect(result.startsWith("#!/usr/bin/env bash")).toBe(true);
    expect(result).toContain("set -e");
  });

  it("should create directory for each prompt", () => {
    const result = generateInstallScript([testPrompt]);
    expect(result).toContain("mkdir -p");
    expect(result).toContain("test-prompt");
  });

  it("should use HEREDOC for skill content", () => {
    const result = generateInstallScript([testPrompt]);
    expect(result).toContain("cat >");
    expect(result).toContain("SKILL.md");
    expect(result).toContain("<< '");
  });

  it("should use custom target directory when provided", () => {
    const result = generateInstallScript([testPrompt], ".claude/skills");
    expect(result).toContain('SKILLS_DIR=".claude/skills"');
  });

  it("should default to $HOME/.config/claude/skills", () => {
    const result = generateInstallScript([testPrompt]);
    expect(result).toContain("$HOME/.config/claude/skills");
  });

  it("should handle multiple prompts", () => {
    const prompts = [testPrompt, { ...testPrompt, id: "test-prompt-2", title: "Test 2" }];
    const result = generateInstallScript(prompts);
    expect(result).toContain("test-prompt");
    expect(result).toContain("test-prompt-2");
    expect(result).toContain("Installed 2 skill(s)");
  });

  it("should use unique HEREDOC delimiters", () => {
    // If content contains JFP_SKILL, should use JFP_SKILL_1
    const promptWithDelimiter: Prompt = {
      ...testPrompt,
      content: "Content mentioning JFP_SKILL in text",
    };
    const result = generateInstallScript([promptWithDelimiter]);
    // Should find a unique delimiter
    expect(result).toContain("JFP_SKILL");
  });
});

describe("generateInstallOneLiner", () => {
  it("should generate valid one-liner", () => {
    const result = generateInstallOneLiner(testPrompt);
    expect(result).toContain("mkdir -p");
    expect(result).toContain("test-prompt");
    expect(result).toContain("cat >");
    expect(result).toContain("SKILL.md");
    expect(result).toContain("<<");
  });

  it("should default to home config directory", () => {
    const result = generateInstallOneLiner(testPrompt);
    expect(result).toContain("$HOME/.config/claude/skills");
  });

  it("should use project directory when specified", () => {
    const result = generateInstallOneLiner(testPrompt, { project: true });
    expect(result).toContain(".claude/skills");
    expect(result).not.toContain("$HOME");
  });
});

describe("generateSkillEntries", () => {
  it("should return array of path/content objects", () => {
    const entries = generateSkillEntries([testPrompt]);
    expect(entries.length).toBe(1);
    expect(entries[0].path).toBe("test-prompt/SKILL.md");
    expect(entries[0].content).toBeTruthy();
  });

  it("should generate valid SKILL.md content", () => {
    const entries = generateSkillEntries([testPrompt]);
    expect(entries[0].content).toContain("---");
    expect(entries[0].content).toContain("# Test Prompt");
  });
});

describe("computeSkillHash", () => {
  it("should return SHA256 hash", () => {
    const hash = computeSkillHash("test content");
    // SHA256 produces 64 hex characters
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
  });

  it("should be deterministic", () => {
    const hash1 = computeSkillHash("same content");
    const hash2 = computeSkillHash("same content");
    expect(hash1).toBe(hash2);
  });

  it("should differ for different content", () => {
    const hash1 = computeSkillHash("content 1");
    const hash2 = computeSkillHash("content 2");
    expect(hash1).not.toBe(hash2);
  });
});

describe("createManifestEntry", () => {
  it("should create valid manifest entry", () => {
    const entry = createManifestEntry(testPrompt);
    expect(entry.id).toBe("test-prompt");
    expect(entry.kind).toBe("prompt");
    expect(entry.version).toBe("1.0.0");
    expect(entry.hash).toHaveLength(64);
  });

  it("should use created date as updatedAt when not provided", () => {
    const entry = createManifestEntry(testPrompt);
    expect(entry.updatedAt).toBe("2025-01-01");
  });

  it("should use updatedAt when provided", () => {
    const promptWithUpdate: Prompt = {
      ...testPrompt,
      updatedAt: "2025-06-15",
    };
    const entry = createManifestEntry(promptWithUpdate);
    expect(entry.updatedAt).toBe("2025-06-15");
  });
});
