"use client";

import { CartProvider } from "@/lib/cart/CartContext";
import { LanguageProvider, type Language } from "@/lib/i18n/LanguageContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { NavigationData } from "@/hooks/useNavigation";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  initialLanguage?: Language;
  initialNavigation: NavigationData | null;
}

export function Providers({ children, initialLanguage, initialNavigation }: ProvidersProps) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <NavigationProvider initialData={initialNavigation}>
        <CartProvider>{children}</CartProvider>
      </NavigationProvider>
    </LanguageProvider>
  );
}

