export type Locale = "en" | "hu";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "hu";
}

export function createI18n(locale: Locale) {
  return {
    locale,
    formatLocale: locale === "hu" ? "hu-HU" : "en-GB",
    t: (english: string, hungarian: string) => locale === "hu" ? hungarian : english,
  };
}
