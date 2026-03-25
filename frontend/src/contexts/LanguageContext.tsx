import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Locale } from "../types";
import translations from "../locales";

interface LanguageContextType {
  locale: Locale;
  t: (key: string) => string;
  changeLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let result = translations[locale];

      for (const k of keys) {
        if (result && typeof result === "object" && k in result) {
          result = result[k];
        } else {
          // Fallback to English if translation not found in current locale
          if (locale !== "en") {
            let fallbackResult = translations.en;
            for (const fallbackKey of keys) {
              if (
                fallbackResult &&
                typeof fallbackResult === "object" &&
                fallbackKey in fallbackResult
              ) {
                fallbackResult = fallbackResult[fallbackKey];
              } else {
                return key; // Return key if even English translation is missing
              }
            }
            return typeof fallbackResult === "string" ? fallbackResult : key;
          }
          return key; // Fallback to the key if translation not found
        }
      }

      return typeof result === "string" ? result : key;
    },
    [locale]
  );

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    // If using localStorage to persist language preference:
    localStorage.setItem("locale", newLocale);
  };

  const value = {
    locale,
    t,
    changeLocale,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
