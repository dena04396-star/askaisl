import { defaultLocale, isValidLocale, type Locale } from "./config";

export function getLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().split("-")[0]);

  for (const lang of preferred) {
    if (isValidLocale(lang)) return lang;
  }

  return defaultLocale;
}
