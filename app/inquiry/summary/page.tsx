"use client";

import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { useCart } from "@/lib/cart/CartContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import { InquiryStepper } from "@/components/InquiryStepper";
import { buildCanonicalUrlClient } from "@/lib/seo/url";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SummaryPage() {
  const { items, updateQuantity, removeItem } = useCart();
  const { t } = useLanguage();
  const canonicalUrl = buildCanonicalUrlClient("/inquiry/summary");
  const baseOgImage = `${canonicalUrl.replace(/\/.+$/, "")}/images/og-default.jpg`;
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("inquiry.yourItems"),
    url: canonicalUrl,
    description: t("inquiry.progressLabel"),
  };

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const formatSize = (size?: string) => {
    if (!size) return '';
    const isNumeric = /^\d+(?:\.\d+)?$/.test(size);
    if (!isNumeric) return size;
    return `${size} ${t("product.sizeMeter")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Head>
        <title>{t("inquiry.yourItems")} | Slingshot Bulgaria</title>
        <meta name="description" content={t("inquiry.progressLabel")} />
        <meta property="og:title" content={`${t("inquiry.yourItems")} | Slingshot Bulgaria`} />
        <meta property="og:description" content={t("inquiry.progressLabel")} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Slingshot Bulgaria" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={baseOgImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t("inquiry.yourItems")} | Slingshot Bulgaria`} />
        <meta name="twitter:description" content={t("inquiry.progressLabel")} />
        <meta name="twitter:image" content={baseOgImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <SchemaJsonLd data={pageSchema} defer />
      <Header />
      <main className="flex-1 pt-20">
        <div className="section-container section-padding space-y-6">
          <InquiryStepper activeIndex={0} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="font-heading text-sm uppercase tracking-[0.5em] text-muted-foreground">
                {t("inquiry.progressLabel")}
              </span>
              <h1 className="h1 font-heading mt-2">{t("inquiry.yourItems")}</h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="rounded-full bg-muted/60 text-white px-4 py-2">{t("inquiry.steps.summary")}</span>
              <span className="h-px w-10 bg-border" />
              <span className="px-4 py-2 text-muted-foreground">{t("inquiry.steps.contact")}</span>
              <span className="h-px w-10 bg-border" />
              <span className="px-4 py-2 text-muted-foreground">{t("inquiry.steps.confirmation")}</span>
            </div>
          </div>

          {items.length === 0 && (
            <div className="rounded border border-border p-6 text-center font-body text-muted-foreground">
              {t("inquiry.emptyCart")}
            </div>
          )}

          {items.map((item, index) => (
            <div
              key={`${item.id}-${item.size}-${item.color}-${index}`}
              className="rounded border border-border bg-white shadow-sm px-4 py-4 flex flex-col lg:flex-row lg:items-center lg:gap-6 gap-4"
            >
              <div className="flex items-center gap-4">
                {item.image && (
                  <img src={item.image} alt={item.name} className="h-20 w-20 object-contain" />
                )}
                <div>
                  <p className="font-heading text-lg line-clamp-1">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[formatSize(item.size), item.color].filter(Boolean).join(" ")}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.size, item.qty - 1, item.color)}
                    className="w-8 h-8 border border-border rounded-full flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-heading text-base text-foreground">{item.qty}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.size, item.qty + 1, item.color)}
                    className="w-8 h-8 border border-border rounded-full flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id, item.size, item.color)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {items.length > 0 && (
            <div className="rounded border border-border bg-secondary/30 px-6 py-4 flex items-center justify-between">
              <span className="font-body text-muted-foreground">{t("inquiry.totalItems")}</span>
              <span className="font-heading text-2xl">{totalItems}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Link href="/inquiry/contact" className="btn-primary px-6 py-4">
              {t("inquiry.continueButton")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

