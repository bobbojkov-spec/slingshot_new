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
    } | null;
}

export function MobileMenu({ isOpen, onClose, navigation }: MobileMenuProps) {
    const { language, setLanguage, t } = useLanguage();

    // Track open states for accordions
    // Structure: { [sportSlug]: boolean } -> if true, show Groups
    // Structure: { [groupSlug_or_Id]: boolean } -> if true, show Collections
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

                            <div className={`pl-4 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                {sportGroups.map(group => {
                                    const groupTitle = (language === 'bg' && group.title_bg) ? group.title_bg : group.title;
                                    const isGroupExpanded = expandedGroups[group.id];

                                    // Collections for this sport AND group
                                    const collections = group.collections.filter(c => c.category_slugs?.includes(sport.slug));

                                    if (collections.length === 0) return null;

                                    return (
                                        <div key={group.id}>
                                            <div className="w-full flex items-center justify-between text-sm py-1 text-white/70 uppercase tracking-wider">
                                                {groupTitle}
                                                {isGroupExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                            <div className={`pl-4 flex flex-col gap-2 mt-1 border-l border-white/10 ${isGroupExpanded ? 'block' : 'hidden'}`}>
                                                {collections.map(col => (
                                                    <Link
                                                        key={col.id}
                                                        href={`/collections/${col.slug}`}
                                                        className="text-white/60 hover:text-accent text-sm py-1 transition-colors"
                                                        onClick={onClose}
                                                    >
                                                        {col.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Fallback simply linking to sport page if no groups (rare) */}
                                {sportGroups.length === 0 && (
                                    <Link href={`/category/${sport.slug}`} onClick={onClose} className="text-white/50 text-sm italic">
                                        View all {sport.name}
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Ride Engine Link - Keeping simple as requested or should it expand too? 
            "Ride Engine" is usually treated as a separate brand link. 
            User said "menu for Tablet... list its Submenus". 
            Let's keep Ride Engine as a direct link for now unless they have complex grouping structure here too. 
            Actually, the logic for RE groups is available. Let's make it an accordion too for consistency?
            User said "Slingshot BG video/image... no hiding of the BG on mobile". 
            Let's stick to the requested change: "menu for Tablet, and mobile... list its Submenus (collections) on Click".
        */}
                <div className="border-b border-white/5 pb-2">
                    <button
                        onClick={() => toggleSport('rideengine')}
                        className="w-full flex items-center justify-between text-lg py-2 font-bold text-accent hover:text-orange-400 uppercase tracking-wide transition-colors"
                    >
                        RIDEENGINE
                        {expandedSports['rideengine'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div className={`pl-4 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${expandedSports['rideengine'] ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                        {navigation?.rideEngineMenuGroups?.map(group => {
                            const groupTitle = (language === 'bg' && group.title_bg) ? group.title_bg : group.title;

                            return (
                                <div key={group.id} className="flex flex-col gap-1">
                                    <div className="text-xs text-accent/70 uppercase tracking-widest font-bold py-1">
                                        {groupTitle}
                                    </div>
                                    <div className="pl-2 border-l border-white/10 flex flex-col gap-1">
                                        {group.collections.map(col => (
                                            <Link
                                                key={col.id}
                                                href={`/collections/${col.slug}`}
                                                className="text-white/60 hover:text-white text-sm py-1"
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


                {/* Language Selector */}
                <div className="pt-4 mt-2 mb-safe"> {/* Added mb-safe for spacing */}
                    <span className="font-body text-xs text-white/40 uppercase tracking-wider mb-2 block">
                        {t("header.languageLabel")}
                    </span>
                    <div className="flex items-center gap-1 mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-md p-1 flex items-center shadow-sm">
                            <button
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${language === "bg"
                                    ? "bg-white text-deep-navy shadow-sm"
                                    : "text-white/50 hover:text-white"
                                    }`}
                                onClick={() => setLanguage("bg", true)}
                            >
                                BG
                            </button>
                            <button
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${language === "en"
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
