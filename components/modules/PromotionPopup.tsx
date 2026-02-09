"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { Promotion } from '@/lib/db/models';

export default function PromotionPopup() {
    const pathname = usePathname();
    const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchActivePromotions = async () => {
            try {
                const res = await fetch('/api/promotions/active');
                const data = await res.json();

                if (data.promotions && data.promotions.length > 0) {
                    // Filter based on placement
                    const currentPromos = data.promotions.filter((p: Promotion) => {
                        if (p.placement === 'everywhere') return true;
                        if (p.placement === 'homepage' && (pathname === '/' || pathname === '/bg' || pathname === '/en')) return true;
                        if (p.placement === 'product' && pathname.startsWith('/product/')) return true;
                        return false;
                    });

                    if (currentPromos.length > 0) {
                        // Just pick the latest one for now
                        const promo = currentPromos[0];

                        // Check if user has already seen and closed THIS specific promotion
                        const hasSeen = localStorage.getItem(`promo_closed_${promo.id}`);
                        if (!hasSeen) {
                            setActivePromotion(promo);

                            // Delay triggering the visibility by 30 seconds
                            const timer = setTimeout(() => {
                                setIsVisible(true);
                            }, 30000); // 30 seconds

                            return () => clearTimeout(timer);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching active promotions:', error);
            }
        };

        fetchActivePromotions();
    }, [pathname]);

    const handleClose = () => {
        if (activePromotion) {
            localStorage.setItem(`promo_closed_${activePromotion.id}`, 'true');
        }
        setIsVisible(false);
    };

    if (!activePromotion || !isVisible) return null;

    const isBig = activePromotion.display_type === 'big';

    return (
        <div className={`fixed z-[9999] transition-all duration-700 ease-out animate-in fade-in ${isBig
                ? "inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                : "bottom-6 right-6 max-w-[380px]"
            }`}>
            <div className={`relative bg-white shadow-2xl overflow-hidden group border border-slate-200 ${isBig ? "rounded-[32px] w-full max-w-2xl" : "rounded-2xl"
                }`}>
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                >
                    <X className="w-5 h-5 text-slate-600" />
                </button>

                <div className={`flex ${isBig ? "flex-col md:flex-row h-full" : "flex-col"}`}>
                    {activePromotion.image_url && (
                        <div className={`${isBig ? "md:w-1/2 min-h-[300px]" : "w-full aspect-video"} overflow-hidden bg-slate-100`}>
                            <img
                                src={activePromotion.image_url}
                                alt={activePromotion.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                    )}

                    <div className={`p-8 flex flex-col justify-center ${isBig && activePromotion.image_url ? "md:w-1/2" : "w-full"}`}>
                        <div className="inline-block px-3 py-1 rounded-full bg-blue-600/5 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
                            Important Message
                        </div>
                        <h3 className={`${isBig ? "text-3xl font-black" : "text-xl font-bold"} text-slate-900 leading-tight mb-4`}>
                            {activePromotion.title}
                        </h3>
                        {activePromotion.content && (
                            <p className="text-slate-600 leading-relaxed mb-6">
                                {activePromotion.content}
                            </p>
                        )}
                        <button
                            onClick={handleClose}
                            className="btn-primary w-fit px-8 py-3"
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
