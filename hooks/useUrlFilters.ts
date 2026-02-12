'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

type FilterValue = string | string[] | boolean | number | undefined;

interface UseUrlFiltersOptions<T extends Record<string, FilterValue>> {
  /** Default values for filters */
  defaults?: Partial<T>;
  /** Debounce delay in ms for URL updates (default: 300) */
  debounceMs?: number;
  /** Whether to replace current history entry instead of pushing (default: true) */
  replace?: boolean;
}

/**
 * Hook to sync filter state with URL query parameters.
 * This ensures filters are preserved when navigating with breadcrumbs or browser back/forward.
 */
export function useUrlFilters<T extends Record<string, FilterValue>>(
  options: UseUrlFiltersOptions<T> = {}
) {
  const { defaults = {}, debounceMs = 300, replace = true } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current URL params into filter state
  const parseParams = useCallback((): T => {
    const params = new URLSearchParams(searchParams.toString());
    const result = { ...defaults } as T;

    for (const [key, value] of params.entries()) {
      if (value === '' || value === undefined) continue;

      // Handle array values (e.g., ?tag=a&tag=b)
      const existing = result[key as keyof T];
      if (existing !== undefined) {
        if (Array.isArray(existing)) {
          (result[key as keyof T] as unknown as string[]) = [...existing, value];
        } else {
          (result[key as keyof T] as unknown as string[]) = [existing as string, value];
        }
      } else {
        (result[key as keyof T] as unknown as string) = value;
      }
    }

    return result;
  }, [searchParams, defaults]);

  const [filters, setFiltersState] = useState<T>(parseParams);

  // Update URL when filters change (with debounce)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();

      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue;
        if (value === (defaults as Record<string, unknown>)[key]) continue; // Skip defaults

        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else {
          params.set(key, String(value));
        }
      }

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      if (replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [filters, pathname, router, replace, debounceMs, defaults]);

  // Sync filters when URL changes (e.g., back button)
  useEffect(() => {
    setFiltersState(parseParams());
  }, [searchParams, parseParams]);

  // Set a single filter value
  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Set multiple filters at once
  const setFilters = useCallback((newFilters: Partial<T>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters or specific keys
  const clearFilters = useCallback((keys?: (keyof T)[]) => {
    if (keys) {
      setFiltersState(prev => {
        const next = { ...prev };
        keys.forEach(key => {
          next[key] = (defaults as Record<string, unknown>)[key as string] as T[keyof T];
        });
        return next;
      });
    } else {
      setFiltersState(defaults as T);
    }
  }, [defaults]);

  // Reset to defaults
  const resetFilters = useCallback(() => {
    setFiltersState(defaults as T);
  }, [defaults]);

  // Check if any filters are active (different from defaults)
  const hasActiveFilters = useCallback((): boolean => {
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = (defaults as Record<string, unknown>)[key];
      if (Array.isArray(value) && Array.isArray(defaultValue)) {
        return JSON.stringify(value) !== JSON.stringify(defaultValue);
      }
      return value !== defaultValue && value !== undefined && value !== '';
    });
  }, [filters, defaults]);

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    resetFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}

export default useUrlFilters;
