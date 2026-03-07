/**
 * i18n Configuration
 *
 * Defines supported locales and default locale for the application.
 */

export const locales = ["en", "es", "fr", "de", "ja", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function localizeHref(locale: string, href: string): string {
  const normalizedHref = href.startsWith("/") ? href : `/${href}`;
  const { pathname, suffix } = splitHrefSuffix(normalizedHref);
  const normalizedPathname = stripLocalePrefix(pathname || "/");

  if (locale === defaultLocale) {
    return `${normalizedPathname}${suffix}`;
  }

  const localePrefix = `/${locale}`;
  if (normalizedPathname === "/" || normalizedPathname === "") {
    return `${localePrefix}${suffix}`;
  }

  return `${localePrefix}${normalizedPathname}${suffix}`;
}

export function stripLocalePrefix(pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalizedPathname === "/") {
    return normalizedPathname;
  }

  for (const locale of locales) {
    const localePrefix = `/${locale}`;
    if (normalizedPathname === localePrefix) {
      return "/";
    }
    if (normalizedPathname.startsWith(`${localePrefix}/`)) {
      return normalizedPathname.slice(localePrefix.length) || "/";
    }
  }

  return normalizedPathname;
}

function splitHrefSuffix(href: string) {
  const hashIndex = href.indexOf("#");
  const searchIndex = href.indexOf("?");
  const suffixIndex =
    hashIndex === -1
      ? searchIndex
      : searchIndex === -1
        ? hashIndex
        : Math.min(hashIndex, searchIndex);

  return {
    pathname: suffixIndex === -1 ? href : href.slice(0, suffixIndex),
    suffix: suffixIndex === -1 ? "" : href.slice(suffixIndex),
  };
}

/**
 * Locale display names for the language switcher
 */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  zh: "中文",
};

/**
 * Locale flags for visual display (uses ISO country codes)
 */
export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  ja: "🇯🇵",
  zh: "🇨🇳",
};
