"use client";

import { CartProvider } from "@/lib/cart/CartContext";
import { LanguageProvider, type Language } from "@/lib/i18n/LanguageContext";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export function Providers({ children, initialLanguage }: ProvidersProps) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <CartProvider>{children}</CartProvider>
    </LanguageProvider>
  );
}

