/**
 * Tests for EmptyState and EmptyStateInline components
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EmptyState, EmptyStateInline } from "./EmptyState";

describe("EmptyState", () => {
  it("renders default content variant", () => {
    render(<EmptyState />);
    expect(screen.getByText("Nothing here yet")).toBeDefined();
    expect(screen.getByText("This space is waiting for content to be added.")).toBeDefined();
  });

  it("renders search variant", () => {
    render(<EmptyState variant="search" />);
    expect(screen.getByText("No results found")).toBeDefined();
    expect(screen.getByText("Try adjusting your search terms or filters.")).toBeDefined();
  });

  it("renders filter variant", () => {
    render(<EmptyState variant="filter" />);
    expect(screen.getByText("No matches")).toBeDefined();
  });

  it("renders error variant", () => {
    render(<EmptyState variant="error" />);
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("renders custom title and description", () => {
    render(<EmptyState title="Custom Title" description="Custom description text" />);
    expect(screen.getByText("Custom Title")).toBeDefined();
    expect(screen.getByText("Custom description text")).toBeDefined();
  });

  it("renders primary action button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EmptyState action={{ label: "Try Again", onClick }} />);
    const button = screen.getByText("Try Again");
    expect(button).toBeDefined();
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders secondary action button", async () => {
    const user = userEvent.setup();
    const primary = vi.fn();
    const secondary = vi.fn();
    render(
      <EmptyState
        action={{ label: "Primary", onClick: primary }}
        secondaryAction={{ label: "Secondary", onClick: secondary }}
      />
    );
    await user.click(screen.getByText("Secondary"));
    expect(secondary).toHaveBeenCalledOnce();
  });

  it("does not render actions when not provided", () => {
    render(<EmptyState />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("applies custom className", () => {
    const { container } = render(<EmptyState className="my-custom-class" />);
    expect(container.querySelector(".my-custom-class")).toBeDefined();
  });
});

describe("EmptyStateInline", () => {
  it("renders inline content variant", () => {
    render(<EmptyStateInline />);
    expect(screen.getByText("Nothing here yet")).toBeDefined();
  });

  it("renders inline search variant", () => {
    render(<EmptyStateInline variant="search" />);
    expect(screen.getByText("No results found")).toBeDefined();
  });

  it("renders custom title", () => {
    render(<EmptyStateInline title="No items" />);
    expect(screen.getByText("No items")).toBeDefined();
  });
});
