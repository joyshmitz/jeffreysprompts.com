/**
 * Tests for SwipeHint mobile component
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SwipeHint } from "./SwipeHint";

describe("SwipeHint", () => {
  it("renders hint text", () => {
    render(<SwipeHint onDismiss={vi.fn()} />);
    expect(screen.getByText("Swipe cards for quick actions")).toBeDefined();
  });

  it("renders Copy and Basket labels", () => {
    render(<SwipeHint onDismiss={vi.fn()} />);
    expect(screen.getByText("Copy")).toBeDefined();
    expect(screen.getByText("Basket")).toBeDefined();
  });

  it("renders Got it dismiss button", () => {
    render(<SwipeHint onDismiss={vi.fn()} />);
    expect(screen.getByText("Got it")).toBeDefined();
  });

  it("calls onDismiss when Got it is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<SwipeHint onDismiss={onDismiss} />);
    await user.click(screen.getByText("Got it"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
