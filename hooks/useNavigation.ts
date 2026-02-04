"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigationContext } from "@/contexts/NavigationContext";

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
  customLink?: string;
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

export interface NavigationPage {
  id: number;
  title: string;
  slug: string;
  status: string;
  show_header: boolean;
  show_dropdown: boolean;
  footer_column: number | null;
  header_order: number | null;
  footer_order: number | null;
}

export interface NavigationData {
  sports: NavigationSport[];
  activityCategories: NavigationActivityCategory[];
  language: string;
  rideEngineHandles?: string[];
  slingshotMenuGroups?: MenuGroup[];
  rideEngineMenuGroups?: MenuGroup[];
  customPages?: NavigationPage[];
}

export function useNavigation() {
  const { data, loading, error } = useNavigationContext();
  return { data, loading, error };
}

