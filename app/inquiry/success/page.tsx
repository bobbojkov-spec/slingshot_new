"use client";

import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { InquiryStepper } from "@/components/InquiryStepper";
import { buildCanonicalUrlClient } from "@/lib/seo/url";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SuccessPage() {
  const { t } = useLanguage();
  const canonicalUrl = buildCanonicalUrlClient("/inquiry/success");
  const baseOgImage = `${canonicalUrl.replace(/\/.+$/, "")}/og?type=inquiry&slug=success`;
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("inquiry.success.title"),
    url: canonicalUrl,
    description: t("inquiry.success.message"),
  };
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Head>
        <title>{t("inquiry.success.title")} | Slingshot Bulgaria</title>
        <meta name="description" content={t("inquiry.success.message")} />
        <meta property="og:title" content={`${t("inquiry.success.title")} | Slingshot Bulgaria`} />
        <meta property="og:description" content={t("inquiry.success.message")} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Slingshot Bulgaria" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={baseOgImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t("inquiry.success.title")} | Slingshot Bulgaria`} />
        <meta name="twitter:description" content={t("inquiry.success.message")} />
        <meta name="twitter:image" content={baseOgImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <SchemaJsonLd data={pageSchema} defer />
      <Header />
      <main className="flex-1 pt-20">
        <div className="section-container section-padding text-center space-y-6">
          <InquiryStepper activeIndex={2} />
          <h1 className="h1 font-heading">{t("inquiry.success.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("inquiry.success.message")}
          </p>
          <div className="flex justify-center">
            <Link href="/" className="btn-primary px-6 py-4">
              {t("inquiry.success.button")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

