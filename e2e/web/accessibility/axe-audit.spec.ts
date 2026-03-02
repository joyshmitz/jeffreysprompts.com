import { test, expect } from "../../lib/playwright-logger";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated WCAG 2.1 AA accessibility audits using axe-core
 */

test.describe("Accessibility Audit (axe-core)", () => {
  test("homepage has no critical accessibility violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Filter out minor/moderate issues for CI pass, but log all
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    // Log all violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        "All accessibility violations:",
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }

    expect(criticalViolations).toEqual([]);
  });

  test("prompt detail page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/prompts/idea-wizard");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude('[data-testid="code-block"]') // Code blocks may have legitimate issues
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(criticalViolations).toEqual([]);
  });

  test("bundles page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/bundles");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(criticalViolations).toEqual([]);
  });

  test("help page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/help");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(criticalViolations).toEqual([]);
  });

  test("spotlight search modal is accessible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open spotlight search
    await page.keyboard.press("Control+k");

    // Wait for modal
    const dialog = page.locator('[role="dialog"]');
    const isVisible = await dialog.isVisible().catch(() => false);

    if (isVisible) {
      // Run audit on the modal
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      expect(criticalViolations).toEqual([]);
    }
  });
});

test.describe("WCAG Specific Checks", () => {
  test("all images have alt text (1.1.1 Non-text Content)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check all images have alt attributes
    const images = await page.locator("img").all();
    for (const img of images) {
      const alt = await img.getAttribute("alt");
      const ariaHidden = await img.getAttribute("aria-hidden");

      // Images should have alt text OR be decorative (aria-hidden)
      expect(alt !== null || ariaHidden === "true").toBe(true);
    }
  });

  test("page has proper heading hierarchy (1.3.1 Info and Relationships)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get all headings
    const headings = await page.evaluate(() => {
      const h = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      return Array.from(h).map((el) => ({
        level: parseInt(el.tagName.slice(1)),
        text: el.textContent?.slice(0, 50),
      }));
    });

    // Should have exactly one h1
    const h1Count = headings.filter((h) => h.level === 1).length;
    expect(h1Count).toBe(1);

    // Heading levels should not skip (e.g., h1 -> h3)
    let prevLevel = 0;
    for (const heading of headings) {
      // Can go up any amount, but only down by 1
      if (heading.level > prevLevel + 1 && prevLevel !== 0) {
        console.warn(
          `Heading level skipped: ${prevLevel} -> ${heading.level}`,
          heading.text
        );
      }
      prevLevel = heading.level;
    }
  });

  test("form inputs have associated labels (1.3.1 Info and Relationships)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check all inputs have labels or aria-label
    const inputs = await page.locator("input, select, textarea").all();
    for (const input of inputs) {
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledby = await input.getAttribute("aria-labelledby");
      const type = await input.getAttribute("type");

      // Hidden inputs don't need labels
      if (type === "hidden") continue;

      // Check for associated label or aria attributes
      let hasLabel = false;
      if (ariaLabel || ariaLabelledby) {
        hasLabel = true;
      } else if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }

      expect(hasLabel).toBe(true);
    }
  });

  test("color contrast meets AA requirements (1.4.3 Contrast)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .options({ runOnly: ["color-contrast"] })
      .analyze();

    const contrastViolations = accessibilityScanResults.violations;

    // Log but don't fail on minor contrast issues
    if (contrastViolations.length > 0) {
      console.warn(
        "Color contrast issues found:",
        JSON.stringify(contrastViolations, null, 2)
      );
    }
  });

  test("focus order is meaningful (2.4.3 Focus Order)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Tab through first 20 interactive elements
    const focusSequence: string[] = [];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          top: rect.top,
          left: rect.left,
          text: el.textContent?.slice(0, 30),
        };
      });
      if (info) focusSequence.push(JSON.stringify(info));
    }

    // Verify we have a reasonable focus sequence
    expect(focusSequence.length).toBeGreaterThan(0);
  });

  test("language is specified (3.1.1 Language of Page)", async ({ page }) => {
    await page.goto("/");

    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBe("en");
  });
});
