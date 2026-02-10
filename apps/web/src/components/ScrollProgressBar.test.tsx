/**
 * Tests for ScrollProgressBar component
 */
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScrollProgressBar } from "./ScrollProgressBar";

describe("ScrollProgressBar", () => {
  it("renders an aria-hidden progress bar", () => {
    const { container } = render(<ScrollProgressBar />);
    const bar = container.firstChild as HTMLElement;
    expect(bar).toBeDefined();
    expect(bar.getAttribute("aria-hidden")).toBe("true");
  });

  it("applies default height of 3px", () => {
    const { container } = render(<ScrollProgressBar />);
    const bar = container.firstChild as HTMLElement;
    expect(bar.style.height).toBe("3px");
  });

  it("applies custom height", () => {
    const { container } = render(<ScrollProgressBar height={5} />);
    const bar = container.firstChild as HTMLElement;
    expect(bar.style.height).toBe("5px");
  });

  it("applies custom className", () => {
    const { container } = render(<ScrollProgressBar className="my-bar" />);
    const bar = container.firstChild as HTMLElement;
    expect(bar.classList.contains("my-bar")).toBe(true);
  });

  it("hides on mobile when showOnMobile is false", () => {
    const { container } = render(<ScrollProgressBar showOnMobile={false} />);
    const bar = container.firstChild as HTMLElement;
    expect(bar.classList.contains("hidden")).toBe(true);
  });

  it("shows on mobile by default", () => {
    const { container } = render(<ScrollProgressBar />);
    const bar = container.firstChild as HTMLElement;
    expect(bar.classList.contains("hidden")).toBe(false);
  });
});
