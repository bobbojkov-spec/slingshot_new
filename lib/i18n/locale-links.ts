import type { Language } from "@/lib/i18n/LanguageContext";

export const buildLocalePath = (path: string, language: Language) => {
  if (!path) return language === "bg" ? "/bg" : "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const isBg = normalized === "/bg" || normalized.startsWith("/bg/");
  const basePath = isBg ? normalized.replace("/bg", "") || "/" : normalized;

  if (language === "bg") {
    return basePath === "/" ? "/bg" : `/bg${basePath}`;
  }

  return basePath;
};

export const buildLocaleUrl = (path: string, language: Language) => {
  if (typeof window === "undefined") {
    return buildLocalePath(path, language);
  }
  return `${window.location.origin}${buildLocalePath(path, language)}`;
};