import { test, expect } from "../lib/playwright-logger";

/**
 * SpotlightSearch E2E Tests
 *
 * Tests the Cmd+K spotlight search modal:
 * 1. Open with keyboard shortcut
 * 2. Type to search
 * 3. Navigate with arrow keys
 * 4. Select with Enter to copy
 * 5. Close with Escape
 */

test.describe("SpotlightSearch", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });
  });

  test("opens with Cmd+K keyboard shortcut", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    await logger.step("verify dialog and focus", async () => {
      const dialog = page.getByRole("dialog", { name: /search prompts/i });
      await expect(dialog).toBeVisible({ timeout: 2000 });
      const searchInput = dialog.getByRole("combobox");
      await expect(searchInput).toBeFocused();
    });
  });

  test("opens with Ctrl+K on Windows/Linux", async ({ page, logger }) => {
    await logger.step("open spotlight (ctrl+k)", async () => {
      await page.keyboard.press("Control+k");
    });

    await logger.step("verify dialog visible", async () => {
      const dialog = page.getByRole("dialog", { name: /search prompts/i });
      await expect(dialog).toBeVisible({ timeout: 2000 });
    });
  });

  test("closes with Escape key", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("ensure dialog visible", async () => {
      await expect(dialog).toBeVisible();
      const searchInput = dialog.getByRole("combobox");
      await expect(searchInput).toBeFocused();
    });

    await logger.step("close with escape", async () => {
      await page.keyboard.press("Escape");
    });

    await logger.step("verify dialog closed", async () => {
      await expect(dialog).not.toBeVisible({ timeout: 2000 });
    });
  });

  test("closes when clicking backdrop", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("dialog visible", async () => {
      await expect(dialog).toBeVisible();
    });

    await logger.step("click backdrop", async () => {
      await page.locator("body").click({ position: { x: 10, y: 10 } });
    });

    await logger.step("dialog closed", async () => {
      await expect(dialog).not.toBeVisible();
    });
  });

  test("typing shows search results", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("type query", async () => {
      const searchInput = dialog.getByRole("combobox");
      await expect(searchInput).toBeFocused();
      await searchInput.fill("wizard");
    });

    await logger.step("wait for debounce", async () => {
      await page.waitForTimeout(300);
    });

    await logger.step("verify results", async () => {
      const resultsList = dialog.locator("#spotlight-results");
      await expect(resultsList).toBeVisible();
      await expect(dialog.getByText("The Idea Wizard")).toBeVisible({ timeout: 2000 });
    });
  });

  test("arrow keys navigate results", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("search for wizard", async () => {
      const searchInput = dialog.getByRole("combobox");
      await searchInput.fill("wizard");
      await page.waitForTimeout(300);
    });

    await logger.step("navigate with arrow keys", async () => {
      const selectedItem = dialog.locator('[role="option"][aria-selected="true"]');
      await expect(selectedItem).toBeVisible({ timeout: 2000 });
      await page.keyboard.press("ArrowDown");
      await expect(dialog.locator('[role="option"][aria-selected="true"]')).toBeVisible();
    });
  });

  test("Enter key copies selected prompt", async ({ page, context, logger }) => {
    await logger.step("grant clipboard permissions", async () => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    });

    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("search and select", async () => {
      const searchInput = dialog.getByRole("combobox");
      await searchInput.fill("idea wizard");
      await page.waitForTimeout(300);
      await page.keyboard.press("Enter");
    });

    await logger.step("verify copied feedback", async () => {
      await expect(page.getByText(/copied/i).first()).toBeVisible({ timeout: 2000 });
    });
  });

  test("shows 'No results' for empty search", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("type nonsense query", async () => {
      const searchInput = dialog.getByRole("combobox");
      await searchInput.fill("xyznonexistent123456789");
      await page.waitForTimeout(300);
    });

    await logger.step("verify no results", async () => {
      await expect(dialog.getByText(/no results/i)).toBeVisible();
    });
  });

  test("clicking result item selects it", async ({ page, context, logger }) => {
    await logger.step("grant clipboard permissions", async () => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    });

    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("search and click result", async () => {
      const searchInput = dialog.getByRole("combobox");
      await searchInput.fill("wizard");
      await page.waitForTimeout(300);
      await dialog.locator("[data-result-item]").first().click();
    });

    await logger.step("verify copied feedback", async () => {
      await expect(page.getByText(/copied/i).first()).toBeVisible({ timeout: 2000 });
    });
  });
});

