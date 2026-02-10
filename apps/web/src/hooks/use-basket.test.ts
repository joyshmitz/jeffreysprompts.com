/**
 * Tests for useBasket hook — basket context wrapper
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ReactNode } from "react";
import React from "react";
import { useBasket } from "./use-basket";
import { BasketProvider } from "@/contexts/basket-context";

function wrapper({ children }: { children: ReactNode }) {
  return React.createElement(BasketProvider, null, children);
}

describe("useBasket", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("throws when used outside BasketProvider", () => {
    expect(() => {
      renderHook(() => useBasket());
    }).toThrow("useBasket must be used within BasketProvider");
  });

  it("starts with empty basket", () => {
    const { result } = renderHook(() => useBasket(), { wrapper });
    expect(result.current.items).toEqual([]);
  });

  it("adds items to basket", () => {
    const { result } = renderHook(() => useBasket(), { wrapper });
    act(() => {
      result.current.addItem("prompt-1");
    });
    expect(result.current.items).toContain("prompt-1");
  });

  it("removes items from basket", () => {
    const { result } = renderHook(() => useBasket(), { wrapper });
    act(() => {
      result.current.addItem("prompt-1");
      result.current.addItem("prompt-2");
    });
    act(() => {
      result.current.removeItem("prompt-1");
    });
    expect(result.current.items).not.toContain("prompt-1");
    expect(result.current.items).toContain("prompt-2");
  });

  it("prevents duplicate items", () => {
    const { result } = renderHook(() => useBasket(), { wrapper });
    act(() => {
      result.current.addItem("prompt-1");
      result.current.addItem("prompt-1");
    });
    expect(result.current.items.filter((i) => i === "prompt-1")).toHaveLength(1);
  });

  it("clears basket", () => {
    const { result } = renderHook(() => useBasket(), { wrapper });
    act(() => {
      result.current.addItem("a");
      result.current.addItem("b");
    });
    act(() => {
      result.current.clearBasket();
    });
    expect(result.current.items).toEqual([]);
  });

  it("checks if item is in basket", () => {
    const { result } = renderHook(() => useBasket(), { wrapper });
    act(() => {
      result.current.addItem("prompt-1");
    });
    expect(result.current.isInBasket("prompt-1")).toBe(true);
    expect(result.current.isInBasket("prompt-2")).toBe(false);
  });
});
