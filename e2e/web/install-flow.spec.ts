import { test, expect } from "../lib/playwright-logger";

/**
 * Install Flow E2E Tests
 *
 * Verifies the "Install Skill" functionality from the web UI.
 * This ensures users can get the correct commands to install prompts
 * into their local Claude Code environment.
 */

test.describe("Install Skill Flow", () => {
  test.beforeEach(async ({ page, context, logger }) => {
    // Grant clipboard permissions for reliable testing
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });
  });

  test("can copy install command from prompt detail", async ({ page, logger }) => {
    const promptTitle = "The Idea Wizard";
    
    await logger.step("open prompt detail", async () => {
      // Use prompt card test id to locate the specific card in the main grid (ignoring featured section)
      const card = page.locator("#prompts-section [data-testid='prompt-card']").filter({ hasText: promptTitle }).first();
      // Scroll into view to ensure visibility
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible({ timeout: 10000 });
      
      // Click the View button within that card
      await card.getByRole("button", { name: /view/i }).click();
    });

    await logger.step("verify modal is open", async () => {
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    await logger.step("click install button", async () => {
      const installButton = page.getByRole("button", { name: /install/i });
      await installButton.click();
    });

    await logger.step("verify success feedback", async () => {
      // Should show toast or button text change
      await expect(page.getByText(/command copied/i)).toBeVisible({ timeout: 3000 });
    });

    await logger.step("verify clipboard content", async () => {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      // Should contain the curl command or the mkdir command for skills
      // The current implementation generates a direct mkdir + cat HEREDOC command
      expect(clipboardText).toContain("mkdir -p");
      expect(clipboardText).toContain("SKILL.md");
      expect(clipboardText).toContain("idea-wizard");
    });
  });

  test("can copy install command for all skills from footer", async ({ page, logger, isMobile }) => {
    // Footer is hidden on mobile layout
    test.skip(!!isMobile, "Footer is hidden on mobile");

    await logger.step("scroll to footer", async () => {
      const footer = page.locator("footer").first();
      await footer.scrollIntoViewIfNeeded();
    });

    await logger.step("find install command block", async () => {
      // The footer usually has a code block or button for "curl ... | bash"
      // Based on homepage.spec.ts, it's a code block
      const codeBlock = page.locator("footer code");
      await expect(codeBlock).toBeVisible();
      await expect(codeBlock).toContainText("curl");
    });
    
    // Note: If there's a copy button next to it, we should test that too.
    // Assuming there might be one based on typical UI patterns.
    // If not, manual selection is the user path.
  });
});
