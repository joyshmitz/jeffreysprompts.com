import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SharePage from "./page";

const mockPush = vi.fn();
const mockSuccess = vi.fn();
const mockError = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({
    locale: "es",
    linkCode: "abc123",
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: { div: (props: Record<string, unknown>) => <div {...props} /> },
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}));

vi.mock("@/components/history/HistoryTracker", () => ({
  HistoryTracker: () => null,
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/lib/clipboard", () => ({
  copyToClipboard: vi.fn(),
}));

describe("SharePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("routes missing share links back to the active locale home page", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByText("Share Link Not Found")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Go to Homepage" }));
    expect(mockPush).toHaveBeenCalledWith("/es");
  });

  it("uses the active locale for the password screen home link", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ requiresPassword: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByText("Password Protected")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Explore other prompts" })).toHaveAttribute(
      "href",
      "/es"
    );
  });
});
