import "./globals.css";
import { Providers } from "./providers";
import type { Metadata } from "next";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { headers } from "next/headers";
import type { Language } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "Slingshot Bulgaria",
  description: "Official Slingshot distributor inspired by the Lovable source of truth."
};

const COOKIE_NAME = "lang";

const parseLangCookie = (cookieHeader: string | null): Language | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const target = cookieHeader
    .split("; ")
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  if (!target) {
    return undefined;
  }

  const [, value] = target.split("=");
  return value === "bg" || value === "en" ? value : undefined;
};

const detectCountryCode = (getHeaderValue: (name: string) => string | null) => {
  const countryHeader =
    getHeaderValue("x-vercel-ip-country") ?? getHeaderValue("x-forwarded-for") ?? "";

  return countryHeader.split(",")[0].trim().toUpperCase();
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const getHeaderValue = (name: string) => {
    if (typeof (headersList as { get?: (name: string) => string | null }).get === "function") {
      return (headersList as { get: (name: string) => string | null }).get(name);
    }

    return null;
  };

  const cookieLanguage = parseLangCookie(getHeaderValue("cookie"));
  const countryCode = detectCountryCode(getHeaderValue);
  const initialLanguage: Language = cookieLanguage ?? (countryCode === "BG" ? "bg" : "en");

  return (
    <html lang={initialLanguage}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@700;800&family=Poppins:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers initialLanguage={initialLanguage}>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}

