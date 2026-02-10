/**
 * Unit tests for SEO sitemap generation
 * Tests static routes, prompt routes, bundle routes, and XML generation.
 */

import { describe, it, expect } from "vitest";
import {
  getStaticRoutes,
  getPromptRoutes,
  getBundleRoutes,
  getAllSitemapEntries,
  getSitemapPageCount,
  getSitemapPage,
  buildSitemapXml,
  SITE_URL,
  MAX_URLS_PER_SITEMAP,
} from "./sitemap";

describe("constants", () => {
  it("SITE_URL is the production domain", () => {
    expect(SITE_URL).toBe("https://jeffreysprompts.com");
  });

  it("MAX_URLS_PER_SITEMAP is 50000", () => {
    expect(MAX_URLS_PER_SITEMAP).toBe(50000);
  });
});

describe("getStaticRoutes", () => {
  it("returns an array of sitemap entries", () => {
    const routes = getStaticRoutes();
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
  });

  it("all URLs start with SITE_URL", () => {
    const routes = getStaticRoutes();
    for (const route of routes) {
      expect(route.url).toMatch(/^https:\/\/jeffreysprompts\.com/);
    }
  });

  it("includes the homepage with priority 1.0", () => {
    const routes = getStaticRoutes();
    const homepage = routes.find((r) => r.url === "https://jeffreysprompts.com/");
    expect(homepage).toBeDefined();
    expect(homepage?.priority).toBe(1.0);
  });

  it("includes pricing page", () => {
    const routes = getStaticRoutes();
    expect(routes.some((r) => r.url.includes("/pricing"))).toBe(true);
  });

  it("each entry has lastModified, changeFrequency, and priority", () => {
    const routes = getStaticRoutes();
    for (const route of routes) {
      expect(route.lastModified).toBeDefined();
      expect(route.changeFrequency).toBeDefined();
      expect(typeof route.priority).toBe("number");
    }
  });

  it("includes help pages", () => {
    const routes = getStaticRoutes();
    const helpRoutes = routes.filter((r) => r.url.includes("/help"));
    expect(helpRoutes.length).toBeGreaterThan(0);
  });

  it("includes legal pages", () => {
    const routes = getStaticRoutes();
    expect(routes.some((r) => r.url.includes("/privacy"))).toBe(true);
    expect(routes.some((r) => r.url.includes("/terms"))).toBe(true);
  });
});

describe("getPromptRoutes", () => {
  it("returns an array", () => {
    const routes = getPromptRoutes();
    expect(Array.isArray(routes)).toBe(true);
  });

  it("generates routes from the prompt registry", () => {
    const routes = getPromptRoutes();
    expect(routes.length).toBeGreaterThan(0);
  });

  it("all prompt URLs match /prompts/<id> pattern", () => {
    const routes = getPromptRoutes();
    for (const route of routes) {
      expect(route.url).toMatch(/\/prompts\/.+/);
    }
  });

  it("prompt routes have weekly changeFrequency", () => {
    const routes = getPromptRoutes();
    for (const route of routes) {
      expect(route.changeFrequency).toBe("weekly");
    }
  });
});

describe("getBundleRoutes", () => {
  it("returns an array", () => {
    const routes = getBundleRoutes();
    expect(Array.isArray(routes)).toBe(true);
  });

  it("generates routes from bundles", () => {
    const routes = getBundleRoutes();
    expect(routes.length).toBeGreaterThan(0);
  });

  it("bundle URLs match /bundles/<id> pattern", () => {
    const routes = getBundleRoutes();
    for (const route of routes) {
      expect(route.url).toMatch(/\/bundles\/.+/);
    }
  });
});

describe("getAllSitemapEntries", () => {
  it("combines static, prompt, and bundle routes", () => {
    const all = getAllSitemapEntries();
    const staticCount = getStaticRoutes().length;
    const promptCount = getPromptRoutes().length;
    const bundleCount = getBundleRoutes().length;
    expect(all.length).toBe(staticCount + promptCount + bundleCount);
  });
});

describe("getSitemapPageCount", () => {
  it("returns at least 1", () => {
    expect(getSitemapPageCount()).toBeGreaterThanOrEqual(1);
  });
});

describe("getSitemapPage", () => {
  it("page 0 returns entries", () => {
    const page = getSitemapPage(0);
    expect(page.length).toBeGreaterThan(0);
  });

  it("out-of-range page returns empty", () => {
    const page = getSitemapPage(999);
    expect(page.length).toBe(0);
  });
});

describe("buildSitemapXml", () => {
  it("generates valid XML header", () => {
    const xml = buildSitemapXml([
      { url: "https://example.com/", changeFrequency: "daily", priority: 1.0 },
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
  });

  it("includes loc elements", () => {
    const xml = buildSitemapXml([
      { url: "https://example.com/page", changeFrequency: "weekly", priority: 0.5 },
    ]);
    expect(xml).toContain("<loc>https://example.com/page</loc>");
  });

  it("includes changefreq when present", () => {
    const xml = buildSitemapXml([
      { url: "https://example.com/", changeFrequency: "monthly", priority: 0.5 },
    ]);
    expect(xml).toContain("<changefreq>monthly</changefreq>");
  });

  it("includes priority formatted to one decimal", () => {
    const xml = buildSitemapXml([
      { url: "https://example.com/", priority: 0.8 },
    ]);
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("escapes special XML characters in URLs", () => {
    const xml = buildSitemapXml([
      { url: "https://example.com/?a=1&b=2" },
    ]);
    expect(xml).toContain("&amp;");
    expect(xml).not.toContain("?a=1&b=2</loc>");
  });

  it("handles empty entries", () => {
    const xml = buildSitemapXml([]);
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
  });

  it("includes lastmod when provided", () => {
    const xml = buildSitemapXml([
      { url: "https://example.com/", lastModified: new Date("2026-01-01") },
    ]);
    expect(xml).toContain("<lastmod>");
    expect(xml).toContain("2026");
  });
});
