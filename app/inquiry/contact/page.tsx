"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InquiryStepper } from "@/components/InquiryStepper";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="section-container section-padding space-y-6 max-w-3xl">
          <div>
            <InquiryStepper activeIndex={1} />
            <h1 className="h1 font-heading mt-3">{t("inquiry.contactPage.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("inquiry.contactPage.helper")}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-heading text-sm text-muted-foreground mb-1 block">
                {t("inquiry.contactPage.labels.name")} *
              </label>
              <Input placeholder={t("inquiry.contactPage.placeholders.name")} className="bg-card" />
            </div>
            <div>
              <label className="font-heading text-sm text-muted-foreground mb-1 block">
                {t("inquiry.contactPage.labels.phone")} *
              </label>
              <Input placeholder={t("inquiry.contactPage.placeholders.phone")} className="bg-card" />
            </div>
            <div>
              <label className="font-heading text-sm text-muted-foreground mb-1 block">
                {t("inquiry.contactPage.labels.email")} *
              </label>
              <Input placeholder={t("inquiry.contactPage.placeholders.email")} className="bg-card" />
            </div>
            <div>
              <label className="font-heading text-sm text-muted-foreground mb-1 block">
                {t("inquiry.contactPage.labels.message")}
              </label>
              <Textarea
                placeholder={t("inquiry.contactPage.placeholders.message")}
                className="bg-card"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Link href="/inquiry/success" className="btn-primary px-6 py-3">
              {t("inquiry.contactPage.submitButton")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

