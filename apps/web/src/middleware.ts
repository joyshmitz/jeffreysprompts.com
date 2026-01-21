/**
 * Internationalization Middleware
 *
 * Handles locale detection and routing for multi-language support.
 * - Detects user's preferred language from browser/cookie
 * - Redirects to locale-prefixed URLs
 * - Sets locale cookie for persistence
 */

import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

export default createMiddleware({
  // Supported locales
  locales,

  // Default locale when no locale is detected
  defaultLocale,

  // Don't redirect default locale (en) to /en prefix
  // This keeps English URLs clean (/ instead of /en/)
  localePrefix: "as-needed",

  // Detect locale from browser Accept-Language header
  localeDetection: true,
});

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/...)
  // - Static files (/_next/static/..., /favicon.ico, etc.)
  // - Monitoring routes (/monitoring)
  // - Robots and sitemap
  matcher: [
    // Match all pathnames except those starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico, sitemap.xml, robots.txt
    // - monitoring (Sentry tunnel)
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|monitoring|icons|manifest.json).*)",
  ],
};
