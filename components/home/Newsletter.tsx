"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const { t } = useLanguage();

  return (
    <section className="newsletter-section section-padding">
      <div className="section-container text-center">
        <span className="text-section-title text-accent mb-3 block">{t("newsletter.preamble")}</span>
        <h2 className="h2 text-white mb-4">{t("newsletter.title")}</h2>
        <p className="font-body text-white/70 mb-8 max-w-md mx-auto">{t("newsletter.description")}</p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder={t("newsletter.placeholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="flex-1 px-4 py-3 rounded bg-white/10 border border-white/20 text-white placeholder:text-white/50 font-body focus:outline-none focus:border-accent"
          />
          <button type="submit" className="btn-primary">
            {t("newsletter.button")} <Send className="w-4 h-4 ml-2" />
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;

