"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { NavigationSport, MenuGroup, MenuCollection } from "@/hooks/useNavigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navigation: {
        sports?: NavigationSport[];
        slingshotMenuGroups?: MenuGroup[];
        rideEngineMenuGroups?: MenuGroup[];
        customPages?: any[];
    } | null;
}

export function MobileMenu({ isOpen, onClose, navigation }: MobileMenuProps) {
    const { language, setLanguage, t } = useLanguage();

    // Track open states for accordions
    const [expandedSports, setExpandedSports] = useState<Record<string, boolean>>({});
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleSport = (slug: string) => {
        setExpandedSports(prev => ({
            ...prev,
            [slug]: !prev[slug]
        }));
    };

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Filter out Ride Engine from main sport list as requested (it has separate section)
    const slingshotSports = (navigation?.sports || []).filter(s => s.slug !== 'rideengine');

    return (
        <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-out bg-deep-navy border-t border-white/10 ${isOpen ? "max-h-[80vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0"
                }`}
        >
            <nav className="section-container py-6 flex flex-col gap-4">

                {/* Slingshot Sports Accordion */}
                {slingshotSports.map((sport: NavigationSport) => {
                    const isExpanded = expandedSports[sport.slug];

                    // Filter groups for this sport
                    const sportGroups = navigation?.slingshotMenuGroups?.filter(group =>
                        group.collections.some(c => c.category_slugs?.includes(sport.slug))
                    ) || [];

                    return (
                        <div key={sport.slug} className="border-b border-white/5 last:border-0 pb-2">
                            <button
                                onClick={() => toggleSport(sport.slug)}
                                className="w-full flex items-center justify-between text-lg py-2 text-white font-bold uppercase tracking-wide hover:text-accent transition-colors"
                            >
                                {sport.name}
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            <div className={`pl-4 flex flex-col gap-4 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                {sportGroups.map(group => {
                                    const groupTitle = (language === 'bg' && group.title_bg) ? group.title_bg : group.title;
                                    const isGroupExpanded = expandedGroups[group.id];

                                    // Collections for this sport AND group
                                    const collections = group.collections.filter(c => c.category_slugs?.includes(sport.slug));

                                    if (collections.length === 0) return null;

                                    return (
                                        <div key={group.id}>
                                            <div className="w-full flex items-center justify-between text-sm py-2 text-white/70 uppercase tracking-wider">
                                                {groupTitle}
                                                {isGroupExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                            <div className={`pl-4 flex flex-col gap-2 mt-2 border-l border-white/10 ${isGroupExpanded ? 'block' : 'hidden'}`}>
                                                {collections.map(col => (
                                                    <Link
                                                        key={col.id}
                                                        href={`/collections/${col.slug}`}
                                                        className="text-white/60 hover:text-accent text-sm py-2 transition-colors"
                                                        onClick={onClose}
                                                    >
                                                        {col.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {sportGroups.length === 0 && (
                                    <Link href={`/category/${sport.slug}`} onClick={onClose} className="text-white/50 text-sm italic">
                                        View all {sport.name}
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Ride Engine Link */}
                <div className="border-b border-white/5 pb-2">
                    <button
                        onClick={() => toggleSport('rideengine')}
                        className="w-full flex items-center justify-between text-lg py-2 font-bold text-accent hover:text-orange-400 uppercase tracking-wide transition-colors"
                    >
                        RIDEENGINE
                        {expandedSports['rideengine'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div className={`pl-4 flex flex-col gap-4 overflow-hidden transition-all duration-300 ${expandedSports['rideengine'] ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                        {navigation?.rideEngineMenuGroups?.map(group => {
                            const groupTitle = (language === 'bg' && group.title_bg) ? group.title_bg : group.title;

                            return (
                                <div key={group.id} className="flex flex-col gap-1">
                                    <div className="text-xs text-accent/70 uppercase tracking-widest font-bold py-2">
                                        {groupTitle}
                                    </div>
                                    <div className="pl-2 border-l border-white/10 flex flex-col gap-1">
                                        {group.collections.map(col => (
                                            <Link
                                                key={col.id}
                                                href={`/collections/${col.slug}`}
                                                className="text-white/60 hover:text-white text-sm py-2"
                                                onClick={onClose}
                                            >
                                                {col.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Custom Pages */}
                {navigation?.customPages?.filter((p: any) => p.show_header).sort((a: any, b: any) => (a.header_order || 0) - (b.header_order || 0)).map((page: any) => (
                    <div key={page.id} className="border-b border-white/5 last:border-0 pb-2">
                        <Link
                            href={`/p/${page.slug}`}
                            className="w-full block text-lg py-2 text-white font-bold uppercase tracking-wide hover:text-accent transition-colors"
                            onClick={onClose}
                        >
                            {page.title}
                        </Link>
                    </div>
                ))}

                {/* Language Selector */}
                <div className="pt-4 mt-2 mb-safe text-left">
                    <span className="font-body text-xs text-white/40 uppercase tracking-wider mb-2 block">
                        {t("header.languageLabel")}
                    </span>
                    <div className="flex items-center gap-1 mb-8">
                        <div className="bg-white/5 border border-white/10 rounded p-2 flex items-center shadow-sm">
                            <button
                                className={`px-4 py-2 text-xs font-bold rounded transition-all ${language === "bg"
                                    ? "bg-white text-deep-navy shadow-sm"
                                    : "text-white/50 hover:text-white"
                                    }`}
                                onClick={() => setLanguage("bg", true)}
                            >
                                BG
                            </button>
                            <button
                                className={`px-4 py-2 text-xs font-bold rounded transition-all ${language === "en"
                                    ? "bg-white text-deep-navy shadow-sm"
                                    : "text-white/50 hover:text-white"
                                    }`}
                                onClick={() => setLanguage("en", true)}
                            >
                                EN
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
}
