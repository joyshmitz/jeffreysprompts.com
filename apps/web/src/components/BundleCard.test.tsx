/**
 * Tests for BundleCard component.
 *
 * Covers: title, description, prompt count, version, prompt IDs,
 * install copy, featured badge, overflow indicator.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BundleCard } from "./BundleCard";
import type { Bundle } from "@jeffreysprompts/core/prompts/bundles";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, style, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
    span: ({ children, ...props }: Record<string, unknown>) => {
      const { whileHover, ...rest } = props;
      return <span {...rest}>{children as React.ReactNode}</span>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
  useSpring: (_initial: number) => ({ set: vi.fn(), get: () => 0, on: () => () => {} }),
  useMotionTemplate: (strings: TemplateStringsArray, ...values: unknown[]) => {
    return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");
  },
}));

const mockCopy = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/lib/clipboard", () => ({
  copyToClipboard: (...args: unknown[]) => mockCopy(...args),
}));

const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}));

vi.mock("@/hooks/useMousePosition", () => ({
  useMousePosition: () => ({
    motionPercentageX: { get: () => 50, on: () => () => {} },
    motionPercentageY: { get: () => 50, on: () => () => {} },
    handleMouseMove: vi.fn(),
    resetMousePosition: vi.fn(),
  }),
}));

vi.mock("@/components/featured/staff-pick-badge", () => ({
  FeaturedContentBadge: ({ size }: { size: string }) => (
    <span data-testid="featured-badge">Featured</span>
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseBundle: Bundle = {
  id: "test-bundle",
  title: "Test Bundle",
  description: "A bundle for testing purposes",
  version: "1.0.0",
  updatedAt: "2026-01-01",
  promptIds: ["prompt-a", "prompt-b"],
  author: "Test Author",
};

const largeBundleWith5Prompts: Bundle = {
  ...baseBundle,
  id: "big-bundle",
  promptIds: ["p1", "p2", "p3", "p4", "p5"],
};

const featuredBundle: Bundle = {
  ...baseBundle,
  featured: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BundleCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCopy.mockResolvedValue({ success: true });
  });

  it("renders bundle title", () => {
    render(<BundleCard bundle={baseBundle} />);
    expect(screen.getByText("Test Bundle")).toBeInTheDocument();
  });

  it("renders bundle description", () => {
    render(<BundleCard bundle={baseBundle} />);
    expect(screen.getByText("A bundle for testing purposes")).toBeInTheDocument();
  });

  it("shows prompt count", () => {
    render(<BundleCard bundle={baseBundle} />);
    expect(screen.getByText("2 Prompts")).toBeInTheDocument();
  });

  it("shows version", () => {
    render(<BundleCard bundle={baseBundle} />);
    expect(screen.getByText("Version 1.0.0")).toBeInTheDocument();
  });

  it("shows prompt IDs up to 3", () => {
    render(<BundleCard bundle={baseBundle} />);
    expect(screen.getByText("prompt-a")).toBeInTheDocument();
    expect(screen.getByText("prompt-b")).toBeInTheDocument();
  });

  it("shows overflow indicator for bundles with more than 3 prompts", () => {
    render(<BundleCard bundle={largeBundleWith5Prompts} />);
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("shows featured badge when featured", () => {
    render(<BundleCard bundle={featuredBundle} />);
    expect(screen.getByTestId("featured-badge")).toBeInTheDocument();
  });

  it("does not show featured badge when not featured", () => {
    render(<BundleCard bundle={baseBundle} />);
    expect(screen.queryByTestId("featured-badge")).not.toBeInTheDocument();
  });

  it("has View link", () => {
    render(<BundleCard bundle={baseBundle} />);
    const viewLink = screen.getByText("View").closest("a");
    expect(viewLink).toHaveAttribute("href", "/bundles/test-bundle");
  });

  it("has Install button", () => {
    render(<BundleCard bundle={baseBundle} />);
    expect(screen.getByText("Install")).toBeInTheDocument();
  });

  it("copies install command on Install click", async () => {
    render(<BundleCard bundle={baseBundle} />);

    const installBtn = screen.getByText("Install").closest("button")!;
    fireEvent.click(installBtn);

    await waitFor(() => {
      expect(mockCopy).toHaveBeenCalledTimes(1);
    });

    const command = mockCopy.mock.calls[0][0] as string;
    expect(command).toContain("curl -fsSL");
    expect(command).toContain("prompt-a");
    expect(command).toContain("prompt-b");
  });

  it("shows success toast after install copy", async () => {
    render(<BundleCard bundle={baseBundle} />);

    fireEvent.click(screen.getByText("Install").closest("button")!);

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith(
        "Install command copied",
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  it("shows error toast when copy fails", async () => {
    mockCopy.mockResolvedValue({ success: false, error: new Error("fail") });

    render(<BundleCard bundle={baseBundle} />);

    fireEvent.click(screen.getByText("Install").closest("button")!);

    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith("Failed to copy", "Please try again");
    });
  });

  it("shows workflow when present", () => {
    const bundleWithWorkflow: Bundle = {
      ...baseBundle,
      workflow: "Step 1: Run ideation. Step 2: Review.",
    };
    render(<BundleCard bundle={bundleWithWorkflow} />);
    expect(screen.getByText(/Step 1: Run ideation/)).toBeInTheDocument();
  });
});
