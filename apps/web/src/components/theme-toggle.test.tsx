/**
 * Tests for ThemeToggle component.
 *
 * Covers: icon rendering per theme, cycling through themes,
 * ARIA label, sr-only text.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let currentTheme = "light";
const mockSetTheme = vi.fn();

vi.mock("./theme-provider", () => ({
  useTheme: () => ({
    theme: currentTheme,
    setTheme: mockSetTheme,
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentTheme = "light";
  });

  it("renders a button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows Light mode label when theme is light", () => {
    currentTheme = "light";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Current: Light mode. Click to change."
    );
  });

  it("shows Dark mode label when theme is dark", () => {
    currentTheme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Current: Dark mode. Click to change."
    );
  });

  it("shows System preference label when theme is system", () => {
    currentTheme = "system";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Current: System preference. Click to change."
    );
  });

  it("cycles from light to dark on click", () => {
    currentTheme = "light";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("cycles from dark to system on click", () => {
    currentTheme = "dark";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });

  it("cycles from system to light on click", () => {
    currentTheme = "system";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("has sr-only text for screen readers", () => {
    currentTheme = "light";
    render(<ThemeToggle />);
    expect(screen.getByText("Light mode")).toBeInTheDocument();
  });

  it("has title attribute", () => {
    currentTheme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute("title", "Dark mode");
  });
});
