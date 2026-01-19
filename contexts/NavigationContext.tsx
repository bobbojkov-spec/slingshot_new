"use client";

import React, { createContext, useContext, useState } from "react";
import { NavigationData } from "@/hooks/useNavigation";

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
    const [data] = useState<NavigationData | null>(initialData);

    return (
        <NavigationContext.Provider value={{ data, loading: !data, error: null }}>
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
