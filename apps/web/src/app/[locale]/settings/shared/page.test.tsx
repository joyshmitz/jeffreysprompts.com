import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SharedLinksPage from "./page";

const mockSuccess = vi.fn();
const mockError = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}));

vi.mock("@/components/sharing/ShareManagement", () => ({
  __esModule: true,
  default: ({
    shareLinks,
    isLoading,
  }: {
    shareLinks: Array<{ linkCode: string }>;
    isLoading?: boolean;
  }) => (
    <div data-testid="share-management">
      {isLoading ? "loading" : `links:${shareLinks.length}`}
    </div>
  ),
}));

vi.mock("@jeffreysprompts/core/prompts/registry", () => ({
  getPrompt: () => null,
}));

vi.mock("@jeffreysprompts/core/prompts/bundles", () => ({
  getBundle: () => null,
}));

vi.mock("@jeffreysprompts/core/prompts/workflows", () => ({
  getWorkflow: () => null,
}));

describe("SharedLinksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("does not show a success toast when refresh fails", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ links: [] }),
      })
      .mockRejectedValueOnce(new Error("network failure"));

    vi.stubGlobal("fetch", mockFetch);

    render(<SharedLinksPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Refresh" })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockError).toHaveBeenCalledWith(
        "Failed to load share links",
        "Please try again later"
      );
    });

    expect(mockSuccess).not.toHaveBeenCalled();
  });

  it("shows a success toast when refresh succeeds", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ links: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ links: [] }),
      });

    vi.stubGlobal("fetch", mockFetch);

    render(<SharedLinksPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Refresh" })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Share links refreshed");
    });
  });
});
