/**
 * Tests for LanguageSwitcher component.
 *
 * Covers: rendering locales, current locale display,
 * locale change navigation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "./LanguageSwitcher";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockLocale = "en";
vi.mock("next-intl", () => ({
  useLocale: () => mockLocale,
}));

const mockPush = vi.fn();
let mockPathname = "/prompts";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

let capturedOnValueChange: ((val: string) => void) | undefined;

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (val: string) => void;
  }) => {
    capturedOnValueChange = onValueChange;
    return (
      <div data-testid="select" data-value={value}>
        {children}
      </div>
    );
  },
  SelectTrigger: ({
    children,
    ...rest
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <button type="button" {...rest}>{children}</button>,
  SelectValue: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-value={value}>{children}</div>,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocale = "en";
    mockPathname = "/prompts";
    capturedOnValueChange = undefined;
  });

  it("renders with current locale value", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "en");
  });

  it("shows English locale name in options", () => {
    render(<LanguageSwitcher />);
    // English appears in select options
    expect(screen.getAllByText(/English/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders all locale options", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText(/Español/)).toBeInTheDocument();
    expect(screen.getByText(/Français/)).toBeInTheDocument();
    expect(screen.getByText(/Deutsch/)).toBeInTheDocument();
  });

  it("navigates to locale path when changed to non-en", () => {
    render(<LanguageSwitcher />);
    capturedOnValueChange?.("es");
    expect(mockPush).toHaveBeenCalledWith("/es/prompts");
  });

  it("navigates without locale prefix when changed to en", () => {
    mockLocale = "es";
    mockPathname = "/es/prompts";
    render(<LanguageSwitcher />);
    capturedOnValueChange?.("en");
    expect(mockPush).toHaveBeenCalledWith("/prompts");
  });

  it("handles root path correctly", () => {
    mockPathname = "/";
    render(<LanguageSwitcher />);
    capturedOnValueChange?.("fr");
    expect(mockPush).toHaveBeenCalledWith("/fr");
  });

  it("does not strip unsupported two-letter path segments", () => {
    mockPathname = "/it/help";
    render(<LanguageSwitcher />);
    capturedOnValueChange?.("de");
    expect(mockPush).toHaveBeenCalledWith("/de/it/help");
  });
});
