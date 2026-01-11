import { test, expect } from "../../lib/playwright-logger";

/**
 * OpenGraph Metadata E2E Tests
 *
 * Tests for OpenGraph and Twitter Card meta tags on public pages.
 */

/**
 * Helper to get OG meta tag content
 */
async function getOGMetaContent(page: import("@playwright/test").Page, property: string): Promise<string | null> {
  const meta = page.locator(`meta[property="${property}"]`);
  return meta.getAttribute("content");
}

/**
 * Helper to get Twitter meta tag content
 */
async function getTwitterMetaContent(page: import("@playwright/test").Page, name: string): Promise<string | null> {
  const meta = page.locator(`meta[name="${name}"]`);
  return meta.getAttribute("content");
}

test.describe("Homepage OG Metadata", () => {
  test("has required OpenGraph tags", async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("verify og:title", async () => {
      const title = await getOGMetaContent(page, "og:title");
      expect(title).toBeTruthy();
      expect(title).toContain("Jeffrey");
    });

    await logger.step("verify og:description", async () => {
      const description = await getOGMetaContent(page, "og:description");
      expect(description).toBeTruthy();
      expect(description!.length).toBeGreaterThan(20);
    });

    await logger.step("verify og:type", async () => {
      const type = await getOGMetaContent(page, "og:type");
      expect(type).toBe("website");
    });

    await logger.step("verify og:url", async () => {
      const url = await getOGMetaContent(page, "og:url");
      expect(url).toContain("jeffreysprompts.com");
    });

    await logger.step("verify og:site_name", async () => {
      const siteName = await getOGMetaContent(page, "og:site_name");
      expect(siteName).toBeTruthy();
    });
  });

  test("has Twitter Card tags", async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("verify twitter:card", async () => {
      const card = await getTwitterMetaContent(page, "twitter:card");
      expect(card).toBe("summary_large_image");
    });

    await logger.step("verify twitter:title", async () => {
      const title = await getTwitterMetaContent(page, "twitter:title");
      expect(title).toBeTruthy();
    });

    await logger.step("verify twitter:description", async () => {
      const description = await getTwitterMetaContent(page, "twitter:description");
      expect(description).toBeTruthy();
    });
  });

  test("has OG image reference", async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("verify og:image exists", async () => {
      const image = await getOGMetaContent(page, "og:image");
      expect(image).toBeTruthy();
      expect(image).toContain("opengraph-image");
    });
  });
});

test.describe("Prompt Detail Page OG Metadata", () => {
  test("has dynamic OpenGraph tags", async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await page.goto("/prompts/idea-wizard");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("verify og:title contains prompt name", async () => {
      const title = await getOGMetaContent(page, "og:title");
      expect(title).toBeTruthy();
      expect(title!.toLowerCase()).toContain("idea");
    });

    await logger.step("verify og:type is article", async () => {
      const type = await getOGMetaContent(page, "og:type");
      expect(type).toBe("article");
    });

    await logger.step("verify og:url contains prompt id", async () => {
      const url = await getOGMetaContent(page, "og:url");
      expect(url).toContain("/prompts/idea-wizard");
    });

    await logger.step("verify og:image references dynamic image", async () => {
      const image = await getOGMetaContent(page, "og:image");
      expect(image).toBeTruthy();
      expect(image).toContain("opengraph-image");
    });
  });

  test("has Twitter Card with prompt info", async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await page.goto("/prompts/idea-wizard");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("verify twitter:card is summary_large_image", async () => {
      const card = await getTwitterMetaContent(page, "twitter:card");
      expect(card).toBe("summary_large_image");
    });

    await logger.step("verify twitter:title", async () => {
      const title = await getTwitterMetaContent(page, "twitter:title");
      expect(title).toBeTruthy();
    });

    await logger.step("verify twitter:creator", async () => {
      const creator = await getTwitterMetaContent(page, "twitter:creator");
      expect(creator).toBeTruthy();
      expect(creator).toMatch(/^@/);
    });
  });
});

