import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { helpCommand } from "../../src/commands/help";

let output: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  output = [];
  console.log = (...args: unknown[]) => {
    output.push(args.join(" "));
  };
});

afterEach(() => {
  console.log = originalLog;
});

describe("helpCommand", () => {
  describe("JSON output", () => {
    it("outputs valid JSON", () => {
      helpCommand({ json: true });
      const json = JSON.parse(output.join(""));
      expect(typeof json).toBe("object");
    });

    it("includes name and version", () => {
      helpCommand({ json: true });
      const json = JSON.parse(output.join(""));
      expect(json.name).toBe("jfp");
      expect(json.version).toBeDefined();
    });

    it("includes documentation URL", () => {
      helpCommand({ json: true });
      const json = JSON.parse(output.join(""));
      expect(json.documentation).toBe("https://jeffreysprompts.com/docs");
    });

    it("includes categorized commands", () => {
      helpCommand({ json: true });
      const json = JSON.parse(output.join(""));

      expect(json.commands).toHaveProperty("listing_searching");
      expect(json.commands).toHaveProperty("viewing");
      expect(json.commands).toHaveProperty("copying_exporting");
      expect(json.commands).toHaveProperty("premium");
      expect(json.commands).toHaveProperty("bundles");
      expect(json.commands).toHaveProperty("registry");
      expect(json.commands).toHaveProperty("utilities");
    });

    it("each command has name and description", () => {
      helpCommand({ json: true });
      const json = JSON.parse(output.join(""));

      for (const [_, commands] of Object.entries(json.commands)) {
        for (const cmd of commands as { name: string; description: string }[]) {
          expect(cmd).toHaveProperty("name");
          expect(cmd).toHaveProperty("description");
          expect(typeof cmd.name).toBe("string");
          expect(typeof cmd.description).toBe("string");
        }
      }
    });

    it("includes examples", () => {
      helpCommand({ json: true });
      const json = JSON.parse(output.join(""));

      expect(Array.isArray(json.examples)).toBe(true);
      expect(json.examples.length).toBeGreaterThan(0);

      for (const example of json.examples) {
        expect(example).toHaveProperty("command");
        expect(example).toHaveProperty("description");
      }
    });
  });

  describe("schema stability (golden test)", () => {
    it("maintains stable JSON schema for agents", () => {
      helpCommand({ json: true });
      const json = JSON.parse(output.join(""));

      // These top-level keys MUST exist
      const requiredKeys = ["name", "version", "description", "documentation", "commands", "examples"];
      for (const key of requiredKeys) {
        expect(json).toHaveProperty(key);
      }

      // Commands structure MUST have these categories
      const requiredCategories = [
        "listing_searching",
        "viewing",
        "copying_exporting",
        "premium",
        "bundles",
        "registry",
        "utilities",
      ];
      for (const cat of requiredCategories) {
        expect(json.commands).toHaveProperty(cat);
        expect(Array.isArray(json.commands[cat])).toBe(true);
      }
    });
  });
});
