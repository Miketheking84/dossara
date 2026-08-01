import { isAppLocale, type AppLocale } from "../i18n/config";

export function parseLocalePreferenceInput(value: unknown): AppLocale | null {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).length !== 1 || !("locale" in value) || !isAppLocale(value.locale)) return null;
  return value.locale;
}
