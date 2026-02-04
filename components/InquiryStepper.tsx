"use client";

import { ShoppingBag, User, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const steps: { key: string; Icon: LucideIcon }[] = [
  { key: "inquiry.steps.summary", Icon: ShoppingBag },
  { key: "inquiry.steps.contact", Icon: User },
  { key: "inquiry.steps.confirmation", Icon: Check }
];

type InquiryStepperProps = {
  activeIndex: number;
};

export const InquiryStepper = ({ activeIndex }: InquiryStepperProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-4">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              index === activeIndex
                ? "bg-deep-navy text-white border-deep-navy"
                : "bg-muted/60 text-muted-foreground border-border"
            }`}
          >
            <step.Icon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-[0.4em]">
              {t(step.key)}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="hidden sm:block h-px w-10 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
};

