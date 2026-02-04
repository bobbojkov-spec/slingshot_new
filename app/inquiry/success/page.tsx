"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { InquiryStepper } from "@/components/InquiryStepper";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SuccessPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="section-container section-padding text-center space-y-6">
          <InquiryStepper activeIndex={2} />
          <h1 className="h1 font-heading">{t("inquiry.success.title")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("inquiry.success.message")}
          </p>
          <div className="flex justify-center">
            <Link href="/" className="btn-primary px-6 py-3">
              {t("inquiry.success.button")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

