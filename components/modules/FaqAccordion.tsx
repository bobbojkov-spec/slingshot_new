
"use client";

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Plus, Minus } from 'lucide-react';
import { FaqItem } from '@/lib/db/models';

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
    const { language } = useLanguage();
    const [openId, setOpenId] = useState<number | null>(null);

    const toggle = (id: number) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className="space-y-4">
            {items.map((item) => {
                const question = language === 'bg' ? (item.question_bg || item.question_en) : item.question_en;
                const answer = language === 'bg' ? (item.answer_bg || item.answer_en) : item.answer_en;
                const isOpen = openId === item.id;

                return (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggle(item.id)}
                            className="w-full flex justify-between items-center p-4 md:p-6 bg-white hover:bg-gray-50 transition-colors text-left"
                        >
                            <span className="font-bold text-lg text-gray-900">{question}</span>
                            {isOpen ? <Minus className="w-5 h-5 flex-shrink-0 ml-4" /> : <Plus className="w-5 h-5 flex-shrink-0 ml-4" />}
                        </button>
                        {isOpen && (
                            <div className="p-4 md:p-6 pt-0 bg-white text-gray-600 prose prose-sm max-w-none">
                                {answer}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
