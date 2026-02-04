'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export function FloatingWarning() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="bg-black text-white px-6 py-4 rounded shadow-2xl flex items-center gap-4 max-w-sm border border-white/10">
                <div>
                    <p className="font-bold uppercase tracking-wider text-xs text-accent mb-2">Attention</p>
                    <p className="text-sm font-medium leading-relaxed">
                        Free shipping on orders over €500 within Europe.
                    </p>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-white/50 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
