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

export interface MenuCollection {
  id: string;
  title: string;
  slug: string;
  image_url?: string;
  category_slugs?: string[];
}

export interface MenuGroup {
  id: string;
  title: string;
  title_bg?: string;
  slug?: string;
  collections: MenuCollection[];
}

export interface NavigationData {
  sports: NavigationSport[];
  activityCategories: NavigationActivityCategory[];
  language: string;
  rideEngineHandles?: string[];
  slingshotMenuGroups?: MenuGroup[];
  rideEngineMenuGroups?: MenuGroup[];
}

export function useNavigation() {
  const { language } = useLanguage();
  const [data, setData] = useState<NavigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // No change needed to useNavigation structure, it handles lang param.
    // Checking menu-structure route instead.

    try {
      const langParam = language === "bg" ? "bg" : "en";

      // Fetch core navigation and menu structures in parallel
      const [navRes, slingshotRes, rideEngineRes] = await Promise.all([
        fetch(`/api/navigation?lang=${langParam}`),
        fetch(`/api/navigation/menu-structure?source=slingshot`),
        fetch(`/api/navigation/menu-structure?source=rideengine`)
      ]);

      if (!navRes.ok) throw new Error('Navigation fetch failed');

      const navData: NavigationData = await navRes.json();
      const slingshotData = await slingshotRes.json();
      const rideEngineData = await rideEngineRes.json();

      if (!cancelled) {
        setData({
          ...navData,
          slingshotMenuGroups: slingshotData.groups || [],
          rideEngineMenuGroups: rideEngineData.groups || []
        });
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

