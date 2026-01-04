"use client";

import { Info } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PriceNote = () => {
  const { language } = useLanguage();

  const text =
    language === "bg"
      ? "Всички цени са препоръчителни продажни цени на дребно. Ако сте търговец на дребно, може да направите запитване за цени и поръчка."
      : "All prices are recommended retail prices. If you are a retail client, you may inquire about prices and order.";

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
      <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
      <p className="font-body text-sm text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
};

export default PriceNote;

