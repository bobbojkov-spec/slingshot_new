"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();
  return (
    <section className="hero-section">
      <div className="absolute inset-0">
        <img
          src="/lovable-uploads/hero-wave.jpg"
          alt="Kitesurfing action"
          className="image-cover"
        />
        <div className="hero-overlay" />
      </div>

      <div className="relative z-10 section-container">
        <div className="max-w-2xl animate-fade-in-up">
          <span className="text-section-title text-accent mb-4 block">
            {t("hero.badge")}
          </span>
          <h1 className="text-hero text-white mb-6">
            {t("hero.title.line1")}
            <br />
            <span className="text-accent">{t("hero.title.accent")}</span>
          </h1>
          <p className="text-subhero text-white/80 mb-8 max-w-lg">{t("hero.description")}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/slingshot-collections" className="btn-primary group">
              {t("hero.cta.s-collection")}
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/rideengine-collections" className="btn-secondary">
              {t("hero.cta.r-collection")}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

