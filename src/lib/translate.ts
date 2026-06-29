import enTranslations from "../locales/en.json";
import arTranslations from "../locales/ar.json";

export type Language = "en" | "ar";

const translations: Record<Language, Record<string, string>> = {
  en: enTranslations as Record<string, string>,
  ar: arTranslations as Record<string, string>
};

/**
 * Translates a given English string to Arabic if the language is 'ar'
 * and a translation exists in our dictionary.
 */
export function t(key: string, lang: Language): string {
  if (!key) return "";
  const trimmed = key.trim();
  
  const dict = translations[lang];
  if (dict && dict[trimmed] !== undefined) {
    return dict[trimmed];
  }

  // Attempt partial/fuzzy match for products dynamically if needed
  const lowercaseKey = trimmed.toLowerCase();
  for (const [k, v] of Object.entries(dict || {})) {
    if (k.toLowerCase() === lowercaseKey) {
      return v;
    }
  }

  // Fallback: If not found in Arabic, check if English has a value, otherwise return original key
  if (lang === "ar") {
    const enDict = translations["en"];
    if (enDict && enDict[trimmed] !== undefined) {
      return enDict[trimmed];
    }
  }

  return key;
}
