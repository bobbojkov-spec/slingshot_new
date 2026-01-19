"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useNavigationContext } from "@/contexts/NavigationContext";
import { NavigationSport, MenuGroup, MenuCollection } from "@/hooks/useNavigation";
import { Typography } from "antd";
import { MobileMenu } from "./layout/MobileMenu";

const Header = () => {
  const pathname = usePathname();
  // Hide header on admin pages (must be inside component)
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [preloadedData, setPreloadedData] = useState<{ collections: any[], tags: string[] }>({ collections: [], tags: [] });
  const [suggestions, setSuggestions] = useState<{ products: any[], collections: any[], tags: any[] }>({ products: [], collections: [], tags: [] });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { open } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const { data: navigation } = useNavigationContext();

  // Track which sport/menu is currently being hovered
  // 'ride-engine' is the special key for the Ride Engine menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const preload = async () => {
      try {
        const res = await fetch('/api/search/preload');
        if (res.ok) {
          const data = await res.json();
          setPreloadedData(data);
        }
      } catch (err) {
        console.error("Preload failed", err);
      }
    };
    preload();
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
        setIsMegaOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    const debounceId = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        // Local filtering for tags and collections (instant)
        const q = searchQuery.toLowerCase();

        const filteredTags = preloadedData.tags
          .filter(t => t.toLowerCase().includes(q))
          .map(t => ({ name: t, slug: t }))
          .slice(0, 8);

        const filteredCollections = preloadedData.collections
          .filter(c => (c.title_en?.toLowerCase().includes(q) || c.title_bg?.toLowerCase().includes(q)))
          .map(c => ({
            title: language === 'bg' ? (c.title_bg || c.title_en) : (c.title_en || c.title_bg),
            slug: c.slug
          }))
          .slice(0, 5);

        // Update local suggestions first
        setSuggestions(prev => ({
          ...prev,
          tags: filteredTags,
          collections: filteredCollections
        }));

        // Fetch products (live)
        if (searchQuery.length >= 3) {
          setIsSearchLoading(true);
          try {
            const res = await fetch(`/api/search/live?q=${encodeURIComponent(searchQuery)}&lang=${language}`);
            if (res.ok) {
              const data = await res.json();
              setSuggestions({
                products: data.products,
                collections: filteredCollections.length > 0 ? filteredCollections : data.collections,
                tags: filteredTags.length > 0 ? filteredTags : data.tags
              });
            }
          } catch (err) {
            console.error("Live search failed", err);
          } finally {
            setIsSearchLoading(false);
          }
        }
      } else {
        setSuggestions({ products: [], collections: [], tags: [] });
        setIsSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceId);
  }, [searchQuery, language, preloadedData]);

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close mega menu when cursor leaves the nav area with a delay
  const handleNavLeave = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setIsMegaOpen(false);
      setActiveMenu(null);
    }, 150);
  };

  const handleNavEnter = (sportSlug?: string) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    if (sportSlug) {
      setActiveMenu(sportSlug);
    }
    setIsMegaOpen(true);
  };

  const headerClass = `fixed w-full z-50 transition-all duration-300 bg-deep-navy ${isScrolled ? "shadow-lg" : ""
    }`;

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}&lang=${language}`;
    }
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Filter for only the 4 main sports (Slingshot)
  // Assuming the API returns them, or we filter by known slugs if needed.
  // User said "list the 4 active CATEGORIES (sports)".
  // We'll trust navigation.sports but limit if necessary.
  // EXCLUDE 'rideengine' explicitly as it has its own hardcoded link
  const slingshotSports: NavigationSport[] = (navigation?.sports || []).filter(s => s.slug !== 'rideengine');

  // Helper to get active sport data (if activeMenu is a sport)
  const currentSportData = useMemo(() => {
    if (!activeMenu || activeMenu === 'ride-engine' || !navigation?.sports) return null;
    return navigation.sports.find(s => s.slug === activeMenu);
  }, [activeMenu, navigation]);



  return (
    <header className={headerClass}>
      <div className="section-container">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              alt="Slingshot"
              className="h-10 w-auto"
              src="/lovable-uploads/68abe593-9323-4aea-8896-0637030766a0.png"
              width={160}
              height={40}
            />
            <span className="font-logo font-extrabold text-orange-500/45 text-lg tracking-tight ml-1">
              BG
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex h-full items-center justify-center overflow-x-auto scrollbar-hide" onMouseLeave={handleNavLeave}>
            {/* Horizontal scroll wrapper for medium screens */}
            <div className="flex items-center justify-center min-w-max h-full">
              <nav className="flex items-center gap-4 h-full">

                {/* Slingshot Sports */}
                {slingshotSports.map((sport: NavigationSport) => (
                  <div
                    key={sport.slug}
                    className="relative h-full flex items-center"
                    onMouseEnter={() => handleNavEnter(sport.slug)}
                    onMouseLeave={handleNavLeave}
                  >
                    <span
                      className={`nav-link-white h-full flex items-center px-3 cursor-default bg-transparent border-0 uppercase tracking-wide font-bold text-sm transition-all duration-200 ${activeMenu === sport.slug && isMegaOpen ? "text-accent bg-white/5" : "hover:bg-white/5"
                        }`}
                    >
                      {sport.name}
                    </span>
                  </div>
                ))}

                {/* Ride Engine Link - Hardcoded as requested - NON-CLICKABLE */}
                <div
                  className="relative h-full flex items-center"
                  onMouseEnter={() => handleNavEnter('ride-engine')}
                  onMouseLeave={handleNavLeave}
                >
                  <span
                    className={`h-full flex items-center px-3 cursor-default bg-transparent border-0 uppercase tracking-[0.15em] font-bold text-sm transition-colors text-orange-500 ${activeMenu === 'ride-engine' && isMegaOpen ? "text-orange-400 bg-white/5" : "hover:bg-white/5"
                      }`}
                  >
                    RIDEENGINE
                  </span>
                </div>

              </nav>
            </div>
          </div>

          {/* Mega Menu Container */}
          <div
            className="hidden lg:block"
            onMouseEnter={() => handleNavEnter()}
            onMouseLeave={handleNavLeave}
          >

            {/* Mega Menu Content */}
            <div
              className={`fixed top-20 left-0 right-0 w-full bg-deep-navy/95 backdrop-blur-md border-t border-white/10 shadow-xl transition-all duration-300 origin-top z-40 ${isMegaOpen && activeMenu
                ? 'opacity-100 translate-y-0 visible'
                : 'opacity-0 -translate-y-4 invisible pointer-events-none'
                }`}
            >
              <div className="section-container py-12">

                {/* SLINGSHOT SPORTS MENU */}
                {currentSportData && (
                  <div className="max-w-7xl mx-auto flex justify-center gap-12 md:gap-16">
                    {/* Dynamic Menu Groups */}
                    {navigation?.slingshotMenuGroups?.map((group: MenuGroup) => {
                      // Filter collections that belong to the current active 'sport' (category)
                      // Heuristic: Check if collection's category_slugs includes the active sport slug
                      // But we have logic.
                      const filteredCollections = group.collections.filter((c: MenuCollection) =>
                        c.category_slugs?.includes(activeMenu || '')
                      );

                      if (filteredCollections.length === 0) return null;

                      const groupTitle = (language === 'bg' && group.title_bg) ? group.title_bg : group.title;
                      const hasSlug = !!group.slug;

                      return (
                        <div key={group.id} className="flex flex-col">
                          <h3 className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6 font-bold border-b border-white/5 pb-2">
                            {groupTitle}
                          </h3>

                          <div className="flex flex-col gap-3">
                            {filteredCollections.map((col: MenuCollection) => (
                              <Link
                                key={col.id}
                                href={`/collections/${col.slug}`}
                                className="text-white/80 hover:text-accent hover:translate-x-1 transition-all text-base"
                                onClick={() => setIsMegaOpen(false)}
                              >
                                {col.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}


                  </div>
                )}

                {/* RIDE ENGINE MENU */}
                {activeMenu === 'ride-engine' && (
                  <div className="max-w-7xl mx-auto grid grid-cols-4 md:grid-cols-7 gap-8">
                    {navigation?.rideEngineMenuGroups?.map((group: MenuGroup) => {
                      const groupTitle = (language === 'bg' && group.title_bg) ? group.title_bg : group.title;
                      const hasSlug = !!group.slug;

                      return (
                        <div key={group.id} className="flex flex-col">
                          <h3 className="text-[10px] tracking-[0.2em] uppercase text-accent mb-4 font-bold border-b border-white/5 pb-1">
                            {groupTitle}
                          </h3>

                          <div className="flex flex-col gap-2">
                            {group.collections?.map((col: MenuCollection) => (
                              <Link
                                key={col.id}
                                href={`/collections/${col.slug}`}
                                className="text-white/80 hover:text-accent hover:translate-x-1 transition-all text-sm"
                                onClick={() => setIsMegaOpen(false)}
                              >
                                {col.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className="touch-target flex items-center justify-center text-white/80 hover:text-accent transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              className="touch-target flex items-center justify-center text-white/80 hover:text-accent transition-colors relative"
              aria-label="Cart"
              onClick={open}
            >
              <ShoppingBag className="w-5 h-5" />
            </button>

            <div className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setLanguage("bg")}
                className={`text-sm uppercase tracking-wide transition-colors ${language === "bg" ? "text-white font-semibold" : "text-white/70 hover:text-accent"
                  }`}
              >
                BG
              </button>
              <span className="text-white/40">/</span>
              <button
                onClick={() => setLanguage("en")}
                className={`text-sm uppercase tracking-wide transition-colors ${language === "en" ? "text-white font-semibold" : "text-white/70 hover:text-accent"
                  }`}
              >
                EN
              </button>
            </div>

            <button
              className="lg:hidden touch-target flex items-center justify-center text-white"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out bg-deep-navy border-t border-white/10 ${isSearchOpen ? "max-h-[80vh] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4"
          }`}
      >
        <div className="section-container py-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative w-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("header.searchPlaceholder")}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-white/50 font-body focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-accent transition-colors"
                disabled={isSearchLoading}
              >
                {isSearchLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>

              {/* LIVE SUGGESTIONS DROPDOWN */}
              {(suggestions.products.length > 0 || suggestions.collections.length > 0 || (suggestions.tags && suggestions.tags.length > 0)) && (
                <div className="mt-4 w-full bg-white/90 backdrop-blur-md rounded-xl shadow-2xl py-6 z-50 text-black overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 max-h-[70vh] overflow-y-auto border border-gray-200">
                  <div className="flex flex-col gap-8">

                    {/* TAGS */}
                    {suggestions.tags && suggestions.tags.length > 0 && (
                      <div className="px-6">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">{t("search.suggestions")}</h4>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.tags.map((tag: any) => (
                            <Link
                              key={tag.slug}
                              href={`/search?tag=${encodeURIComponent(tag.name)}&lang=${language}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="px-5 py-2.5 bg-gray-100 hover:bg-accent hover:text-white rounded-full text-base font-black text-gray-900 transition-all border-2 border-gray-200 shadow-md hover:scale-105 active:scale-95"
                            >
                              {tag.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6">
                      {/* COLLECTIONS */}
                      {suggestions.collections.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">{t("search.collections")}</h4>
                          <div className="space-y-1">
                            {suggestions.collections.map((col: any) => (
                              <Link
                                key={col.slug}
                                href={`/collections/${col.slug}`}
                                onClick={() => setIsSearchOpen(false)}
                                className="flex items-center group py-2"
                              >
                                <span className="text-sm font-medium text-gray-800 group-hover:text-accent transition-colors underline-offset-4 group-hover:underline">
                                  {col.title}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PRODUCTS */}
                      {suggestions.products.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">{t("search.products")}</h4>
                          <div className="space-y-4">
                            {suggestions.products.map((prod: any) => (
                              <Link
                                key={prod.slug}
                                href={`/product/${prod.slug}`}
                                onClick={() => setIsSearchOpen(false)}
                                className="flex items-center gap-4 group"
                              >
                                <div className="w-12 h-12 rounded bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-200 p-1">
                                  <img
                                    src={prod.image || '/placeholder.jpg'}
                                    alt={prod.name}
                                    className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110"
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-bold text-gray-900 truncate group-hover:text-accent transition-colors leading-tight">
                                    {prod.name}
                                  </span>
                                  {prod.sku && (
                                    <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                                      {prod.sku}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View full results link if matching results exist */}
                    <div className="border-t border-gray-100 pt-4 px-6 flex justify-center">
                      <Link
                        href={`/search?q=${encodeURIComponent(searchQuery)}&lang=${language}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="text-sm font-bold text-accent hover:text-orange-600 transition-colors uppercase tracking-widest flex items-center gap-2"
                      >
                        {t("search.view_results")} <Search className="w-3 h-3" />
                      </Link>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        navigation={navigation}
      />
    </header>
  );
};

export default Header;
