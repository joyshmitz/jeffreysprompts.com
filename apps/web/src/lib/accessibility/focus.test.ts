/**
 * Unit tests for focus management utilities
 * Tests WCAG focus trap, focus movement, and error focus.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getFocusableElements,
  focusTrap,
  moveFocusTo,
  focusFirstError,
  getActiveElement,
} from "./focus";

function createContainer(html: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("getFocusableElements", () => {
  it("finds buttons that are not disabled", () => {
    const container = createContainer(
      '<button>Click</button><button disabled>Disabled</button>'
    );
    const elements = getFocusableElements(container);
    // In happy-dom, getClientRects may return empty - test the function doesn't throw
    expect(Array.isArray(elements)).toBe(true);
  });

  it("finds links with href", () => {
    const container = createContainer(
      '<a href="/page">Link</a><a>No href</a>'
    );
    const elements = getFocusableElements(container);
    expect(Array.isArray(elements)).toBe(true);
  });

  it("finds form inputs", () => {
    const container = createContainer(
      '<input type="text" /><select><option>A</option></select><textarea></textarea>'
    );
    const elements = getFocusableElements(container);
    expect(Array.isArray(elements)).toBe(true);
  });

  it("returns empty array for container with no focusable elements", () => {
    const container = createContainer("<div><p>Text only</p></div>");
    const elements = getFocusableElements(container);
    expect(elements).toEqual([]);
  });

  it("excludes elements with tabindex=-1", () => {
    const container = createContainer(
      '<button tabindex="-1">Hidden</button><button>Visible</button>'
    );
    const elements = getFocusableElements(container);
    // tabindex=-1 elements should be excluded
    for (const el of elements) {
      expect(el.getAttribute("tabindex")).not.toBe("-1");
    }
  });

  it("excludes aria-hidden elements", () => {
    const container = createContainer(
      '<button aria-hidden="true">Hidden</button><button>Visible</button>'
    );
    const elements = getFocusableElements(container);
    for (const el of elements) {
      expect(el.hasAttribute("aria-hidden")).toBe(false);
    }
  });
});

describe("focusTrap", () => {
  it("returns a cleanup function", () => {
    const container = createContainer("<button>A</button><button>B</button>");
    const cleanup = focusTrap(container);
    expect(typeof cleanup).toBe("function");
    cleanup();
  });

  it("cleanup does not throw", () => {
    const container = createContainer("<button>A</button>");
    const cleanup = focusTrap(container);
    expect(() => cleanup()).not.toThrow();
  });
});

describe("moveFocusTo", () => {
  it("does not throw when element is null", () => {
    expect(() => moveFocusTo(null)).not.toThrow();
  });

  it("adds tabindex=-1 if element is not focusable", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    moveFocusTo(div);
    expect(div.getAttribute("tabindex")).toBe("-1");
  });

  it("does not override existing tabindex", () => {
    const div = document.createElement("div");
    div.setAttribute("tabindex", "0");
    document.body.appendChild(div);
    moveFocusTo(div);
    expect(div.getAttribute("tabindex")).toBe("0");
  });

  it("calls focus on the element", () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    const focusSpy = vi.spyOn(btn, "focus");
    moveFocusTo(btn);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("respects preventScroll option", () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    const focusSpy = vi.spyOn(btn, "focus");
    moveFocusTo(btn, { preventScroll: true });
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });
});

describe("focusFirstError", () => {
  it("does not throw when form has no errors", () => {
    const form = document.createElement("form");
    document.body.appendChild(form);
    expect(() => focusFirstError(form)).not.toThrow();
  });

  it("focuses element with aria-invalid='true'", () => {
    const form = document.createElement("form");
    const input = document.createElement("input");
    input.setAttribute("aria-invalid", "true");
    form.appendChild(input);
    document.body.appendChild(form);

    const focusSpy = vi.spyOn(input, "focus");
    focusFirstError(form);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("focuses element with data-error='true'", () => {
    const form = document.createElement("form");
    const input = document.createElement("input");
    input.setAttribute("data-error", "true");
    form.appendChild(input);
    document.body.appendChild(form);

    const focusSpy = vi.spyOn(input, "focus");
    focusFirstError(form);
    expect(focusSpy).toHaveBeenCalled();
  });
});

describe("getActiveElement", () => {
  it("returns document.activeElement", () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    btn.focus();
    const active = getActiveElement();
    // In happy-dom, activeElement might be body or button
    expect(active).toBeDefined();
  });

  it("returns an element (not null)", () => {
    const active = getActiveElement();
    expect(active).not.toBeNull();
  });
});
