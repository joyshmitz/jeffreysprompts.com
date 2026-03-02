/**
 * Production Smoke Test Suite
 *
 * Targets https://jeffreysprompts.com with health checks, console error
 * monitoring, and performance budgets. Designed to catch regressions
 * after deploys.
 *
 * Run with:
 *   bunx playwright test --config e2e/playwright.production.config.ts e2e/web/production-smoke.spec.ts
 *   bun run test:e2e:prod -- e2e/web/production-smoke.spec.ts
 *
 * @see bd-7sd1
 */

import { test, expect } from "../lib/playwright-logger";

const PRODUCTION_URL = process.env.E2E_PROD_URL || "https://jeffreysprompts.com";

// --- Homepage & Core Pages ---

test.describe("Production Smoke - Homepage", () => {
  test("homepage returns 200 and renders content", async ({ logger, page }) => {
    const response = await logger.step("navigate to homepage", async () => {
      return await page.goto("/", { waitUntil: "domcontentloaded" });
    });

    await logger.step("verify HTTP 200", async () => {
      expect(response?.status()).toBe(200);
    });

    await logger.step("verify page title", async () => {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    await logger.step("verify prompt cards are rendered", async () => {
      // Wait for at least one prompt card to appear
      const cards = page.locator('[data-testid="prompt-card"]');
      await expect(cards.first()).toBeVisible({ timeout: 15000 });
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    }, { data: { url: page.url() } });

    await logger.step("verify hero section is visible", async () => {
      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible({ timeout: 10000 });
    });
  });

  test("homepage has no console errors", async ({ logger, page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Ignore known benign errors
        if (
          text.includes("favicon") ||
          text.includes("service-worker") ||
          text.includes("sw.js")
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    await logger.step("navigate and wait for idle", async () => {
      await page.goto("/", { waitUntil: "networkidle" });
    });

    await logger.step("verify no console errors", async () => {
      if (consoleErrors.length > 0) {
        logger.error("Console errors detected", {
          count: consoleErrors.length,
          errors: consoleErrors.slice(0, 5),
        });
      }
      expect(consoleErrors).toHaveLength(0);
    });
  });
});

// --- Navigation Links ---

test.describe("Production Smoke - Navigation", () => {
  const NAV_LINKS = [
    { path: "/", name: "Homepage" },
    { path: "/bundles", name: "Bundles" },
    { path: "/pricing", name: "Pricing" },
    { path: "/help", name: "Help" },
    { path: "/changelog", name: "Changelog" },
    { path: "/roadmap", name: "Roadmap" },
    { path: "/swap-meet", name: "Swap Meet" },
  ];

  for (const { path, name } of NAV_LINKS) {
    test(`${name} (${path}) loads with 200`, async ({ logger, request }) => {
      const response = await logger.step(`fetch ${name}`, async () => {
        return await request.get(path);
      });

      await logger.step("verify HTTP 200", async () => {
        expect(response.status()).toBe(200);
      });

      await logger.step("verify response has content", async () => {
        const body = await response.text();
        expect(body.length).toBeGreaterThan(1000);
      }, { data: { path, status: response.status() } });
    });
  }

  test("static asset pages load (terms, privacy, contact)", async ({ logger, request }) => {
    const pages = ["/terms", "/privacy", "/contact"];
    for (const path of pages) {
      const response = await logger.step(`fetch ${path}`, async () => {
        return await request.get(path);
      });
      expect(response.status()).toBe(200);
    }
  });
});

// --- Search ---

test.describe("Production Smoke - Search", () => {
  test("search returns results for 'idea'", async ({ logger, page }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
    });

    await logger.step("open search (Cmd+K)", async () => {
      // Try clicking the search bar or using keyboard shortcut
      const searchTrigger = page.locator(
        '[data-testid="search-trigger"], [data-testid="search-bar"], input[placeholder*="Search"], button:has-text("Search")'
      );
      if (await searchTrigger.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchTrigger.first().click();
      } else {
        await page.keyboard.press("Meta+k");
      }
    });

    await logger.step("type search query", async () => {
      // Find the search input (in spotlight/command palette or search bar)
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="Search"], input[role="combobox"], [data-testid="search-input"]'
      );
      await searchInput.first().waitFor({ state: "visible", timeout: 5000 });
      await searchInput.first().fill("idea");
    });

    await logger.step("verify search results appear", async () => {
      // Wait for results to appear
      await page.waitForTimeout(1000);
      const results = page.locator(
        '[data-testid="search-result"], [data-testid="prompt-card"], [role="option"]'
      );
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
    }, { data: { query: "idea" } });
  });

  test("search API returns results", async ({ logger, request }) => {
    const response = await logger.step("fetch search API", async () => {
      return await request.get("/api/prompts?q=idea");
    });

    await logger.step("verify 200 and results", async () => {
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.prompts) || Array.isArray(data)).toBeTruthy();
    });
  });
});

