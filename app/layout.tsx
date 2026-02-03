import "./globals.css";
import { Providers } from "./providers";
import type { Metadata } from "next";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GA4RouteTracker from "@/components/GA4RouteTracker";
import { headers } from "next/headers";
import type { Language } from "@/lib/i18n/LanguageContext";
import { getFullNavigation } from "@/lib/railway/navigation-server";

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

  // Fetch navigation data server-side to prevent layout shifts
  const initialNavigation = await getFullNavigation(initialLanguage);

  // SEO: Construct canonical URL
  const host = getHeaderValue("host") || "slingshotnew-development.up.railway.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  const canonicalUrl = `${protocol}://${host}`;

  return (
    <html lang={initialLanguage}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@700;800&family=Poppins:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="canonical" href={canonicalUrl} />
      </head>
      <body>
        <GoogleAnalytics />
        <Providers initialLanguage={initialLanguage} initialNavigation={initialNavigation}>
          <GA4RouteTracker />
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

