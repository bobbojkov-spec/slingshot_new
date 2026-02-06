"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { NavigationData } from "@/hooks/useNavigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type NavigationContextType = {
    data: NavigationData | null;
    loading: boolean;
    error: string | null;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({
    children,
    initialData,
}: {
    children: React.ReactNode;
    initialData: NavigationData | null;
}) {
    const [data, setData] = useState<NavigationData | null>(initialData);
    const [loading, setLoading] = useState<boolean>(!initialData);
    const [error, setError] = useState<string | null>(null);
    const { language } = useLanguage();

    useEffect(() => {
        const controller = new AbortController();

        const fetchNavigation = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/navigation/full?lang=${language}`, {
                    signal: controller.signal,
                });

                if (!res.ok) {
                    throw new Error('Failed to load navigation');
                }

                const payload = await res.json();
                if (!payload?.data) {
                    throw new Error('Navigation payload missing');
                }

                setData(payload.data as NavigationData);
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
                setError(err?.message || 'Failed to load navigation');
            } finally {
                setLoading(false);
            }
        };

        fetchNavigation();
        return () => controller.abort();
    }, [language]);

    return (
        <NavigationContext.Provider value={{ data, loading, error }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigationContext() {
    const ctx = useContext(NavigationContext);
    if (!ctx) {
        throw new Error("useNavigationContext must be used within NavigationProvider");
    }
    return ctx;
}
