import { test, expect } from "../../lib/playwright-logger";

/**
 * Screen reader accessibility tests
 * Tests ARIA attributes, announcements, and assistive technology support
 */

test.describe("Screen Reader Support", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("page has proper ARIA landmarks", async ({ page }) => {
    // Check for main landmark
    const main = await page.locator('main, [role="main"]').count();
    expect(main).toBeGreaterThanOrEqual(1);

    // Check for navigation landmark
    const nav = await page.locator('nav, [role="navigation"]').count();
    expect(nav).toBeGreaterThanOrEqual(1);

    // Check for banner (header) landmark
    const header = await page.locator('header, [role="banner"]').count();
    expect(header).toBeGreaterThanOrEqual(1);

    // Check for contentinfo (footer) landmark
    const footer = await page.locator('footer, [role="contentinfo"]').count();
    expect(footer).toBeGreaterThanOrEqual(1);
  });

  test("buttons have accessible names", async ({ page }) => {
    const buttons = await page.locator("button").all();

    for (const button of buttons) {
      const ariaLabel = await button.getAttribute("aria-label");
      const ariaLabelledby = await button.getAttribute("aria-labelledby");
      const textContent = await button.textContent();
      const title = await button.getAttribute("title");

      // Button must have an accessible name
      const hasAccessibleName =
        (textContent && textContent.trim().length > 0) ||
        ariaLabel ||
        ariaLabelledby ||
        title;

      if (!hasAccessibleName) {
        const outerHtml = await button.evaluate((el) => el.outerHTML.slice(0, 200));
        console.warn("Button without accessible name:", outerHtml);
      }

      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test("links have descriptive text", async ({ page }) => {
    const links = await page.locator("a[href]").all();

    for (const link of links) {
      const ariaLabel = await link.getAttribute("aria-label");
      const ariaLabelledby = await link.getAttribute("aria-labelledby");
      const textContent = await link.textContent();

      // Skip empty/hidden links or those with sr-only children
      if (!textContent && !ariaLabel && !ariaLabelledby) {
        const srOnly = await link.locator(".sr-only").count();
        if (srOnly > 0) continue;

        const outerHtml = await link.evaluate((el) => el.outerHTML.slice(0, 200));
        console.warn("Link without accessible text:", outerHtml);
      }

      // Check for generic "click here" or "read more" without context
      if (textContent) {
        const genericPatterns = /^(click here|read more|here|more|link)$/i;
        if (genericPatterns.test(textContent.trim())) {
          console.warn("Generic link text found:", textContent);
        }
      }
    }
  });

  test("decorative icons have aria-hidden", async ({ page }) => {
    // Check SVG icons in buttons (should be aria-hidden)
    const buttonSvgs = await page.locator("button svg").all();

    for (const svg of buttonSvgs) {
      const ariaHidden = await svg.getAttribute("aria-hidden");
      const role = await svg.getAttribute("role");

      // Decorative icons should be hidden or have presentational role
      const isHidden = ariaHidden === "true" || role === "presentation" || role === "img";

      if (!isHidden) {
        const parentButton = await svg.evaluate((el) => el.closest("button")?.outerHTML.slice(0, 150));
        console.warn("Icon may need aria-hidden:", parentButton);
      }
    }
  });

  test("aria-live regions exist for dynamic content", async ({ page }) => {
    // Check for aria-live regions (could be status, polite, or assertive)
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();

    // Page should have at least one live region for toast/status messages
    // This is a soft check - log warning if missing
    if (liveRegions === 0) {
      console.warn("No ARIA live regions found - dynamic content may not be announced");
    }
  });

  test("form error messages are properly associated", async ({ page }) => {
    // Look for any error messages
    const errorMessages = await page.locator('[role="alert"], .error, [data-error]').all();

    for (const error of errorMessages) {
      const id = await error.getAttribute("id");

      // If error has an ID, check if it's referenced by aria-describedby
      if (id) {
        const describedBy = await page.locator(`[aria-describedby*="${id}"]`).count();
        if (describedBy === 0) {
          console.warn("Error message not linked to input via aria-describedby:", id);
        }
      }
    }
  });

  test("images have alt text", async ({ page }) => {
    const images = await page.locator("img").all();

    for (const img of images) {
      const alt = await img.getAttribute("alt");
      const ariaHidden = await img.getAttribute("aria-hidden");
      const role = await img.getAttribute("role");
      const src = await img.getAttribute("src");

      // Image must have alt text OR be explicitly decorative
      const isDecorativeOrHasAlt =
        alt !== null ||
        ariaHidden === "true" ||
        role === "presentation" ||
        role === "none";

      if (!isDecorativeOrHasAlt) {
        console.warn("Image missing alt text:", src?.slice(0, 100));
      }

      expect(isDecorativeOrHasAlt).toBe(true);
    }
  });

  test("tables have proper headers (if present)", async ({ page }) => {
    const tables = await page.locator("table").all();

    for (const table of tables) {
      // Check for th elements
      const headers = await table.locator("th").count();

      // If table has data, it should have headers
      const rows = await table.locator("tr").count();
      if (rows > 1) {
        expect(headers).toBeGreaterThan(0);
      }

      // Check for caption or aria-label
      const caption = await table.locator("caption").count();
      const ariaLabel = await table.getAttribute("aria-label");
      const ariaLabelledby = await table.getAttribute("aria-labelledby");

      if (!caption && !ariaLabel && !ariaLabelledby) {
        console.warn("Table may need caption or aria-label for screen readers");
      }
    }
  });
});

test.describe("ARIA Widget Patterns", () => {
  test("dialogs have proper ARIA attributes", async ({ page }) => {
    await page.goto("/");

    // Open a dialog (e.g., spotlight search)
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const isVisible = await dialog.isVisible().catch(() => false);

    if (isVisible) {
      // Dialog should have aria-modal
      const ariaModal = await dialog.getAttribute("aria-modal");
      expect(ariaModal).toBe("true");

      // Dialog should have aria-labelledby or aria-label
      const ariaLabel = await dialog.getAttribute("aria-label");
      const ariaLabelledby = await dialog.getAttribute("aria-labelledby");
      expect(ariaLabel || ariaLabelledby).toBeTruthy();
    }
  });

  test("combobox search has proper ARIA", async ({ page }) => {
    await page.goto("/");

    // Open spotlight search
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);

    const combobox = page.locator('[role="combobox"]');
    const isVisible = await combobox.isVisible().catch(() => false);

    if (isVisible) {
      // Combobox should have aria-expanded
      const ariaExpanded = await combobox.getAttribute("aria-expanded");
      expect(ariaExpanded).toBeTruthy();

      // Should have aria-controls pointing to listbox
      const ariaControls = await combobox.getAttribute("aria-controls");
      expect(ariaControls).toBeTruthy();

      // Should have aria-autocomplete
      const ariaAutocomplete = await combobox.getAttribute("aria-autocomplete");
      expect(ariaAutocomplete).toBeTruthy();
    }
  });

  test("toggle buttons have aria-pressed", async ({ page }) => {
    await page.goto("/");

    // Find toggle buttons (e.g., theme toggle, filter toggles)
    const toggles = await page.locator('button[aria-pressed], [role="switch"]').all();

    for (const toggle of toggles) {
      const ariaPressed = await toggle.getAttribute("aria-pressed");
      const ariaChecked = await toggle.getAttribute("aria-checked");

      // Toggle should indicate state
      expect(ariaPressed !== null || ariaChecked !== null).toBe(true);
    }
  });
});