test.describe("SpotlightSearch Accessibility", () => {
  test("has proper ARIA attributes", async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });

    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    await logger.step("verify dialog attributes", async () => {
      const dialog = page.getByRole("dialog", { name: /search prompts/i });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("aria-modal", "true");

      const searchInput = dialog.getByRole("combobox");
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute("aria-autocomplete", "list");
    });
  });

  test("listbox has proper structure", async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });

    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("search for wizard", async () => {
      const searchInput = dialog.getByRole("combobox");
      await searchInput.fill("wizard");
      await page.waitForTimeout(300);
    });

    await logger.step("verify listbox options", async () => {
      const listbox = dialog.getByRole("listbox");
      await expect(listbox).toBeVisible();
      const options = dialog.locator('[role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});

test.describe("SpotlightSearch Semantic Toggle", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage and navigate", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.removeItem("jfp-semantic-search"));
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("semantic toggle button exists in spotlight", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("verify toggle button visible", async () => {
      await expect(dialog).toBeVisible();
      const semanticToggle = dialog.getByLabel(/toggle semantic search/i);
      await expect(semanticToggle).toBeVisible();
    });
  });

  test("clicking toggle changes aria-pressed state", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    await logger.step("get initial state", async () => {
      await expect(dialog).toBeVisible();
    });

    const semanticToggle = dialog.getByLabel(/toggle semantic search/i);

    await logger.step("verify initial aria-pressed state", async () => {
      const initialPressed = await semanticToggle.getAttribute("aria-pressed");
      // Default is false (BM25 mode)
      expect(initialPressed).toBe("false");
    });

    await logger.step("click toggle to enable semantic mode", async () => {
      await semanticToggle.click();
    });

    await logger.step("verify aria-pressed changed to true", async () => {
      await expect(semanticToggle).toHaveAttribute("aria-pressed", "true");
    });

    await logger.step("click toggle again to disable", async () => {
      await semanticToggle.click();
    });

    await logger.step("verify aria-pressed back to false", async () => {
      await expect(semanticToggle).toHaveAttribute("aria-pressed", "false");
    });
  });

  test("semantic preference persists across sessions", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    const semanticToggle = dialog.getByLabel(/toggle semantic search/i);

    await logger.step("enable semantic mode", async () => {
      await expect(semanticToggle).toBeVisible();
      await semanticToggle.click();
      await expect(semanticToggle).toHaveAttribute("aria-pressed", "true");
    });

    await logger.step("verify localStorage was set", async () => {
      const stored = await page.evaluate(() =>
        localStorage.getItem("jfp-semantic-search")
      );
      expect(stored).toBe("true");
    });

    await logger.step("close spotlight and reload page", async () => {
      await page.keyboard.press("Escape");
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("reopen spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    await logger.step("verify semantic mode persisted", async () => {
      const newDialog = page.getByRole("dialog", { name: /search prompts/i });
      await expect(newDialog).toBeVisible();
      const newToggle = newDialog.getByLabel(/toggle semantic search/i);
      await expect(newToggle).toHaveAttribute("aria-pressed", "true");
    });
  });

  test("toggle has accessible title attribute", async ({ page, logger }) => {
    await logger.step("open spotlight", async () => {
      await page.keyboard.press("Meta+k");
    });

    const dialog = page.getByRole("dialog", { name: /search prompts/i });
    const semanticToggle = dialog.getByLabel(/toggle semantic search/i);

    await logger.step("verify title when disabled", async () => {
      await expect(semanticToggle).toBeVisible();
      const title = await semanticToggle.getAttribute("title");
      expect(title).toMatch(/semantic/i);
    });

    await logger.step("enable and verify title changes", async () => {
      await semanticToggle.click();
      const newTitle = await semanticToggle.getAttribute("title");
      expect(newTitle).toMatch(/semantic.*enabled/i);
    });
  });
});
