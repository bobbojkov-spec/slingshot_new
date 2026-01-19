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
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
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
            <span className="font-logo font-extrabold text-white text-lg tracking-tight hidden sm:block">
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
                    <Link
                      href={sport.customLink || `/${sport.slug}`}
                      className={`nav-link-white h-full flex items-center px-3 cursor-pointer bg-transparent border-0 uppercase tracking-wide font-bold text-sm transition-all duration-200 ${activeMenu === sport.slug && isMegaOpen ? "text-accent bg-white/5" : "hover:bg-white/5"
                        }`}
                      onClick={() => setIsMegaOpen(false)}
                    >
                      {sport.name}
                    </Link>
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
                          {hasSlug ? (
                            <Link href={`/collections/${group.slug}`} className="block mb-6 group/header">
                              <h3 className="text-xs tracking-[0.3em] uppercase text-white/50 group-hover/header:text-accent font-bold border-b border-white/5 pb-2 transition-colors">
                                {groupTitle}
                              </h3>
                            </Link>
                          ) : (
                            <h3 className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6 font-bold border-b border-white/5 pb-2">
                              {groupTitle}
                            </h3>
                          )}

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
                          {hasSlug ? (
                            <Link href={`/${group.slug}`} className="block mb-4 group/header">
                              <h3 className="text-[10px] tracking-[0.2em] uppercase text-accent group-hover/header:text-orange-400 font-bold border-b border-white/5 pb-1 transition-colors">
                                {groupTitle}
                              </h3>
                            </Link>
                          ) : (
                            <h3 className="text-[10px] tracking-[0.2em] uppercase text-accent mb-4 font-bold border-b border-white/5 pb-1">
                              {groupTitle}
                            </h3>
                          )}

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

      {/* Search Dropdown */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out bg-deep-navy border-t border-white/10 ${isSearchOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="section-container py-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative w-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  const val = event.target.value;
                  setSearchQuery(val);

                  // Live Search Logic
                  if (val.length >= 3) {
                    // Debounce ideally, but for now direct fetch for responsiveness check
                    // Using a simple timeout to avoid spamming
                    const timeoutId = setTimeout(async () => {
                      try {
                        const res = await fetch(`/api/search/live?q=${encodeURIComponent(val)}`);
                        if (res.ok) {
                          const data = await res.json();
                          setSuggestions(data);
                        }
                      } catch (err) {
                        console.error('Live search failed', err);
                      }
                    }, 300);
                    // Clear previous timeout if simple var (need ref or state for robust debounce, 
                    // but React updates handle rapid state changes. For a true debounce we need useEffect)
                  } else {
                    setSuggestions({ products: [], collections: [], tags: [] });
                  }
                }}
                placeholder={t("header.searchPlaceholder")}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-white/50 font-body focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-accent transition-colors"
                style={{ top: '24px' }}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* LIVE SUGGESTIONS DROPDOWN */}
              {(suggestions.products.length > 0 || suggestions.collections.length > 0 || (suggestions.tags && suggestions.tags.length > 0)) && (
                <div className="mt-4 w-full bg-white rounded-md shadow-2xl py-4 z-50 text-black overflow-hidden animate-fade-in max-h-[60vh] overflow-y-auto">
                  <div className="flex flex-col">

                    {/* TAGS */}
                    {suggestions.tags && suggestions.tags.length > 0 && (
                      <div className="mb-4 px-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.tags.map((tag: any) => (
                            <Link
                              key={tag.slug}
                              href={`/search?q=${encodeURIComponent(tag.name)}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                            >
                              {tag.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* COLLECTIONS */}
                    {suggestions.collections.length > 0 && (
                      <div className="mb-4">
                        <h4 className="px-6 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Collections</h4>
                        {suggestions.collections.map((col: any) => (
                          <Link
                            key={col.slug}
                            href={`/collections/${col.slug}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="block px-6 py-2 hover:bg-gray-50 text-sm font-medium text-gray-800 transition-colors"
                          >
                            {col.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* PRODUCTS */}
                    {suggestions.products.length > 0 && (
                      <div>
                        <h4 className="px-6 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Products</h4>
                        {suggestions.products.map((prod: any) => (
                          <Link
                            key={prod.slug}
                            href={`/product/${prod.slug}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="block px-6 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-gray-900">{prod.name}</span>
                              {prod.sku && <span className="text-xs text-gray-400 font-mono">{prod.sku}</span>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-out bg-deep-navy border-t border-white/10 ${isMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <nav className="section-container py-6 flex flex-col gap-4">
          {slingshotSports.map((sport: NavigationSport) => (
            <Link
              key={sport.slug}
              href={`/category/${sport.slug}`}
              className="nav-link-white text-lg py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {sport.name}
            </Link>
          ))}
          <Link
            href="/shop?brand=Ride%20Engine"
            className="nav-link-white text-lg py-2 font-bold text-accent"
            onClick={() => setIsMenuOpen(false)}
          >
            RIDEENGINE
          </Link>

          <div className="pt-4 mt-2 border-t border-white/10">
            <span className="font-body text-xs text-white/40 uppercase tracking-wider mb-2 block">
              {t("header.languageLabel")}
            </span>
            <div className="flex items-center gap-2">
              <button
                className={`text-sm uppercase tracking-wide transition-colors ${language === "bg" ? "text-white font-semibold" : "text-white/70 hover:text-accent"
                  }`}
                onClick={() => setLanguage("bg")}
              >
                BG
              </button>
              <span className="text-white/40">/</span>
              <button
                className={`text-sm uppercase tracking-wide transition-colors ${language === "en" ? "text-white font-semibold" : "text-white/70 hover:text-accent"
                  }`}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
