"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations } from "./translations";

export type Language = "en" | "bg";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language, reload?: boolean) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLanguage = "en",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("lang="))
      ?.split("=")[1] as Language | undefined;

    if (saved) {
      setLanguageState(saved);
    } else {
      // No cookie? Check IP.
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.country_code === 'BG') {
            setLanguage('bg');
          } else {
            setLanguage('en');
          }
        })
        .catch(() => {
          // Default to EN on error
          setLanguage('en');
        });
    }
  }, []);

  const setLanguage = (lang: Language, reload = false) => {
    document.cookie = `lang=${lang}; path=/; max-age=31536000`;
    setLanguageState(lang);
    if (reload) {
      window.location.reload();
    }
  };

  const t = (key: string) => {
    return (translations[language] as any)?.[key] ?? (translations.en as any)?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

