/**
 * Tests for GestureHint onboarding component
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { GestureHint } from "./GestureHint";

describe("GestureHint", () => {
  it("renders swipe gesture hint", () => {
    render(<GestureHint type="swipe" onDismiss={vi.fn()} />);
    expect(screen.getByText("Swipe")).toBeDefined();
    expect(screen.getByText("Swipe left to copy, right to basket")).toBeDefined();
  });

  it("renders double-tap gesture hint", () => {
    render(<GestureHint type="double-tap" onDismiss={vi.fn()} />);
    expect(screen.getByText("Double-tap")).toBeDefined();
    expect(screen.getByText("Tap twice quickly to save")).toBeDefined();
  });

  it("renders long-press gesture hint", () => {
    render(<GestureHint type="long-press" onDismiss={vi.fn()} />);
    expect(screen.getByText("Long-press")).toBeDefined();
    expect(screen.getByText("Hold for quick actions menu")).toBeDefined();
  });

  it("renders all gestures combined when type is all", () => {
    render(<GestureHint type="all" onDismiss={vi.fn()} />);
    expect(screen.getByText("Card Gestures")).toBeDefined();
    expect(screen.getByText("Double-tap")).toBeDefined();
    expect(screen.getByText("Long-press")).toBeDefined();
  });

  it("calls onDismiss on Got it click for single gesture", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<GestureHint type="swipe" onDismiss={onDismiss} />);
    await user.click(screen.getByText("Got it"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("calls onDismiss on Got it click for all gestures", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<GestureHint type="all" onDismiss={onDismiss} />);
    await user.click(screen.getByText("Got it"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("applies custom className", () => {
    const { container } = render(
      <GestureHint type="swipe" onDismiss={vi.fn()} className="custom-class" />
    );
    const hint = container.querySelector(".custom-class");
    expect(hint).toBeDefined();
  });
});
