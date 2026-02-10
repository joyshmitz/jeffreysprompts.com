/**
 * Tests for KeyboardShortcutsModal component
 */
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import type { KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";

const mockShortcuts: KeyboardShortcut[] = [
  { id: "search", keys: "cmd+k", description: "Open search", handler: vi.fn(), category: "Navigation" },
  { id: "home", keys: "g h", description: "Go to home", handler: vi.fn(), category: "Navigation" },
  { id: "help", keys: "shift+?", description: "Show help", handler: vi.fn(), category: "General" },
];

describe("KeyboardShortcutsModal", () => {
  it("does not render when closed", () => {
    render(
      <KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} shortcuts={mockShortcuts} />
    );
    expect(screen.queryByText("Keyboard Shortcuts")).toBeNull();
  });

  it("renders when open", () => {
    render(
      <KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />
    );
    expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();
  });

  it("renders shortcut descriptions", () => {
    render(
      <KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />
    );
    expect(screen.getByText("Open search")).toBeDefined();
    expect(screen.getByText("Go to home")).toBeDefined();
    expect(screen.getByText("Show help")).toBeDefined();
  });

  it("groups shortcuts by category", () => {
    render(
      <KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />
    );
    expect(screen.getByText("Navigation")).toBeDefined();
    expect(screen.getByText("General")).toBeDefined();
  });

  it("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <KeyboardShortcutsModal isOpen={true} onClose={onClose} shortcuts={mockShortcuts} />
    );
    await user.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <KeyboardShortcutsModal isOpen={true} onClose={onClose} shortcuts={mockShortcuts} />
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders dialog with correct role", () => {
    render(
      <KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />
    );
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("renders footer hint text", () => {
    render(
      <KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />
    );
    expect(screen.getByText(/anytime to show this help/)).toBeDefined();
  });
});
