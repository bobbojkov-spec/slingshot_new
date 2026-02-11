import "./globals.css";
import { Providers } from "./providers";
import type { Metadata, Viewport } from "next";
import LayoutShell from "@/components/LayoutShell";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GA4RouteTracker from "@/components/GA4RouteTracker";
import { headers } from "next/headers";
import type { Language } from "@/lib/i18n/LanguageContext";
import { getFullNavigation } from "@/lib/railway/navigation-server";
import { buildLocalBusinessSchema, buildWebSiteSchema } from "@/lib/seo/business";
import { buildCanonicalUrl } from "@/lib/seo/url-server";
import { Toaster } from "sonner";
import PromotionPopup from "@/components/modules/PromotionPopup";

export const metadata: Metadata = {
  title: "Slingshot Bulgaria",
  description: "Official Slingshot distributor inspired by the Lovable source of truth.",
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-touch-icon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/icons/apple-touch-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/apple-touch-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/icons/apple-touch-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/icons/apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icons/apple-touch-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
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
  console.log('[REQUEST] RootLayout rendering...');
  try {
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

    const canonicalUrl = await buildCanonicalUrl();
    const baseUrl = canonicalUrl.replace(/\/$/, "");
    const ogImage = `${baseUrl}/og?type=home`;

    const webSiteSchema = buildWebSiteSchema(canonicalUrl);
    const localBusinessSchema = buildLocalBusinessSchema(canonicalUrl);

    return (
      <html lang={initialLanguage}>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600&family=Montserrat:wght@700;800&family=Oswald:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap"
            rel="stylesheet"
          />
          <meta property="og:image" content={ogImage} />
          <meta name="twitter:image" content={ogImage} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          />
        </head>
        <body>
          <GoogleAnalytics />
          <Providers initialLanguage={initialLanguage} initialNavigation={initialNavigation}>
            <GA4RouteTracker />
            <LayoutShell>
              {children}
            </LayoutShell>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'hsl(207 72% 11%)',
                  color: 'white',
                  border: 'none',
                },
                className: 'font-body',
              }}
            />
            <PromotionPopup />
          </Providers>
        </body>
      </html>
    );
  } catch (error: any) {
    const errorDetails = {
      message: error?.message || "Unknown error",
      code: error?.code,
      digest: error?.digest,
      envCheck: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        nextPhase: process.env.NEXT_PHASE,
      }
    };

    console.error("CRITICAL: RootLayout Server Render Error:", errorDetails);

    // In production, we still throw to show the generic Next.js error page,
    // but we've logged the details to the server console.
    throw error;
  }
}

