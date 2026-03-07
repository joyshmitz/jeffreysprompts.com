"use client";

/**
 * Language Switcher Component
 *
 * Select menu for changing the application language.
 * Uses next-intl for locale management.
 */

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales, localeNames, localeFlags, localizeHref, stripLocalePrefix, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    const pathWithoutLocale = stripLocalePrefix(pathname);
    router.push(localizeHref(newLocale, pathWithoutLocale));
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-auto min-w-[140px] gap-2">
        <Globe className="h-4 w-4 shrink-0" />
        <SelectValue>
          <span className="hidden sm:inline">{localeNames[locale as Locale]}</span>
          <span className="sm:hidden">{localeFlags[locale as Locale]}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="mr-2">{localeFlags[loc]}</span>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
