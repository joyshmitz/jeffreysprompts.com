/**
 * Unit tests for CategoryFilter component
 *
 * Tests rendering, interactions (selection, clearing), and accessibility.
 * Philosophy: NO mocks - test real component behavior.
 *
 * @see @/components/CategoryFilter.tsx
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoryFilter } from "./CategoryFilter";
import type { PromptCategory } from "@jeffreysprompts/core/prompts/types";

const mockCategories: PromptCategory[] = ["ideation", "documentation", "automation"];

const mockCounts: Record<PromptCategory, number> = {
  ideation: 5,
  documentation: 10,
  automation: 15,
  refactoring: 0,
  testing: 0,
  debugging: 0,
  workflow: 0,
  communication: 0,
};

describe("CategoryFilter", () => {
  describe("rendering", () => {
    it("renders all category buttons", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected={null}
          onChange={onChange}
        />
      );

      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("ideation")).toBeInTheDocument();
      expect(screen.getByText("documentation")).toBeInTheDocument();
      expect(screen.getByText("automation")).toBeInTheDocument();
    });

    it("renders with counts when provided", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected={null}
          onChange={onChange}
          counts={mockCounts}
        />
      );

      // Total count for All button
      expect(screen.getByText("30")).toBeInTheDocument();
      // Individual counts
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("does not show clear button when no category is selected", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected={null}
          onChange={onChange}
        />
      );

      expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
    });

    it("shows clear button when a category is selected", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected="ideation"
          onChange={onChange}
        />
      );

      expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const onChange = vi.fn();
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selected={null}
          onChange={onChange}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("accessibility", () => {
    it("has accessible group role with label", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected={null}
          onChange={onChange}
        />
      );

      expect(screen.getByRole("group", { name: /filter by category/i })).toBeInTheDocument();
    });

    it("marks All button as pressed when no category selected", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected={null}
          onChange={onChange}
        />
      );

      const allButton = screen.getByText("All").closest("button");
      expect(allButton).toHaveAttribute("aria-pressed", "true");
    });

    it("marks selected category button as pressed", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected="automation"
          onChange={onChange}
        />
      );

      const codingButton = screen.getByText("automation").closest("button");
      expect(codingButton).toHaveAttribute("aria-pressed", "true");

      const allButton = screen.getByText("All").closest("button");
      expect(allButton).toHaveAttribute("aria-pressed", "false");
    });

    it("clear button has accessible label", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected="ideation"
          onChange={onChange}
        />
      );

      expect(screen.getByRole("button", { name: /clear category filter/i })).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onChange with null when All is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected="ideation"
          onChange={onChange}
        />
      );

      await user.click(screen.getByText("All"));
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("calls onChange with category when category button is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected={null}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText("automation"));
      expect(onChange).toHaveBeenCalledWith("automation");
    });

    it("calls onChange with null when clear button is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected="documentation"
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole("button", { name: /clear/i }));
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("allows selecting different categories", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={mockCategories}
          selected="ideation"
          onChange={onChange}
        />
      );

      await user.click(screen.getByText("documentation"));
      expect(onChange).toHaveBeenCalledWith("documentation");

      await user.click(screen.getByText("automation"));
      expect(onChange).toHaveBeenCalledWith("automation");
    });
  });

  describe("edge cases", () => {
    it("renders with empty categories array", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={[]}
          selected={null}
          onChange={onChange}
        />
      );

      expect(screen.getByText("All")).toBeInTheDocument();
    });

    it("renders correctly with single category", () => {
      const onChange = vi.fn();
      render(
        <CategoryFilter
          categories={["ideation"]}
          selected={null}
          onChange={onChange}
        />
      );

      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("ideation")).toBeInTheDocument();
    });

    it("handles counts with zero values", () => {
      const onChange = vi.fn();
      const countsWithZeros: Record<PromptCategory, number> = {
        ideation: 0,
        documentation: 0,
        automation: 5,
        refactoring: 0,
        testing: 0,
        debugging: 0,
        workflow: 0,
        communication: 0,
      };
      render(
        <CategoryFilter
          categories={["ideation", "automation"]}
          selected={null}
          onChange={onChange}
          counts={countsWithZeros}
        />
      );

      // Total is 5 (shown twice - once in All, once in automation)
      expect(screen.getAllByText("5")).toHaveLength(2);
      // Zero is shown for ideation
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});
