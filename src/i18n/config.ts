export const SUPPORTED_LOCALES = ["sr-Latn", "en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "sr-Latn";
export const FALLBACK_LOCALE: AppLocale = "en";

export const INTL_LOCALE_BY_APP_LOCALE: Record<AppLocale, string> = {
  "sr-Latn": "sr-Latn-RS",
  en: "en",
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as AppLocale);
}
