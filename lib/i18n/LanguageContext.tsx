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

    if (reload && typeof window !== "undefined") {
      const { pathname, search } = window.location;
      const isBgPath = pathname === "/bg" || pathname.startsWith("/bg/");
      const basePath = isBgPath ? pathname.replace("/bg", "") || "/" : pathname;
      const targetPath = lang === "bg"
        ? `/bg${basePath === "/" ? "" : basePath}`
        : basePath;

      window.location.assign(`${targetPath}${search}`);
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

  // Safe fallback for SSR or edge cases where context might be missing
  if (!ctx) {
    // If we're on the server, we might be in an SSR pass where context hasn't propagated yet
    // Return a minimal fallback instead of crashing
    return {
      language: "en" as Language,
      setLanguage: () => { },
      t: (key: string) => (translations.en as any)?.[key] ?? key
    };
  }

  return ctx;
}

