/**
 * Tests for RatingFilter component.
 *
 * Covers: rendering, ARIA label, option display, onChange callback,
 * disabled state.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RatingFilter } from "./RatingFilter";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let capturedOnValueChange: ((val: string) => void) | undefined;

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (val: string) => void;
    disabled?: boolean;
  }) => {
    capturedOnValueChange = onValueChange;
    return (
      <div data-testid="select" data-value={value} data-disabled={disabled}>
        {children}
      </div>
    );
  },
  SelectTrigger: ({
    children,
    className,
    ...rest
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <button type="button" {...rest}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder: string }) => (
    <span>{placeholder}</span>
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

describe("RatingFilter", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnValueChange = undefined;
  });

  it("renders with ARIA label", () => {
    render(<RatingFilter value={0} onChange={onChange} />);
    expect(screen.getByLabelText("Filter by minimum rating")).toBeInTheDocument();
  });

  it("renders all MIN_RATING_OPTIONS", () => {
    render(<RatingFilter value={0} onChange={onChange} />);
    expect(screen.getByText("Any rating")).toBeInTheDocument();
    expect(screen.getByText("50%+")).toBeInTheDocument();
    expect(screen.getByText("60%+")).toBeInTheDocument();
    expect(screen.getByText("70%+")).toBeInTheDocument();
    expect(screen.getByText("80%+")).toBeInTheDocument();
    expect(screen.getByText("90%+")).toBeInTheDocument();
  });

  it("passes current value to Select", () => {
    render(<RatingFilter value={70} onChange={onChange} />);
    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "70");
  });

  it("calls onChange with numeric value on selection", () => {
    render(<RatingFilter value={0} onChange={onChange} />);
    capturedOnValueChange?.("80");
    expect(onChange).toHaveBeenCalledWith(80);
  });

  it("defaults to 0 for invalid value", () => {
    render(<RatingFilter value={0} onChange={onChange} />);
    capturedOnValueChange?.("999");
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("passes disabled state to Select", () => {
    render(<RatingFilter value={0} onChange={onChange} disabled />);
    expect(screen.getByTestId("select")).toHaveAttribute("data-disabled", "true");
  });

  it("shows placeholder text", () => {
    render(<RatingFilter value={0} onChange={onChange} />);
    expect(screen.getByText("Min rating")).toBeInTheDocument();
  });
});
