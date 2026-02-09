
"use client";

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { message } from 'antd';
import { SendOutlined, UserOutlined, MailOutlined, MessageOutlined, PhoneOutlined } from '@ant-design/icons';

export default function ContactForm() {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);

    const translations = {
        en: {
            name: 'Full Name',
            email: 'Email Address',
            phone: 'Phone Number (Optional)',
            message: 'Your Message',
            send: 'Send Inquiry',
            sending: 'Sending...',
            success: 'Thank you! Your message has been sent.',
            error: "Sorry, we couldn't send your message. Please try again."
        },
        bg: {
            name: 'Трите имена',
            email: 'Имейл адрес',
            phone: 'Телефонен номер (по желание)',
            message: 'Вашето съобщение',
            send: 'Изпрати запитване',
            sending: 'Изпращане...',
            success: 'Благодарим ви! Вашето съобщение беше изпратено.',
            error: 'Съжаляваме, не успяхме да изпратим съобщението. Опитайте отново.'
        }
    };

    const t = translations[language as 'en' | 'bg'] || translations.en;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (res.ok && result.ok) {
                message.success(t.success);
                (e.target as HTMLFormElement).reset();
            } else {
                message.error(result.error || t.error);
            }
        } catch (err) {
            message.error(t.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Name */}
                    <div className="relative group">
                        <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-black">
                            {t.name}
                        </label>
                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                                <UserOutlined />
                            </span>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-gray-100 outline-none focus:border-black transition-all text-gray-900 font-medium placeholder-gray-300"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="relative group">
                        <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-black">
                            {t.email}
                        </label>
                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                                <MailOutlined />
                            </span>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                required
                                className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-gray-100 outline-none focus:border-black transition-all text-gray-900 font-medium placeholder-gray-300"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Phone */}
                <div className="relative group">
                    <label htmlFor="phone" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-black">
                        {t.phone}
                    </label>
                    <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                            <PhoneOutlined />
                        </span>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-gray-100 outline-none focus:border-black transition-all text-gray-900 font-medium placeholder-gray-300"
                            placeholder="+359 ..."
                        />
                    </div>
                </div>

                {/* Message */}
                <div className="relative group">
                    <label htmlFor="message" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-black">
                        {t.message}
                    </label>
                    <div className="relative">
                        <span className="absolute left-0 top-4 text-gray-400 group-focus-within:text-black transition-colors">
                            <MessageOutlined />
                        </span>
                        <textarea
                            name="message"
                            id="message"
                            rows={4}
                            required
                            className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-gray-100 outline-none focus:border-black transition-all text-gray-900 font-medium placeholder-gray-300 resize-none"
                            placeholder="How can we help you?"
                        ></textarea>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full group relative bg-black text-white font-bold uppercase tracking-[0.2em] py-5 px-10 rounded-full overflow-hidden transition-all hover:scale-[1.02] active:scale-95 disabled:bg-gray-400 disabled:scale-100 shadow-lg hover:shadow-2xl"
                >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <SendOutlined className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        )}
                        <span>{loading ? t.sending : t.send}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
            </form>

            <p className="text-center text-gray-400 text-[10px] uppercase tracking-widest">
                Professional Equipment created by riders for riders
            </p>
        </div>
    );
}
