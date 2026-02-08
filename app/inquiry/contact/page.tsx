"use client";

import Head from "next/head";
import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchemaJsonLd from "@/components/seo/SchemaJsonLd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InquiryStepper } from "@/components/InquiryStepper";
import { buildCanonicalUrlClient } from "@/lib/seo/url";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCart } from "@/lib/cart/CartContext";

export default function ContactPage() {
  const { t } = useLanguage();
  const canonicalUrl = buildCanonicalUrlClient("/inquiry/contact");
  const baseOgImage = `${canonicalUrl.replace(/\/.+$/, "")}/images/og-default.jpg`;

  const [formValues, setFormValues] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    email: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { items, clear } = useCart();

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!formValues.name.trim()) next.name = t("inquiry.contactPage.labels.name") + " is required";
    if (!formValues.phone.trim()) next.phone = t("inquiry.contactPage.labels.phone") + " is required";
    if (!formValues.email.trim()) next.email = t("inquiry.contactPage.labels.email") + " is required";
    if (formValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      next.email = t("inquiry.contactPage.labels.email") + " is invalid";
    }
    return next;
  }, [formValues, t]);

  const isValid = Object.keys(errors).length === 0;

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("inquiry.contactPage.title"),
    url: canonicalUrl,
    description: t("inquiry.contactPage.helper"),
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        message: formValues.message?.trim() || null,
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          product_slug: item.slug || null,
          product_image: item.image || null,
          variant_id: item.id,
          size: item.size || null,
          color: item.color || null,
          quantity: item.qty,
          price: item.price ?? null,
        })),
      };

      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to submit inquiry');
      }

      clear();
      window.location.href = "/inquiry/success";
    } catch (error) {
      console.error(error);
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Head>
        <title>{t("inquiry.contactPage.title")} | Slingshot Bulgaria</title>
        <meta name="description" content={t("inquiry.contactPage.helper")} />
        <meta property="og:title" content={`${t("inquiry.contactPage.title")} | Slingshot Bulgaria`} />
        <meta property="og:description" content={t("inquiry.contactPage.helper")} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Slingshot Bulgaria" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={baseOgImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t("inquiry.contactPage.title")} | Slingshot Bulgaria`} />
        <meta name="twitter:description" content={t("inquiry.contactPage.helper")} />
        <meta name="twitter:image" content={baseOgImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <SchemaJsonLd data={pageSchema} defer />
      <Header />
      <main className="flex-1 pt-20">
        <div className="section-container section-padding space-y-6 max-w-3xl">
          <div>
            <InquiryStepper activeIndex={1} />
            <h1 className="h1 font-heading mt-4">{t("inquiry.contactPage.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("inquiry.contactPage.helper")}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-heading text-sm text-muted-foreground mb-2 block">
                {t("inquiry.contactPage.labels.name")} *
              </label>
              <Input
                placeholder={t("inquiry.contactPage.placeholders.name")}
                className="bg-card"
                value={formValues.name}
                onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              />
              {touched.name && errors.name && (
                <p className="text-xs text-destructive mt-2">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="font-heading text-sm text-muted-foreground mb-2 block">
                {t("inquiry.contactPage.labels.phone")} *
              </label>
              <Input
                type="tel"
                inputMode="tel"
                placeholder={t("inquiry.contactPage.placeholders.phone")}
                className="bg-card"
                value={formValues.phone}
                onChange={(e) => setFormValues((prev) => ({ ...prev, phone: e.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              />
              {touched.phone && errors.phone && (
                <p className="text-xs text-destructive mt-2">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="font-heading text-sm text-muted-foreground mb-2 block">
                {t("inquiry.contactPage.labels.email")} *
              </label>
              <Input
                placeholder={t("inquiry.contactPage.placeholders.email")}
                className="bg-card"
                value={formValues.email}
                onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-destructive mt-2">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="font-heading text-sm text-muted-foreground mb-2 block">
                {t("inquiry.contactPage.labels.message")}
              </label>
              <Textarea
                placeholder={t("inquiry.contactPage.placeholders.message")}
                className="bg-card"
                rows={4}
                value={formValues.message}
                onChange={(e) => setFormValues((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              disabled={!isValid || isSubmitting}
              onClick={handleSubmit}
              className={`btn-primary px-6 py-4 ${!isValid || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {t("inquiry.contactPage.submitButton")}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

