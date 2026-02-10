/**
 * Unit tests for screen reader announcement utilities
 * Tests ARIA live region announcements for assistive technology.
 *
 * Note: The announce module maintains internal module-level state (announceContainer).
 * Tests run sequentially and share this state. We don't clean up between tests
 * because the module caches the container reference.
 */

import { describe, it, expect } from "vitest";
import { announceToScreenReader, announceCount, clearAnnouncement } from "./announce";

describe("announceToScreenReader", () => {
  it("creates an announcement container in the DOM", () => {
    announceToScreenReader("Test message");
    const container = document.getElementById("a11y-announcer");
    expect(container).not.toBeNull();
  });

  it("container has role='status'", () => {
    const container = document.getElementById("a11y-announcer");
    expect(container?.getAttribute("role")).toBe("status");
  });

  it("container has aria-atomic='true'", () => {
    const container = document.getElementById("a11y-announcer");
    expect(container?.getAttribute("aria-atomic")).toBe("true");
  });

  it("container has sr-only class", () => {
    const container = document.getElementById("a11y-announcer");
    expect(container?.className).toBe("sr-only");
  });

  it("sets aria-live based on priority", () => {
    announceToScreenReader("Urgent!", "assertive");
    const container = document.getElementById("a11y-announcer");
    expect(container?.getAttribute("aria-live")).toBe("assertive");
  });

  it("resets to polite on next call", () => {
    announceToScreenReader("Normal message", "polite");
    const container = document.getElementById("a11y-announcer");
    expect(container?.getAttribute("aria-live")).toBe("polite");
  });

  it("reuses existing container on subsequent calls", () => {
    announceToScreenReader("First");
    announceToScreenReader("Second");
    const containers = document.querySelectorAll("#a11y-announcer");
    expect(containers.length).toBe(1);
  });

  it("clears textContent before rAF update", () => {
    announceToScreenReader("Message");
    const container = document.getElementById("a11y-announcer");
    // After calling, textContent is cleared (rAF hasn't fired yet)
    expect(container?.textContent).toBe("");
  });
});

describe("announceCount", () => {
  it("calls announceToScreenReader without error", () => {
    expect(() => announceCount(0, "result", "results")).not.toThrow();
    expect(() => announceCount(1, "item", "items")).not.toThrow();
    expect(() => announceCount(5, "match", "matches")).not.toThrow();
  });

  it("container still exists after count announcements", () => {
    announceCount(3, "prompt", "prompts");
    const container = document.getElementById("a11y-announcer");
    expect(container).not.toBeNull();
  });
});

describe("clearAnnouncement", () => {
  it("clears the container text content", () => {
    announceToScreenReader("Something");
    clearAnnouncement();
    const container = document.getElementById("a11y-announcer");
    expect(container?.textContent).toBe("");
  });

  it("does not throw when called", () => {
    expect(() => clearAnnouncement()).not.toThrow();
  });
});
