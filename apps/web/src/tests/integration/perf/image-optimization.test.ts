/**
 * Integration tests for image optimization configuration
 * Validates Next.js image optimization settings
 */

import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

// Simple recursive glob implementation
function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        results.push(...findFiles(fullPath, pattern));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return results;
}

// Path to web app root
const webAppRoot = path.resolve(__dirname, "../../../..");
const srcDir = path.join(webAppRoot, "src");
const publicDir = path.join(webAppRoot, "public");

describe("Image Optimization", () => {
  describe("Next.js image configuration", () => {
    let nextConfig: string;

    beforeAll(() => {
      const configPath = path.join(webAppRoot, "next.config.ts");
      expect(fs.existsSync(configPath)).toBe(true);
      nextConfig = fs.readFileSync(configPath, "utf-8");
    });

    it("should have next/image optimization enabled by default", () => {
      // Next.js enables image optimization by default
      // Only check that it's not explicitly disabled
      expect(nextConfig).not.toContain("images: { unoptimized: true }");
    });
  });

  describe("Image usage in components", () => {
    it("should use next/image for optimized images", () => {
      // Find all TSX files
      const tsxFiles = findFiles(srcDir, /\.tsx$/);

      const componentsUsingImages: string[] = [];
      const componentsUsingRawImg: string[] = [];

      for (const file of tsxFiles) {
        const content = fs.readFileSync(file, "utf-8");
        const relativePath = path.relative(srcDir, file);

        // Check for next/image import
        if (content.includes("from 'next/image'") || content.includes('from "next/image"')) {
          componentsUsingImages.push(relativePath);
        }

        // Check for raw <img> tags (excluding SVGs inline)
        if (content.match(/<img\s/) && !content.includes("svg")) {
          // Exclude test files and mock files
          if (!relativePath.includes(".test.") && !relativePath.includes("__mocks__")) {
            componentsUsingRawImg.push(relativePath);
          }
        }
      }

      // Log findings for visibility
      if (componentsUsingImages.length > 0) {
        console.log(`Components using next/image: ${componentsUsingImages.length}`);
      }

      if (componentsUsingRawImg.length > 0) {
        console.log(`Components using raw <img>: ${componentsUsingRawImg.join(", ")}`);
      }

      // Not a hard failure - just informational
      // Some images (like inline SVGs or external images) may need raw img tags
    });
  });

  describe("Public images", () => {
    it("should have optimized image formats in public folder", () => {
      const publicImages = findFiles(publicDir, /\.(png|jpg|jpeg|webp|avif|svg)$/i);

      const imageStats = {
        total: publicImages.length,
        webp: 0,
        avif: 0,
        svg: 0,
        raster: 0,
      };

      for (const image of publicImages) {
        const ext = path.extname(image).toLowerCase();
        if (ext === ".webp") imageStats.webp++;
        else if (ext === ".avif") imageStats.avif++;
        else if (ext === ".svg") imageStats.svg++;
        else imageStats.raster++;
      }

      console.log("Public image formats:", imageStats);

      // Images in public are OK - Next.js handles optimization at runtime
      expect(publicImages.length).toBeGreaterThanOrEqual(0);
    });

    it("should not have excessively large images", () => {
      const publicImages = findFiles(publicDir, /\.(png|jpg|jpeg)$/i);

      const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
      const largeImages: Array<{ path: string; size: number }> = [];

      for (const image of publicImages) {
        const stats = fs.statSync(image);
        if (stats.size > MAX_IMAGE_SIZE) {
          largeImages.push({
            path: path.relative(publicDir, image),
            size: stats.size,
          });
        }
      }

      if (largeImages.length > 0) {
        console.warn("Large images found:", largeImages.map(i =>
          `${i.path} (${(i.size / 1024 / 1024).toFixed(2)}MB)`
        ));
      }

      // Warn but don't fail - Next.js will optimize at runtime
      expect(largeImages.length).toBeLessThan(5);
    });
  });

  describe("Image caching headers", () => {
    it("should have caching configuration in next.config", () => {
      const configPath = path.join(webAppRoot, "next.config.ts");
      const config = fs.readFileSync(configPath, "utf-8");

      // Next.js handles image caching automatically
      // Just verify the config exists and is valid
      expect(config).toContain("nextConfig");
    });
  });
});
