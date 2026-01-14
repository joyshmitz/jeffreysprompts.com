
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SwipeablePromptCard } from "./SwipeablePromptCard";
import type { Prompt } from "@jeffreysprompts/core/prompts/types";

// Mock hooks
vi.mock("@/hooks/useHaptic", () => ({
  useHaptic: () => ({
    success: vi.fn(),
    error: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
  }),
}));

vi.mock("@/hooks/useIsMobile", () => ({
  useIsSmallScreen: () => true, // Force mobile view
}));

vi.mock("@/hooks/use-basket", () => ({
  useBasket: () => ({
    addItem: vi.fn(),
    isInBasket: () => false,
  }),
}));

vi.mock("@/hooks/useSwipeHint", () => ({
  useSwipeHint: () => ({
    showHint: false,
    dismissHint: vi.fn(),
  }),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock prompt data
const mockPrompt: Prompt = {
  id: "test-prompt",
  title: "Test Prompt",
  description: "A test prompt description",
  category: "ideation",
  tags: ["test"],
  content: "This is the prompt content",
  author: "Test User",
  version: "1.0.0",
  created: "2023-01-01",
};

describe("SwipeablePromptCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the prompt card", () => {
    render(<SwipeablePromptCard prompt={mockPrompt} isMobile={true} />);
    expect(screen.getByText("Test Prompt")).toBeInTheDocument();
    expect(screen.getByText("A test prompt description")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const onClick = vi.fn();
    render(<SwipeablePromptCard prompt={mockPrompt} onClick={onClick} isMobile={true} />);
    
    const card = screen.getByTestId("prompt-card");
    fireEvent.click(card);
    
    expect(onClick).toHaveBeenCalledWith(mockPrompt);
  });

  // Note: Testing actual swipe gestures is complex in JSDOM due to pointer event handling
  // We focus on rendering and interactions that are testable
});
