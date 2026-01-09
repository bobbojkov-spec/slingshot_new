import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sport?: string;
  description?: string;
  sort_order: number;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  menu_group: string;
  description?: string;
  sort_order: number;
}

export interface NavigationData {
  categories: Category[];
  productTypesByGroup: {
    gear: ProductType[];
    accessories: ProductType[];
    categories: ProductType[];
  };
  language: string;
}

/**
 * Hook to fetch navigation data with translations
 * Data is cached and refetched when language changes
 */
export function useNavigation() {
  const { language } = useLanguage();
  const [data, setData] = useState<NavigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchNavigation() {
      try {
        setLoading(true);
        setError(null);

        // Fetch from the backend API
        // Adjust the URL based on your environment
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/navigation?lang=${language}`);

        if (!response.ok) {
          throw new Error('Failed to fetch navigation data');
        }

        const navigationData = await response.json();

        if (!isCancelled) {
          setData(navigationData);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error fetching navigation:', err);
          setError(err.message || 'Failed to load navigation');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchNavigation();

    return () => {
      isCancelled = true;
    };
  }, [language]);

  return { data, loading, error };
}

