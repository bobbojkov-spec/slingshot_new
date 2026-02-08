
"use client";

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { message } from 'antd'; // Or user Sonner, but Antd is already there.

export default function ContactForm() {
    const { t } = useLanguage(); // check if 't' handles contact form keys, else use basic logic
    const [loading, setLoading] = useState(false);

    // Simplistic translation hook internal fallback if needed
    const translations = {
        en: {
            name: 'Name',
            email: 'Email',
            message: 'Message',
            send: 'Send Message',
            success: 'Message sent successfully!',
            error: 'Failed to send message.'
        },
        bg: {
            name: 'Име',
            email: 'Имейл',
            message: 'Съобщение',
            send: 'Изпрати съобщение',
            success: 'Съобщението е изпратено успешно!',
            error: 'Възникна грешка при изпращането.'
        }
    };

    // Need to check how useLanguage exposes 'language'. Assuming 'en' | 'bg'.
    const { language } = useLanguage();
    const txt = translations[language as 'en' | 'bg'] || translations.en;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/contact', { // Need to ensure this route exists
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                message.success(txt.success);
                (e.target as HTMLFormElement).reset();
            } else {
                message.error(txt.error);
            }
        } catch (err) {
            message.error(txt.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto py-8">
            <div className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{txt.name}</label>
                    <input type="text" name="name" id="name" inputMode="text" required className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{txt.email}</label>
                    <input type="email" name="email" id="email" inputMode="email" required className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">{txt.message}</label>
                    <textarea name="message" id="message" rows={5} required className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black"></textarea>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white font-bold uppercase tracking-widest py-4 px-8 rounded hover:bg-gray-900 transition-colors disabled:bg-gray-400"
                >
                    {loading ? '...' : txt.send}
                </button>
            </div>
        </form>
    );
}