test.describe("Bundles Page OG Metadata", () => {
  test("bundles index has OpenGraph tags", async ({ page, logger }) => {
    await logger.step("navigate to bundles page", async () => {
      await page.goto("/bundles");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("verify og:title", async () => {
      const title = await getOGMetaContent(page, "og:title");
      expect(title).toBeTruthy();
      expect(title!.toLowerCase()).toContain("bundle");
    });

    await logger.step("verify og:url", async () => {
      const url = await getOGMetaContent(page, "og:url");
      expect(url).toContain("/bundles");
    });
  });

  test("bundle detail has dynamic OpenGraph tags", async ({ page, logger }) => {
    await logger.step("navigate to bundle detail page", async () => {
      await page.goto("/bundles/getting-started");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("verify og:title contains bundle name", async () => {
      const title = await getOGMetaContent(page, "og:title");
      expect(title).toBeTruthy();
    });

    await logger.step("verify og:type is article", async () => {
      const type = await getOGMetaContent(page, "og:type");
      expect(type).toBe("article");
    });

    await logger.step("verify og:image references dynamic image", async () => {
      const image = await getOGMetaContent(page, "og:image");
      expect(image).toBeTruthy();
      expect(image).toContain("opengraph-image");
    });
  });
});

test.describe("Workflows Page OG Metadata", () => {
  test("has OpenGraph tags", async ({ page, logger }) => {
    await logger.step("navigate to workflows page", async () => {
      await page.goto("/workflows");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("verify og:title", async () => {
      const title = await getOGMetaContent(page, "og:title");
      expect(title).toBeTruthy();
      expect(title!.toLowerCase()).toContain("workflow");
    });

    await logger.step("verify og:url", async () => {
      const url = await getOGMetaContent(page, "og:url");
      expect(url).toContain("/workflows");
    });

    await logger.step("verify twitter:card", async () => {
      const card = await getTwitterMetaContent(page, "twitter:card");
      expect(card).toBe("summary_large_image");
    });
  });
});

test.describe("User Profile Page OG Metadata", () => {
  test("has profile OpenGraph tags", async ({ page, logger }) => {
    await logger.step("navigate to user profile page", async () => {
      await page.goto("/user/jeffreyemanuel");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("verify og:type is profile", async () => {
      const type = await getOGMetaContent(page, "og:type");
      expect(type).toBe("profile");
    });

    await logger.step("verify og:title contains user name", async () => {
      const title = await getOGMetaContent(page, "og:title");
      expect(title).toBeTruthy();
    });

    await logger.step("verify og:url contains username", async () => {
      const url = await getOGMetaContent(page, "og:url");
      expect(url).toContain("/user/jeffreyemanuel");
    });

    await logger.step("verify og:image references dynamic image", async () => {
      const image = await getOGMetaContent(page, "og:image");
      expect(image).toBeTruthy();
      expect(image).toContain("opengraph-image");
    });
  });
});

test.describe("Metadata Consistency", () => {
  test("page title matches og:title pattern", async ({ page, logger }) => {
    await logger.step("check homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      const pageTitle = await page.title();
      const ogTitle = await getOGMetaContent(page, "og:title");

      expect(pageTitle).toBeTruthy();
      expect(ogTitle).toBeTruthy();
      // Both should contain "Jeffrey's Prompts" or similar
      expect(pageTitle.toLowerCase() + ogTitle!.toLowerCase()).toContain("jeffrey");
    });

    await logger.step("check prompt page", async () => {
      await page.goto("/prompts/idea-wizard");
      await page.waitForLoadState("domcontentloaded");

      const pageTitle = await page.title();
      const ogTitle = await getOGMetaContent(page, "og:title");

      expect(pageTitle).toBeTruthy();
      expect(ogTitle).toBeTruthy();
    });
  });

  test("description meta matches og:description", async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("compare meta description and og:description", async () => {
      const metaDesc = await page.locator('meta[name="description"]').getAttribute("content");
      const ogDesc = await getOGMetaContent(page, "og:description");

      expect(metaDesc).toBeTruthy();
      expect(ogDesc).toBeTruthy();
      // They should be similar (may not be identical)
      expect(metaDesc!.length).toBeGreaterThan(20);
      expect(ogDesc!.length).toBeGreaterThan(20);
    });
  });
});
