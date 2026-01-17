# Test Suite Audit: Mocks & Fakes

## Summary
A comprehensive scan of the codebase reveals widespread usage of mocks. While some are necessary for JSDOM environments (platform mocks), others mock core business logic or external libraries, which reduces confidence in the actual integration.

## 1. Critical Violations (Prioritize Refactoring)

These tests mock internal logic or libraries that should be tested via integration or E2E.

| File | Mocked Target | Recommendation |
|------|---------------|----------------|
| `packages/cli/__tests__/commands/login.test.ts` | `loadCredentials` | Refactor to use a temporary config directory and real file I/O. |
| `apps/web/src/components/PromptCard.test.tsx` | `@/lib/clipboard` | Use the real `clipboard.ts` lib; mock only `navigator.clipboard` (Platform). |
| `apps/web/src/components/mobile/SwipeablePromptCard.test.tsx` | `useHaptic`, `useIsMobile`, `use-basket`, `useSwipeHint`, `toast` | **Heavy Mocking**. Delete this unit test and rely on Mobile E2E tests. |
| `apps/web/src/hooks/useFilterState.test.ts` | `next/navigation` | Keep as is for unit test, but ensure E2E covers the actual routing. |

## 2. Platform Mocks (Acceptable in Unit Tests)

These mock browser APIs that do not exist or function realistically in JSDOM/HappyDOM.

| File | Mocked Target | Reason |
|------|---------------|--------|
| `apps/web/src/components/SpotlightSearch.test.tsx` | `navigator.clipboard` | JSDOM lacks clipboard. |
| `apps/web/src/components/PromptGrid.test.tsx` | `navigator.clipboard` | JSDOM lacks clipboard. |
| `apps/web/src/hooks/useIsMobile.test.ts` | `window.matchMedia` | JSDOM lacks layout/media query support. |
| `vitest.setup.ts` | `framer-motion` | JSDOM lacks layout engine for animations. |

## 3. Standard Test Utilities (Acceptable)

- `vi.fn()` for event handler props (e.g., `onClick={vi.fn()}`)
- `vi.useFakeTimers()` for debounce/timeout testing
- `vi.spyOn(console, ...)` for noise suppression

## Action Plan for Refactoring (Task jeffreysprompts.com-l2ji)

1.  **CLI Auth:** Refactor `login.test.ts` to use real config files in a temp dir.
2.  **Clipboard:** Unmock `@/lib/clipboard` in `PromptCard.test.tsx`.
3.  **Mobile Card:** Remove `SwipeablePromptCard.test.tsx` in favor of E2E.
