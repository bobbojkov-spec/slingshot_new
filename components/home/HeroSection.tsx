"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useBackgroundParallax } from "@/hooks/useParallax";

const HeroSection = () => {
  const { t } = useLanguage();
  const { containerRef, imageStyle } = useBackgroundParallax(0.4);

  return (
    <section className="hero-section" ref={containerRef}>
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/lovable-uploads/hero-wave.jpg"
          alt="Slingshot Bulgaria - Premium Kitesurfing Action"
          className="image-cover"
          style={imageStyle}
        />
        <div className="hero-overlay" />
      </div>

      <div className="relative z-10 section-container">
        <div className="max-w-2xl animate-fade-in-up">
          <div className="inline-block mb-6 px-4 py-2.5 rounded backdrop-blur-md bg-navy-900/25 border border-white/10 shadow-lg">
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">
              Официален дистрибутор на Slingshot
            </span>
          </div>
          <h1 className="h1 font-hero text-white mb-6">
            {t("hero.title.line1")}
            <br />
            <span className="text-accent">{t("hero.title.accent")}</span>
          </h1>
          <p className="text-subhero text-white/80 mb-8 max-w-lg">{t("hero.description")}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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

