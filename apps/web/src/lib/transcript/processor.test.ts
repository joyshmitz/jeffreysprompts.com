/**
 * Unit tests for transcript processor
 * @module lib/transcript/processor.test
 */

import { describe, it, expect } from "vitest";
import {
  processTranscript,
  parseTranscriptFile,
  getToolCallSummary,
  getMessageAction,
} from "./processor";
import type { ToolCall, TranscriptMessage } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeJsonlLine(entry: Record<string, unknown>): string {
  return JSON.stringify(entry);
}

function buildJsonl(...entries: Record<string, unknown>[]): string {
  return entries.map(makeJsonlLine).join("\n");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("transcript processor", () => {
  // -----------------------------------------------------------------------
  // processTranscript
  // -----------------------------------------------------------------------

  describe("processTranscript", () => {
    it("processes empty string into empty transcript", () => {
      const result = processTranscript("");
      expect(result.messages).toHaveLength(0);
      expect(result.sections).toHaveLength(0);
      expect(result.meta.model).toBe("Claude");
    });

    it("parses a user message", () => {
      const jsonl = buildJsonl({
        type: "human",
        content: "Hello!",
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe("user");
      expect(result.messages[0].content).toBe("Hello!");
    });

    it("parses an assistant message", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: "Hi there!",
        timestamp: "2026-01-01T00:00:01Z",
      });

      const result = processTranscript(jsonl);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe("assistant");
      expect(result.messages[0].content).toBe("Hi there!");
    });

    it("handles message.role fallback", () => {
      const jsonl = buildJsonl({
        message: { role: "user", content: "Hello via role" },
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe("user");
    });

    it("parses content blocks with text", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: [
          { type: "text", text: "Part 1. " },
          { type: "text", text: "Part 2." },
        ],
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.messages[0].content).toBe("Part 1. Part 2.");
    });

    it("extracts thinking blocks", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: [
          { type: "thinking", text: "Let me think about this..." },
          { type: "text", text: "Here is my answer." },
        ],
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.messages[0].thinking).toBe("Let me think about this...");
      expect(result.messages[0].content).toBe("Here is my answer.");
    });

    it("appends standalone thinking from entry", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: "response",
        thinking: "standalone thinking",
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.messages[0].thinking).toBe("standalone thinking");
    });

    it("extracts tool_use blocks", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: [
          {
            type: "tool_use",
            id: "tool-1",
            name: "Read",
            input: { file_path: "/src/foo.ts" },
          },
        ],
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.messages[0].toolCalls).toHaveLength(1);
      expect(result.messages[0].toolCalls![0].name).toBe("Read");
    });

    it("matches tool_result to tool call", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: [
          {
            type: "tool_use",
            id: "tool-1",
            name: "Read",
            input: { file_path: "/src/foo.ts" },
          },
          {
            type: "tool_result",
            tool_use_id: "tool-1",
            content: "file contents here",
          },
        ],
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.messages[0].toolCalls![0].output).toBe("file contents here");
    });

    it("skips empty messages", () => {
      const jsonl = buildJsonl(
        { type: "assistant", content: "", timestamp: "2026-01-01T00:00:00Z" },
        { type: "assistant", content: "Real content", timestamp: "2026-01-01T00:00:01Z" }
      );

      const result = processTranscript(jsonl);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toBe("Real content");
    });

    it("skips invalid JSON lines", () => {
      const jsonl = "not valid json\n" + makeJsonlLine({
        type: "human",
        content: "Valid",
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.messages).toHaveLength(1);
    });

    it("detects model from messages", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: "Hello",
        model: "claude-3-5-sonnet-20241022",
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.meta.model).toBe("Claude Sonnet");
    });

    it("detects opus model", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: "Hello",
        model: "claude-opus-4-6",
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.meta.model).toBe("Claude Opus");
    });

    it("detects haiku model", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: "Hello",
        model: "claude-haiku-4-5",
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.meta.model).toBe("Claude Haiku");
    });

    it("computes stats correctly", () => {
      const jsonl = buildJsonl(
        { type: "human", content: "Do something", timestamp: "2026-01-01T00:00:00Z" },
        {
          type: "assistant",
          content: [
            { type: "text", text: "Editing..." },
            {
              type: "tool_use",
              id: "t1",
              name: "Edit",
              input: { file_path: "/src/a.ts", new_string: "line1\nline2\nline3" },
            },
          ],
          timestamp: "2026-01-01T00:01:00Z",
        },
        { type: "human", content: "Thanks", timestamp: "2026-01-01T00:02:00Z" }
      );

      const result = processTranscript(jsonl);
      expect(result.meta.stats.userMessages).toBe(2);
      expect(result.meta.stats.assistantMessages).toBe(1);
      expect(result.meta.stats.toolCalls).toBe(1);
      expect(result.meta.stats.filesEdited).toBe(1);
      expect(result.meta.stats.linesWritten).toBe(3);
    });

    it("calculates duration", () => {
      const jsonl = buildJsonl(
        { type: "human", content: "Start", timestamp: "2026-01-01T00:00:00Z" },
        { type: "assistant", content: "End", timestamp: "2026-01-01T00:45:00Z" }
      );

      const result = processTranscript(jsonl);
      expect(result.meta.duration).toBe("45m");
    });

    it("generates a session ID from start time", () => {
      const jsonl = buildJsonl({
        type: "human",
        content: "Hi",
        timestamp: "2026-03-15T10:00:00Z",
      });

      const result = processTranscript(jsonl);
      expect(result.meta.sessionId).toContain("session-2026-03-15");
    });

    it("includes annotations as highlights", () => {
      const jsonl = buildJsonl({
        type: "human",
        content: "Hello",
        timestamp: "2026-01-01T00:00:00Z",
      });
      const annotations = [
        { messageId: "msg-0", type: "key_decision" as const, annotation: "Chose approach A" },
      ];

      const result = processTranscript(jsonl, annotations);
      expect(result.highlights).toHaveLength(1);
      expect(result.highlights[0].annotation).toBe("Chose approach A");
    });
  });

  // -----------------------------------------------------------------------
  // parseTranscriptFile
  // -----------------------------------------------------------------------

  describe("parseTranscriptFile", () => {
    it("is an alias for processTranscript", () => {
      const jsonl = buildJsonl({
        type: "human",
        content: "Hello",
        timestamp: "2026-01-01T00:00:00Z",
      });

      const a = processTranscript(jsonl);
      const b = parseTranscriptFile(jsonl);
      expect(a.messages).toHaveLength(b.messages.length);
    });
  });

  // -----------------------------------------------------------------------
  // detectSections
  // -----------------------------------------------------------------------

  describe("section detection", () => {
    it("detects Deep Analysis section", () => {
      const thinking = "x".repeat(1500);
      const jsonl = buildJsonl({
        type: "assistant",
        content: [
          { type: "thinking", text: thinking },
          { type: "text", text: "Analysis complete" },
        ],
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      const deepAnalysis = result.sections.find((s) => s.title === "Deep Analysis");
      expect(deepAnalysis).toBeTruthy();
      expect(deepAnalysis!.tags).toContain("thinking");
    });

    it("detects Implementation section", () => {
      const entries = [];
      for (let i = 0; i < 3; i++) {
        entries.push({
          type: "assistant",
          content: [
            { type: "text", text: `Editing file ${i}` },
            {
              type: "tool_use",
              id: `t-${i}`,
              name: "Edit",
              input: { file_path: `/src/file${i}.ts`, new_string: "new code" },
            },
          ],
          timestamp: `2026-01-01T00:0${i}:00Z`,
        });
      }

      const jsonl = buildJsonl(...entries);
      const result = processTranscript(jsonl);
      const impl = result.sections.find((s) => s.title === "Implementation");
      expect(impl).toBeTruthy();
      expect(impl!.tags).toContain("code");
    });

    it("detects Exploration section", () => {
      const entries = [];
      for (let i = 0; i < 4; i++) {
        entries.push({
          type: "assistant",
          content: [
            { type: "text", text: `Reading file ${i}` },
            {
              type: "tool_use",
              id: `t-${i}`,
              name: "Read",
              input: { file_path: `/src/file${i}.ts` },
            },
          ],
          timestamp: `2026-01-01T00:0${i}:00Z`,
        });
      }

      const jsonl = buildJsonl(...entries);
      const result = processTranscript(jsonl);
      const exploration = result.sections.find((s) => s.title === "Exploration");
      expect(exploration).toBeTruthy();
      expect(exploration!.tags).toContain("research");
    });

    it("detects Planning section", () => {
      const jsonl = buildJsonl({
        type: "assistant",
        content: [
          { type: "text", text: "Planning tasks" },
          {
            type: "tool_use",
            id: "t1",
            name: "TodoWrite",
            input: { tasks: [] },
          },
        ],
        timestamp: "2026-01-01T00:00:00Z",
      });

      const result = processTranscript(jsonl);
      const planning = result.sections.find((s) => s.title === "Planning");
      expect(planning).toBeTruthy();
    });

    it("returns empty sections for no messages", () => {
      const result = processTranscript("");
      expect(result.sections).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getToolCallSummary
  // -----------------------------------------------------------------------

  describe("getToolCallSummary", () => {
    it("returns empty string for no tool calls", () => {
      expect(getToolCallSummary(undefined)).toBe("");
      expect(getToolCallSummary([])).toBe("");
    });

    it("returns single tool name", () => {
      const calls: ToolCall[] = [
        { id: "1", name: "Read", input: {}, output: "", success: true },
      ];
      expect(getToolCallSummary(calls)).toBe("Read");
    });

    it("groups repeated tool calls", () => {
      const calls: ToolCall[] = [
        { id: "1", name: "Read", input: {}, output: "", success: true },
        { id: "2", name: "Read", input: {}, output: "", success: true },
        { id: "3", name: "Edit", input: {}, output: "", success: true },
      ];
      const summary = getToolCallSummary(calls);
      expect(summary).toContain("Read (\u00d72)");
      expect(summary).toContain("Edit");
    });
  });

  // -----------------------------------------------------------------------
  // getMessageAction
  // -----------------------------------------------------------------------

  describe("getMessageAction", () => {
    it("returns Prompt for user message", () => {
      const msg: TranscriptMessage = {
        id: "1", type: "user", timestamp: "", content: "Hello",
      };
      expect(getMessageAction(msg)).toBe("Prompt");
    });

    it("returns Response for assistant without tools", () => {
      const msg: TranscriptMessage = {
        id: "1", type: "assistant", timestamp: "", content: "Hi",
      };
      expect(getMessageAction(msg)).toBe("Response");
    });

    it("returns Thinking for assistant with thinking", () => {
      const msg: TranscriptMessage = {
        id: "1", type: "assistant", timestamp: "", content: "", thinking: "hmm",
      };
      expect(getMessageAction(msg)).toBe("Thinking");
    });

    it("returns Editing for Edit tool", () => {
      const msg: TranscriptMessage = {
        id: "1", type: "assistant", timestamp: "", content: "",
        toolCalls: [{ id: "t1", name: "Edit", input: {}, output: "", success: true }],
      };
      expect(getMessageAction(msg)).toBe("Editing");
    });

    it("returns Running commands for Bash tool", () => {
      const msg: TranscriptMessage = {
        id: "1", type: "assistant", timestamp: "", content: "",
        toolCalls: [{ id: "t1", name: "Bash", input: {}, output: "", success: true }],
      };
      expect(getMessageAction(msg)).toBe("Running commands");
    });

    it("returns Reading files for Read tool", () => {
      const msg: TranscriptMessage = {
        id: "1", type: "assistant", timestamp: "", content: "",
        toolCalls: [{ id: "t1", name: "Read", input: {}, output: "", success: true }],
      };
      expect(getMessageAction(msg)).toBe("Reading files");
    });

    it("returns Searching for Glob/Grep tools", () => {
      const msg: TranscriptMessage = {
        id: "1", type: "assistant", timestamp: "", content: "",
        toolCalls: [{ id: "t1", name: "Grep", input: {}, output: "", success: true }],
      };
      expect(getMessageAction(msg)).toBe("Searching");
    });

    it("returns Using tools for unknown tool", () => {
      const msg: TranscriptMessage = {
        id: "1", type: "assistant", timestamp: "", content: "",
        toolCalls: [{ id: "t1", name: "CustomTool", input: {}, output: "", success: true }],
      };
      expect(getMessageAction(msg)).toBe("Using tools");
    });
  });
});