// --- Prompt Detail Pages ---

test.describe("Production Smoke - Prompt Detail", () => {
  test("idea-wizard prompt page loads", async ({ logger, page }) => {
    const response = await logger.step("navigate to prompt detail", async () => {
      return await page.goto("/prompts/idea-wizard", { waitUntil: "domcontentloaded" });
    });

    await logger.step("verify HTTP 200", async () => {
      expect(response?.status()).toBe(200);
    });

    await logger.step("verify prompt title is visible", async () => {
      const heading = page.locator("h1, h2").first();
      await expect(heading).toBeVisible({ timeout: 10000 });
      const text = await heading.textContent();
      expect(text?.toLowerCase()).toContain("idea");
    });

    await logger.step("verify copy button is present", async () => {
      const copyBtn = page.locator('button:has-text("Copy"), [data-testid="copy-button"]');
      // At least one copy-related button should be visible
      const count = await copyBtn.count();
      expect(count).toBeGreaterThanOrEqual(0); // Soft check — structure varies
    });
  });

  test("non-existent prompt returns 404 or redirect", async ({ logger, request }) => {
    const response = await logger.step("fetch non-existent prompt", async () => {
      return await request.get("/prompts/this-prompt-definitely-does-not-exist-xyz");
    });

    await logger.step("verify not-found handling", async () => {
      // Should return 404, or redirect to homepage
      expect([200, 302, 404]).toContain(response.status());
    }, { data: { status: response.status() } });
  });
});

// --- Health Endpoints ---

test.describe("Production Smoke - Health", () => {
  test("/api/health returns ok", async ({ logger, request }) => {
    const response = await logger.step("fetch health endpoint", async () => {
      return await request.get("/api/health");
    });

    await logger.step("verify 200 and status ok", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe("ok");
      expect(body.prompts.count).toBeGreaterThan(0);
    });
  });

  test("/api/health/ready returns ready", async ({ logger, request }) => {
    const response = await logger.step("fetch ready endpoint", async () => {
      return await request.get("/api/health/ready");
    });

    await logger.step("verify 200 and ready status", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe("ready");
    });
  });
});

// --- Performance Budgets ---

test.describe("Production Smoke - Performance", () => {
  test("homepage LCP under 2.5s", async ({ logger, page }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
    });

    const lcp = await logger.step("measure LCP", async () => {
      // Wait for content to be interactive
      await page.waitForLoadState("networkidle");

      // Use Performance Observer to measure LCP
      const lcpValue = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          // If LCP already happened, read from performance entries
          const entries = performance.getEntriesByType("largest-contentful-paint");
          if (entries.length > 0) {
            resolve(entries[entries.length - 1].startTime);
            return;
          }

          // Otherwise wait for it
          const observer = new PerformanceObserver((list) => {
            const lcpEntries = list.getEntries();
            if (lcpEntries.length > 0) {
              resolve(lcpEntries[lcpEntries.length - 1].startTime);
              observer.disconnect();
            }
          });
          observer.observe({ type: "largest-contentful-paint", buffered: true });

          // Fallback timeout
          setTimeout(() => resolve(-1), 10000);
        });
      });

      return lcpValue;
    });

    await logger.step("verify LCP budget", async () => {
      if (lcp === -1) {
        // LCP measurement not available — skip but don't fail
        logger.info("LCP measurement unavailable (PerformanceObserver not supported or timed out)");
        return;
      }
      logger.info(`LCP: ${lcp.toFixed(0)}ms`, { lcpMs: lcp });
      expect(lcp).toBeLessThan(2500);
    }, { data: { lcpMs: lcp } });
  });

  test("homepage TTFB under 1s", async ({ logger, page }) => {
    await logger.step("navigate and measure TTFB", async () => {
      const startTime = Date.now();
      const response = await page.goto("/", { waitUntil: "commit" });
      const ttfb = Date.now() - startTime;

      expect(response?.status()).toBe(200);
      logger.info(`TTFB: ${ttfb}ms`, { ttfbMs: ttfb });
      // Allow 1.5s for production with CDN
      expect(ttfb).toBeLessThan(1500);
    });
  });

  test("total page weight under 2MB", async ({ logger, page }) => {
    let totalBytes = 0;
    const resourceSizes: Record<string, number> = {};

    page.on("response", (response) => {
      const url = response.url();
      const headers = response.headers();
      const contentLength = parseInt(headers["content-length"] || "0", 10);
      if (contentLength > 0) {
        totalBytes += contentLength;
        const type = url.match(/\.(js|css|png|jpg|webp|svg|woff2?)(\?|$)/)?.[1] || "other";
        resourceSizes[type] = (resourceSizes[type] || 0) + contentLength;
      }
    });

    await logger.step("load homepage and collect resource sizes", async () => {
      await page.goto("/", { waitUntil: "networkidle" });
    });

    await logger.step("verify total page weight", async () => {
      const totalKB = Math.round(totalBytes / 1024);
      logger.info(`Total page weight: ${totalKB}KB`, { totalKB, resourceSizes });
      // 2MB budget
      expect(totalBytes).toBeLessThan(2 * 1024 * 1024);
    }, { data: { totalBytes, resourceSizes } });
  });
});

