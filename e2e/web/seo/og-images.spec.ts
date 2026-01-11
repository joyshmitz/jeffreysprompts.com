import { test, expect } from "../../lib/playwright-logger";

/**
 * OpenGraph Image Endpoint E2E Tests
 *
 * Tests for OG image generation endpoints returning valid images.
 */

test.describe("Homepage OG Image", () => {
  test("opengraph-image endpoint returns PNG", async ({ page, logger }) => {
    await logger.step("fetch homepage OG image", async () => {
      const response = await page.goto("/opengraph-image");

      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);

      const contentType = response!.headers()["content-type"];
      expect(contentType).toContain("image/png");
    });
  });

  test("twitter-image endpoint returns PNG", async ({ page, logger }) => {
    await logger.step("fetch homepage Twitter image", async () => {
      const response = await page.goto("/twitter-image");

      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);

      const contentType = response!.headers()["content-type"];
      expect(contentType).toContain("image/png");
    });
  });
});

test.describe("Prompt OG Images", () => {
  test("prompt OG image returns PNG for valid prompt", async ({ page, logger }) => {
    await logger.step("fetch prompt OG image", async () => {
      const response = await page.goto("/prompts/idea-wizard/opengraph-image");

      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);

      const contentType = response!.headers()["content-type"];
      expect(contentType).toContain("image/png");
    });
  });

  test("prompt OG image handles missing prompt gracefully", async ({ page, logger }) => {
    await logger.step("fetch OG image for non-existent prompt", async () => {
      const response = await page.goto("/prompts/non-existent-prompt-xyz/opengraph-image");

      // Should still return an image (fallback) rather than error
      expect(response).not.toBeNull();
      // Either 200 with fallback or 404
      const status = response!.status();
      expect([200, 404]).toContain(status);

      if (status === 200) {
        const contentType = response!.headers()["content-type"];
        expect(contentType).toContain("image/png");
      }
    });
  });
});

test.describe("Bundle OG Images", () => {
  test("bundles index OG image returns PNG", async ({ page, logger }) => {
    await logger.step("fetch bundles OG image", async () => {
      const response = await page.goto("/bundles/opengraph-image");

      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);

      const contentType = response!.headers()["content-type"];
      expect(contentType).toContain("image/png");
    });
  });

  test("bundle detail OG image returns PNG", async ({ page, logger }) => {
    await logger.step("fetch bundle detail OG image", async () => {
      const response = await page.goto("/bundles/getting-started/opengraph-image");

      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);

      const contentType = response!.headers()["content-type"];
      expect(contentType).toContain("image/png");
    });
  });
});

test.describe("Workflows OG Image", () => {
  test("workflows OG image returns PNG", async ({ page, logger }) => {
    await logger.step("fetch workflows OG image", async () => {
      const response = await page.goto("/workflows/opengraph-image");

      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);

      const contentType = response!.headers()["content-type"];
      expect(contentType).toContain("image/png");
    });
  });
});

test.describe("User Profile OG Images", () => {
  test("user profile OG image returns PNG", async ({ page, logger }) => {
    await logger.step("fetch user profile OG image", async () => {
      const response = await page.goto("/user/jeffreyemanuel/opengraph-image");

      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);

      const contentType = response!.headers()["content-type"];
      expect(contentType).toContain("image/png");
    });
  });

  test("handles unknown user gracefully", async ({ page, logger }) => {
    await logger.step("fetch OG image for unknown user", async () => {
      const response = await page.goto("/user/unknown-user-xyz/opengraph-image");

      expect(response).not.toBeNull();
      // Should still return an image (fallback) or 404
      const status = response!.status();
      expect([200, 404]).toContain(status);

      if (status === 200) {
        const contentType = response!.headers()["content-type"];
        expect(contentType).toContain("image/png");
      }
    });
  });
});

test.describe("OG Image Dimensions", () => {
  test("homepage OG image has correct dimensions", async ({ page, logger }) => {
    await logger.step("verify OG image dimensions via meta tag", async () => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      // Check for og:image:width and og:image:height
      const widthMeta = page.locator('meta[property="og:image:width"]');
      const heightMeta = page.locator('meta[property="og:image:height"]');

      // If dimensions are specified in meta
      const width = await widthMeta.getAttribute("content").catch(() => null);
      const height = await heightMeta.getAttribute("content").catch(() => null);

      if (width && height) {
        expect(parseInt(width)).toBe(1200);
        expect(parseInt(height)).toBe(630);
      }
    });
  });
});

test.describe("OG Image Caching", () => {
  test("OG image has cache headers", async ({ page, logger }) => {
    await logger.step("check cache headers on OG image", async () => {
      const response = await page.goto("/opengraph-image");

      expect(response).not.toBeNull();

      const headers = response!.headers();

      // Should have some form of caching
      const cacheControl = headers["cache-control"];
      const etag = headers["etag"];

      // At minimum, should have cache-control or etag
      const hasCaching = cacheControl !== undefined || etag !== undefined;
      expect(hasCaching).toBe(true);

      logger.info(`Cache-Control: ${cacheControl ?? "not set"}`);
      logger.info(`ETag: ${etag ?? "not set"}`);
    });
  });
});

test.describe("OG Image Integration with Page", () => {
  test("og:image URL is accessible from page metadata", async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
    });

    await logger.step("extract og:image URL", async () => {
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
      expect(ogImage).toBeTruthy();

      logger.info(`OG Image URL: ${ogImage}`);
    });

    await logger.step("verify og:image URL is fetchable", async () => {
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");

      if (ogImage) {
        // Convert relative URL to absolute if needed
        const imageUrl = ogImage.startsWith("http") ? ogImage : new URL(ogImage, page.url()).href;

        const imageResponse = await page.goto(imageUrl);
        expect(imageResponse).not.toBeNull();
        expect(imageResponse!.status()).toBe(200);
      }
    });
  });

  test("prompt page og:image is dynamic", async ({ page, logger }) => {
    await logger.step("check first prompt OG image", async () => {
      await page.goto("/prompts/idea-wizard");
      await page.waitForLoadState("domcontentloaded");

      const ogImage1 = await page.locator('meta[property="og:image"]').getAttribute("content");
      expect(ogImage1).toContain("idea-wizard");
    });

    await logger.step("check second prompt OG image is different", async () => {
      await page.goto("/prompts/readme-reviser");
      await page.waitForLoadState("domcontentloaded");

      const ogImage2 = await page.locator('meta[property="og:image"]').getAttribute("content");
      expect(ogImage2).toContain("readme-reviser");
    });
  });
});
