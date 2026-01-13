/**
 * Integration tests for SEO outputs
 * Validates sitemap generation, robots.txt, and URL structure
 */

import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

// Path to public directory (works in both dev and CI)
const publicDir = path.resolve(__dirname, "../../../../public");

describe("SEO Outputs", () => {
  describe("Sitemap", () => {
    let sitemapContent: string;
    let sitemapUrls: string[];

    beforeAll(() => {
      const sitemapPath = path.join(publicDir, "sitemap.xml");
      expect(fs.existsSync(sitemapPath)).toBe(true);
      sitemapContent = fs.readFileSync(sitemapPath, "utf-8");

      // Extract all URLs from sitemap
      const locRegex = /<loc>([^<]+)<\/loc>/g;
      sitemapUrls = [];
      let match;
      while ((match = locRegex.exec(sitemapContent)) !== null) {
        sitemapUrls.push(match[1]);
      }
    });

    it("should have valid XML structure", () => {
      expect(sitemapContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemapContent).toContain("<urlset");
      expect(sitemapContent).toContain("</urlset>");
    });

    it("should include sitemap namespaces", () => {
      expect(sitemapContent).toContain("http://www.sitemaps.org/schemas/sitemap/0.9");
    });

    it("should contain homepage with priority 1", () => {
      expect(sitemapContent).toContain("<loc>https://jeffreysprompts.com</loc>");
      // Find the homepage entry and verify priority
      const homepageMatch = sitemapContent.match(
        /<url><loc>https:\/\/jeffreysprompts\.com<\/loc>.*?<priority>([^<]+)<\/priority>.*?<\/url>/s
      );
      expect(homepageMatch).not.toBeNull();
      expect(homepageMatch?.[1]).toBe("1");
    });

    it("should contain key pages", () => {
      const requiredPages = [
        "https://jeffreysprompts.com",
        "https://jeffreysprompts.com/bundles",
        "https://jeffreysprompts.com/workflows",
        "https://jeffreysprompts.com/help",
        "https://jeffreysprompts.com/pricing",
      ];

      for (const page of requiredPages) {
        expect(sitemapUrls).toContain(page);
      }
    });

    it("should contain prompt pages", () => {
      const promptUrls = sitemapUrls.filter(url => url.includes("/prompts/"));
      expect(promptUrls.length).toBeGreaterThan(10);
    });

    it("should have valid lastmod dates", () => {
      const lastmodRegex = /<lastmod>([^<]+)<\/lastmod>/g;
      let match;
      while ((match = lastmodRegex.exec(sitemapContent)) !== null) {
        const date = new Date(match[1]);
        expect(date.getTime()).not.toBeNaN();
      }
    });

    it("should have valid priority values", () => {
      const priorityRegex = /<priority>([^<]+)<\/priority>/g;
      let match;
      while ((match = priorityRegex.exec(sitemapContent)) !== null) {
        const priority = parseFloat(match[1]);
        expect(priority).toBeGreaterThanOrEqual(0);
        expect(priority).toBeLessThanOrEqual(1);
      }
    });

    it("should not include admin or API routes", () => {
      const blockedPatterns = ["/admin/", "/api/", "/_next/"];
      for (const url of sitemapUrls) {
        for (const pattern of blockedPatterns) {
          expect(url).not.toContain(pattern);
        }
      }
    });

    it("should have consistent domain", () => {
      for (const url of sitemapUrls) {
        expect(url).toMatch(/^https:\/\/jeffreysprompts\.com/);
      }
    });
  });

  describe("robots.txt", () => {
    let robotsContent: string;

    beforeAll(() => {
      const robotsPath = path.join(publicDir, "robots.txt");
      expect(fs.existsSync(robotsPath)).toBe(true);
      robotsContent = fs.readFileSync(robotsPath, "utf-8");
    });

    it("should reference sitemap", () => {
      expect(robotsContent).toContain("Sitemap: https://jeffreysprompts.com/sitemap.xml");
    });

    it("should allow crawling of public content", () => {
      expect(robotsContent).toContain("User-agent: *");
      expect(robotsContent).toContain("Allow: /");
    });

    it("should block sensitive paths", () => {
      expect(robotsContent).toContain("Disallow: /api/");
      expect(robotsContent).toContain("Disallow: /_next/");
      expect(robotsContent).toContain("Disallow: /admin/");
    });

    it("should specify host", () => {
      expect(robotsContent).toContain("Host: https://jeffreysprompts.com");
    });
  });
});