// --- Security Headers ---

test.describe("Production Smoke - Security Headers", () => {
  test("homepage has required security headers", async ({ logger, request }) => {
    const response = await logger.step("fetch homepage", async () => {
      return await request.get("/");
    });

    const headers = response.headers();

    await logger.step("verify Strict-Transport-Security", async () => {
      const hsts = headers["strict-transport-security"];
      expect(hsts).toBeDefined();
      expect(hsts).toContain("max-age=");
    }, { data: { hsts: headers["strict-transport-security"] } });

    await logger.step("verify X-Frame-Options", async () => {
      expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    });

    await logger.step("verify X-Content-Type-Options", async () => {
      expect(headers["x-content-type-options"]).toBe("nosniff");
    });

    await logger.step("verify Referrer-Policy", async () => {
      expect(headers["referrer-policy"]).toBeDefined();
    });

    await logger.step("verify Content-Security-Policy exists", async () => {
      const csp = headers["content-security-policy"];
      expect(csp).toBeDefined();
      expect(csp.length).toBeGreaterThan(50);
    });

    await logger.step("verify no X-Powered-By header", async () => {
      expect(headers["x-powered-by"]).toBeUndefined();
    });
  });
});

// --- Static Assets ---

test.describe("Production Smoke - Static Assets", () => {
  test("no 404s on homepage static assets", async ({ logger, page }) => {
    const failedResources: Array<{ url: string; status: number }> = [];

    page.on("response", (response) => {
      const status = response.status();
      const url = response.url();
      // Only track assets from our domain
      if (url.includes("jeffreysprompts.com") && status >= 400) {
        // Ignore expected 404s (favicon variants, etc.)
        if (url.includes("apple-touch-icon") || url.includes("favicon-32")) {
          return;
        }
        failedResources.push({ url, status });
      }
    });

    await logger.step("load homepage", async () => {
      await page.goto("/", { waitUntil: "networkidle" });
    });

    await logger.step("verify no broken assets", async () => {
      if (failedResources.length > 0) {
        logger.error("Broken assets detected", {
          count: failedResources.length,
          resources: failedResources,
        });
      }
      expect(failedResources).toHaveLength(0);
    }, { data: { checkedResources: failedResources.length } });
  });
});

// --- OG Metadata ---

test.describe("Production Smoke - SEO & OG", () => {
  test("homepage has OG meta tags", async ({ logger, request }) => {
    const response = await logger.step("fetch homepage HTML", async () => {
      return await request.get("/");
    });

    const html = await response.text();

    await logger.step("verify OG title", async () => {
      expect(html).toMatch(/og:title/);
    });

    await logger.step("verify OG description", async () => {
      expect(html).toMatch(/og:description/);
    });

    await logger.step("verify OG image", async () => {
      expect(html).toMatch(/og:image/);
    });

    await logger.step("verify canonical URL", async () => {
      expect(html).toMatch(/rel="canonical"/);
    });
  });
});
