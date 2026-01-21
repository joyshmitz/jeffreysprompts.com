/**
 * Server-side i18n Request Configuration
 *
 * Provides locale-specific messages for server components.
 * This file is used by next-intl to load messages on the server.
 */

import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale or fall back to default
  let locale = await requestLocale;

  // Validate locale is supported
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
