/**
 * Focus management utilities for WCAG 2.1.2 (No Keyboard Trap) and 2.4.3 (Focus Order)
 */

/**
 * All focusable element selectors
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * Get all focusable elements within a container.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
    .filter((el) => {
      // Filter out hidden elements (offsetParent fails for fixed-position elements)
      const style = window.getComputedStyle(el);
      const isVisible = style.display !== "none" && style.visibility !== "hidden";
      const hasLayout = el.getClientRects().length > 0;
      return hasLayout &&
             isVisible &&
             !el.hasAttribute('aria-hidden') &&
             el.getAttribute('tabindex') !== '-1';
    });
}

/**
 * Create a focus trap within a container.
 * Returns a cleanup function to remove the trap.
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   if (isOpen && containerRef.current) {
 *     return focusTrap(containerRef.current);
 *   }
 * }, [isOpen]);
 * ```
 */
export function focusTrap(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];

  // Store previously focused element to restore later
  const previouslyFocused = document.activeElement as HTMLElement;

  // Focus first element
  firstElement?.focus();

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: if on first element, go to last
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      // Tab: if on last element, go to first
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    // Restore focus to previously focused element
    previouslyFocused?.focus();
  };
}

/**
 * Move focus to an element programmatically.
 * Handles scroll-into-view and ensures visibility.
 */
export function moveFocusTo(
  element: HTMLElement | null,
  options: { scroll?: boolean; preventScroll?: boolean } = {}
): void {
  if (!element) return;

  const target = element;
  const { scroll = true, preventScroll = false } = options;

  // Make element focusable if it isn't
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
  }

  target.focus({ preventScroll });

  if (scroll && !preventScroll) {
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Move focus to the first error in a form.
 * For WCAG 3.3.1 (Error Identification).
 */
export function focusFirstError(form: HTMLFormElement): void {
  const errorElements = form.querySelectorAll<HTMLElement>(
    '[aria-invalid="true"], .error, [data-error="true"]'
  );

  const firstError = errorElements[0];
  if (firstError) {
    moveFocusTo(firstError);
  }
}

/**
 * Get the currently focused element, handling shadow DOM.
 */
export function getActiveElement(): Element | null {
  let active = document.activeElement;

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active;
}
