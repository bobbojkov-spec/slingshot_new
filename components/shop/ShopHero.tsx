import Link from 'next/link';
import React from 'react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

export function ShopHero({ title, breadcrumbs }: { title: string, breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <div className="relative w-full h-[50vh] min-h-[300px] bg-gray-900 flex items-center justify-center overflow-hidden mb-0">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-60"
                style={{ backgroundImage: "url('https://slingshotsports.com/cdn/shop/collections/Kite_Collection_Header_2.jpg?v=1684347895')" }}
            />
            <div className="absolute inset-0 bg-black/30" />

            <div className="relative z-10 text-center text-white px-4 section-container">
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 shadow-sm">
                    Shop / <span className="text-accent">{title}</span>
                </h1>
            </div>

            {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="absolute bottom-0 left-0 bg-white z-30 px-8 py-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    {breadcrumbs.map((item, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <span>/</span>}
                            {item.href ? (
                                <Link href={item.href} className="hover:text-black transition-colors text-black/60">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-black font-bold">{item.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}
