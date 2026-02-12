'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Hook to generate a back URL that preserves current query parameters.
 * This ensures filters are maintained when navigating with breadcrumbs.
 * 
 * @param basePath - The base path (e.g., '/admin/products')
 * @param excludeParams - Query param keys to exclude from the back URL (optional)
 * @returns The back URL with preserved query params
 * 
 * @example
 * const backUrl = useBackUrl('/admin/products');
 * // Returns: '/admin/products?q=search&brand=Slingshot' 
 */
export function useBackUrl(basePath: string, excludeParams?: string[]): string {
  const searchParams = useSearchParams();

  return useMemo(() => {
    if (!searchParams) return basePath;

    const params = new URLSearchParams(searchParams.toString());
    
    // Remove excluded params
    excludeParams?.forEach(key => params.delete(key));

    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }, [searchParams, basePath, excludeParams]);
}

/**
 * Hook to get the current query string for appending to links.
 * Returns empty string if no params, otherwise returns '?key=value&...'
 */
export function useQueryString(excludeParams?: string[]): string {
  const searchParams = useSearchParams();

  return useMemo(() => {
    if (!searchParams) return '';

    const params = new URLSearchParams(searchParams.toString());
    
    // Remove excluded params
    excludeParams?.forEach(key => params.delete(key));

    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [searchParams, excludeParams]);
}

export default useBackUrl;
