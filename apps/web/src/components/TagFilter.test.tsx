/**
 * Unit tests for TagFilter component
 *
 * Tests rendering, multi-select interactions, sorting, visibility limits, and accessibility.
 * Philosophy: NO mocks - test real component behavior.
 *
 * @see @/components/TagFilter.tsx
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TagFilter } from "./TagFilter";

const mockTags = ["react", "typescript", "testing", "vitest", "frontend"];

const mockCounts: Record<string, number> = {
  react: 15,
  typescript: 10,
  testing: 8,
  vitest: 3,
  frontend: 12,
};

describe("TagFilter", () => {
  describe("rendering", () => {
    it("renders all tags", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
        />
      );

      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("typescript")).toBeInTheDocument();
      expect(screen.getByText("testing")).toBeInTheDocument();
      expect(screen.getByText("vitest")).toBeInTheDocument();
      expect(screen.getByText("frontend")).toBeInTheDocument();
    });

    it("renders Tags label", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
        />
      );

      expect(screen.getByText("Tags")).toBeInTheDocument();
    });

    it("renders with counts when provided", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
          counts={mockCounts}
        />
      );

      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
    });

    it("sorts tags by count when counts are provided", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
          counts={mockCounts}
        />
      );

      const buttons = screen.getAllByRole("button", { pressed: false });
      // First button should be react (15), second frontend (12), third typescript (10)
      expect(buttons[0]).toHaveTextContent("react");
      expect(buttons[1]).toHaveTextContent("frontend");
      expect(buttons[2]).toHaveTextContent("typescript");
    });

    it("sorts tags alphabetically when no counts provided", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={["zebra", "apple", "mango"]}
          selected={[]}
          onChange={onChange}
        />
      );

      const buttons = screen.getAllByRole("button", { pressed: false });
      expect(buttons[0]).toHaveTextContent("apple");
      expect(buttons[1]).toHaveTextContent("mango");
      expect(buttons[2]).toHaveTextContent("zebra");
    });

    it("does not show clear button when no tags selected", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
        />
      );

      expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
    });

    it("shows clear button with count when tags are selected", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={["react", "typescript"]}
          onChange={onChange}
        />
      );

      expect(screen.getByRole("button", { name: /clear 2 selected tags/i })).toBeInTheDocument();
      expect(screen.getByText(/Clear \(2\)/)).toBeInTheDocument();
    });

    it("shows singular 'tag' in clear button when one selected", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={["react"]}
          onChange={onChange}
        />
      );

      expect(screen.getByRole("button", { name: /clear 1 selected tag$/i })).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const onChange = vi.fn();
      const { container } = render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("visibility limits", () => {
    it("respects maxVisible prop", () => {
      const onChange = vi.fn();
      const manyTags = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
      render(
        <TagFilter
          tags={manyTags}
          selected={[]}
          onChange={onChange}
          maxVisible={5}
        />
      );

      // Should show first 5 tags
      expect(screen.getByText("a")).toBeInTheDocument();
      expect(screen.getByText("b")).toBeInTheDocument();
      expect(screen.getByText("c")).toBeInTheDocument();
      expect(screen.getByText("d")).toBeInTheDocument();
      expect(screen.getByText("e")).toBeInTheDocument();

      // Should not show remaining tags
      expect(screen.queryByText(/^f$/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^g$/)).not.toBeInTheDocument();
    });

    it("shows hidden count indicator", () => {
      const onChange = vi.fn();
      const manyTags = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
      render(
        <TagFilter
          tags={manyTags}
          selected={[]}
          onChange={onChange}
          maxVisible={5}
        />
      );

      expect(screen.getByText("+5 more")).toBeInTheDocument();
    });

    it("does not show hidden count when all tags visible", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
          maxVisible={10}
        />
      );

      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });

    it("uses default maxVisible of 15", () => {
      const onChange = vi.fn();
      const sixteenTags = Array.from({ length: 16 }, (_, i) => `tag${i}`);
      render(
        <TagFilter
          tags={sixteenTags}
          selected={[]}
          onChange={onChange}
        />
      );

      // Should show 15 tags and "+1 more"
      expect(screen.getByText("+1 more")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has accessible group with label reference", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
        />
      );

      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("aria-labelledby", "tag-filter-label");
    });

    it("marks selected tags with aria-pressed", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={["react", "typescript"]}
          onChange={onChange}
        />
      );

      const reactButton = screen.getByText("react").closest("button");
      const typescriptButton = screen.getByText("typescript").closest("button");
      const testingButton = screen.getByText("testing").closest("button");

      expect(reactButton).toHaveAttribute("aria-pressed", "true");
      expect(typescriptButton).toHaveAttribute("aria-pressed", "true");
      expect(testingButton).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("interactions", () => {
    it("calls onChange with added tag when unselected tag is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText("react"));
      expect(onChange).toHaveBeenCalledWith(["react"]);
    });

    it("calls onChange with removed tag when selected tag is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={["react", "typescript"]}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText("react"));
      expect(onChange).toHaveBeenCalledWith(["typescript"]);
    });

    it("calls onChange with empty array when clear button is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={mockTags}
          selected={["react", "typescript", "testing"]}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole("button", { name: /clear/i }));
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("allows selecting multiple tags", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { rerender } = render(
        <TagFilter
          tags={mockTags}
          selected={[]}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText("react"));
      expect(onChange).toHaveBeenLastCalledWith(["react"]);

      // Simulate parent updating selected
      rerender(
        <TagFilter
          tags={mockTags}
          selected={["react"]}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText("typescript"));
      expect(onChange).toHaveBeenLastCalledWith(["react", "typescript"]);
    });
  });

  describe("edge cases", () => {
    it("renders with empty tags array", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={[]}
          selected={[]}
          onChange={onChange}
        />
      );

      expect(screen.getByText("Tags")).toBeInTheDocument();
      expect(screen.queryByRole("button", { pressed: false })).not.toBeInTheDocument();
    });

    it("handles counts with zero values", () => {
      const onChange = vi.fn();
      const countsWithZeros: Record<string, number> = {
        react: 0,
        typescript: 5,
      };
      render(
        <TagFilter
          tags={["react", "typescript"]}
          selected={[]}
          onChange={onChange}
          counts={countsWithZeros}
        />
      );

      // Zero should be displayed
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("handles single tag", () => {
      const onChange = vi.fn();
      render(
        <TagFilter
          tags={["single"]}
          selected={[]}
          onChange={onChange}
        />
      );

      expect(screen.getByText("single")).toBeInTheDocument();
    });
  });
});
