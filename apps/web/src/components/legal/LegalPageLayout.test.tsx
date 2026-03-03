/**
 * Tests for LegalPageLayout component.
 *
 * Covers: title, last updated, version, table of contents,
 * sidebar links, contact email, print button, children rendering.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LegalPageLayout } from "./LegalPageLayout";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const tocItems = [
  { id: "section-1", title: "Introduction" },
  { id: "section-2", title: "Definitions" },
  { id: "section-3", title: "Your Rights" },
];

const defaultProps = {
  title: "Terms of Service",
  lastUpdated: "February 1, 2026",
  icon: "terms" as const,
  tableOfContents: tocItems,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LegalPageLayout", () => {
  it("renders page title", () => {
    render(
      <LegalPageLayout {...defaultProps}>
        <p>Content here</p>
      </LegalPageLayout>
    );
    // Title also appears in sidebar links
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Terms of Service");
  });

  it("shows last updated date", () => {
    render(
      <LegalPageLayout {...defaultProps}>
        <p>Content</p>
      </LegalPageLayout>
    );
    expect(screen.getByText(/February 1, 2026/)).toBeInTheDocument();
  });

  it("shows version with default", () => {
    render(
      <LegalPageLayout {...defaultProps}>
        <p>Content</p>
      </LegalPageLayout>
    );
    expect(screen.getByText("Version 1.0")).toBeInTheDocument();
  });

  it("shows custom version", () => {
    render(
      <LegalPageLayout {...defaultProps} version="2.3">
        <p>Content</p>
      </LegalPageLayout>
    );
    expect(screen.getByText("Version 2.3")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <LegalPageLayout {...defaultProps}>
        <p>This is the legal content.</p>
      </LegalPageLayout>
    );
    expect(screen.getByText("This is the legal content.")).toBeInTheDocument();
  });

  it("renders table of contents items", () => {
    render(
      <LegalPageLayout {...defaultProps}>
        <p>Content</p>
      </LegalPageLayout>
    );
    expect(screen.getAllByText("Introduction").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Definitions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Your Rights").length).toBeGreaterThan(0);
  });

  it("renders legal page sidebar links", () => {
    render(
      <LegalPageLayout {...defaultProps}>
        <p>Content</p>
      </LegalPageLayout>
    );
    // Title "Terms of Service" also in sidebar, so use getAllByText
    expect(screen.getAllByText("Terms of Service").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Privacy Policy").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Community Guidelines").length).toBeGreaterThanOrEqual(1);
  });

  it("shows contact email", () => {
    render(
      <LegalPageLayout {...defaultProps}>
        <p>Content</p>
      </LegalPageLayout>
    );
    expect(screen.getByText("legal@jeffreysprompts.com")).toBeInTheDocument();
  });

  it("has print button", () => {
    const mockPrint = vi.fn();
    vi.stubGlobal("print", mockPrint);

    render(
      <LegalPageLayout {...defaultProps}>
        <p>Content</p>
      </LegalPageLayout>
    );

    const printBtn = screen.getByText("Print this page");
    expect(printBtn).toBeInTheDocument();
  });

  it("renders with privacy icon", () => {
    render(
      <LegalPageLayout {...defaultProps} icon="privacy" title="Privacy Policy">
        <p>Content</p>
      </LegalPageLayout>
    );
    // Title + sidebar link both say "Privacy Policy"
    expect(screen.getAllByText("Privacy Policy").length).toBeGreaterThanOrEqual(2);
  });

  it("renders with guidelines icon", () => {
    render(
      <LegalPageLayout {...defaultProps} icon="guidelines" title="Community Guidelines">
        <p>Content</p>
      </LegalPageLayout>
    );
    // Title + sidebar link both say "Community Guidelines"
    expect(screen.getAllByText("Community Guidelines").length).toBeGreaterThanOrEqual(2);
  });

  it("has mobile table of contents details element", () => {
    render(
      <LegalPageLayout {...defaultProps}>
        <p>Content</p>
      </LegalPageLayout>
    );
    expect(screen.getAllByText("Table of Contents").length).toBeGreaterThan(0);
  });
});
