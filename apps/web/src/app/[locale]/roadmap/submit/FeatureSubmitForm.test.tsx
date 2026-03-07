import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FeatureSubmitForm } from "./FeatureSubmitForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("FeatureSubmitForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("redirects to the locale-aware feature detail page after a successful submit", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ feature: { id: "feat-new" } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<FeatureSubmitForm locale="es" />);

    fireEvent.change(screen.getByLabelText(/feature title/i), {
      target: { value: "Localized roadmap feature" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: {
        value:
          "This description is comfortably longer than twenty characters for validation.",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit feature request/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/roadmap", expect.objectContaining({
        method: "POST",
      }));
    });

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/es/roadmap/feat-new");
      },
      { timeout: 2500 }
    );
  });

  it("uses a locale-aware roadmap destination for cancel", () => {
    render(<FeatureSubmitForm locale="es" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockPush).toHaveBeenCalledWith("/es/roadmap");
  });
});
