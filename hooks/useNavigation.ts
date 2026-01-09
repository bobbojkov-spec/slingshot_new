"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface NavigationProductType {
  id: string;
  slug: string;
  name: string;
  productCount: number;
}

export interface NavigationSport {
  id: string;
  slug: string;
  handle?: string;
  name: string;
  description?: string;
  productGroups: {
    gear: NavigationProductType[];
    accessories: NavigationProductType[];
  };
}

export interface NavigationActivityCategory {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  name_bg: string;
}

export interface NavigationData {
  sports: NavigationSport[];
  activityCategories: NavigationActivityCategory[];
  language: string;
}

export function useNavigation() {
  const { language } = useLanguage();
  const [data, setData] = useState<NavigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchNavigation() {
      setLoading(true);
      setError(null);

      try {
        const langParam = language === "bg" ? "bg" : "en";
        const response = await fetch(`/api/navigation?lang=${langParam}`);

        if (!response.ok) {
          const message = `Navigation request failed (${response.status})`;
          if (!cancelled) {
            setError(message);
          }
          console.error(message);
          return;
        }

        const payload: NavigationData = await response.json();
        if (!cancelled) {
          setData(payload);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Navigation fetch failed", err?.message || err);
          setError(err?.message || "Failed to load navigation");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchNavigation();
    return () => {
      cancelled = true;
    };
  }, [language]);

  return { data, loading, error };
}

