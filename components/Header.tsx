"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useNavigation } from "@/hooks/useNavigation";
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { open } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const { data: navigation } = useNavigation();

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
      window.location.href = `/shop?q=${encodeURIComponent(searchQuery.trim())}`;
    }
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Filter for only the 4 main sports (Slingshot)
  // Assuming the API returns them, or we filter by known slugs if needed.
  // User said "list the 4 active CATEGORIES (sports)".
  // We'll trust navigation.sports but limit if necessary.
  const slingshotSports = navigation?.sports || [];

  // Helper to get active sport data (if activeMenu is a sport)
  const currentSportData = useMemo(() => {
    if (!activeMenu || activeMenu === 'ride-engine' || !navigation?.sports) return null;
    return navigation.sports.find(s => s.slug === activeMenu);
  }, [activeMenu, navigation]);

  // Ride Engine Menu Configuration
  const rideEngineMenu = [
    {
      title: "HARNESSES",
      items: [
        { name: "Harnesses", handle: "harnesses" },
        { name: "Spreader Bars", handle: "spreader-bars" },
        { name: "Parts & Accessories", handle: "harness-parts-accessories" },
        { name: "Wing Foil Harnesses", handle: "wing-foil-harnesses" }, // Adding explicitly since we have the collection
      ]
    },
    {
      title: "PERFORMANCE PWC",
      items: [
        { name: "PWC Collars", handle: "pwc-collars-pontoons" }, // Verified handle
        { name: "Sleds", handle: "performance-sleds" }, // Verified handle
      ]
    },
    {
      title: "INFLATION & ACC",
      items: [
        { name: "Pumps", handle: "manual-pumps" }, // Verified handle
        { name: "Leashes", handle: "leashes" },
        { name: "Foot Straps", handle: "foot-straps" },
        { name: "E-Inflation", handle: "e-inflation" },
      ]
    },
    {
      title: "PROTECTION",
      items: [
        { name: "Impact Vests", handle: "impact-vests" },
        { name: "Helmets", handle: "helmets" },
        { name: "Hand & Knee", handle: "hand-knee-protection" },
      ]
    },
    {
      title: "BAGS",
      items: [
        { name: "Board Bags", handle: "board-bags" },
        { name: "Travel Bags", handle: "wheeled-travel-bags" },
      ]
    },
    {
      title: "WETSUITS",
      items: [
        { name: "Mens Wetsuits", handle: "mens-wetsuits" },
        { name: "Womens Wetsuits", handle: "womens-wetsuits" },
        { name: "Accessories", handle: "wetsuit-accessories" },
      ]
    },
    {
      title: "APPAREL",
      items: [
        { name: "Apparel", handle: "apparel" },
        { name: "Technical Jackets", handle: "technical-jackets" },
        { name: "Ponchos", handle: "robes-ponchos" },
      ]
    }
  ];

  return (
    <header className={headerClass}>
      <div className="section-container">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              alt="Slingshot"
              className="h-10 w-auto"
              src="/lovable-uploads/68abe593-9323-4aea-8896-0637030766a0.png"
            />
            <span className="font-logo font-extrabold text-white text-lg tracking-tight hidden sm:block">
              BULGARIA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex h-full items-center justify-center overflow-x-auto scrollbar-hide" onMouseLeave={handleNavLeave}>
            {/* Horizontal scroll wrapper for medium screens */}
            <div className="flex items-center justify-center min-w-max">
              <nav className="flex items-center gap-8 h-full">

                {/* Slingshot Sports */}
                {slingshotSports.map((sport) => (
                  <div
                    key={sport.slug}
                    className="relative h-full flex items-center"
                    onMouseEnter={() => handleNavEnter(sport.slug)}
                    onMouseLeave={handleNavLeave}
                  >
                    <Link
                      href={`/shop?category=${sport.slug}`}
                      className={`nav-link-white h-full flex items-center px-2 cursor-pointer bg-transparent border-0 ${activeMenu === sport.slug && isMegaOpen ? "text-accent" : ""
                        }`}
                    >
                      {sport.name}
                    </Link>
                  </div>
                ))}

                {/* Ride Engine Link - Hardcoded as requested */}
                <div
                  className="relative h-full flex items-center"
                  onMouseEnter={() => handleNavEnter('ride-engine')}
                  onMouseLeave={handleNavLeave}
                >
                  <Link
                    href="/shop?brand=Ride%20Engine"
                    className={`nav-link-white uppercase tracking-[0.3em] font-bold h-full flex items-center px-2 cursor-pointer bg-transparent border-0 ${activeMenu === 'ride-engine' && isMegaOpen ? "text-accent" : ""
                      }`}
                  >
                    RIDEENGINE
                  </Link>
                </div>

              </nav>
            </div>
          </div>

          {/* Mega Menu Container */}
          <div
            className="hidden md:block"
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
                  <div className="max-w-5xl mx-auto grid grid-cols-3 gap-12">
                    {/* Column 1: Gear */}
                    <div>
                      <h3 className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6 font-bold border-b border-white/5 pb-2">
                        {t('menu_group.gear')}
                      </h3>
                      <div className="flex flex-col gap-3">
                        {currentSportData.productGroups?.gear?.map((type) => (
                          <Link
                            key={`${activeMenu}-${type.slug}`}
                            href={`/shop?category=${activeMenu}&type=${type.slug}`}
                            className="text-white/80 hover:text-accent hover:translate-x-1 transition-all text-base"
                            onClick={() => setIsMegaOpen(false)}
                          >
                            {type.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Accessories */}
                    <div>
                      <h3 className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6 font-bold border-b border-white/5 pb-2">
                        {t('menu_group.accessories')}
                      </h3>
                      <div className="flex flex-col gap-3">
                        {currentSportData.productGroups?.accessories?.map((type) => (
                          <Link
                            key={`${activeMenu}-${type.slug}`}
                            href={`/shop?category=${activeMenu}&type=${type.slug}`}
                            className="text-white/80 hover:text-accent hover:translate-x-1 transition-all text-base"
                            onClick={() => setIsMegaOpen(false)}
                          >
                            {type.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Categories */}
                    <div>
                      <h3 className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6 font-bold border-b border-white/5 pb-2">
                        CATEGORIES
                      </h3>
                      <div className="flex flex-col gap-3">
                        {navigation?.activityCategories?.map((activity) => (
                          <Link
                            key={activity.id}
                            href={`/shop?category=${activeMenu ?? ''}&activity=${activity.slug}`}
                            className="text-white/80 hover:text-accent hover:translate-x-1 transition-all text-base"
                            onClick={() => setIsMegaOpen(false)}
                          >
                            {activity.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* RIDE ENGINE MENU */}
                {activeMenu === 'ride-engine' && (
                  <div className="max-w-7xl mx-auto grid grid-cols-4 md:grid-cols-7 gap-8">
                    {rideEngineMenu.map((category, idx) => (
                      <div key={idx} className="flex flex-col">
                        <h3 className="text-[10px] tracking-[0.2em] uppercase text-accent mb-4 font-bold border-b border-white/5 pb-1">
                          {category.title}
                        </h3>
                        <div className="flex flex-col gap-2">
                          {category.items.map((item, itemIdx) => (
                            <Link
                              key={itemIdx}
                              // Link to the collection page
                              href={`/collections/${item.handle}`}
                              className="text-white/80 hover:text-accent hover:translate-x-1 transition-all text-sm"
                              onClick={() => setIsMegaOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
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
        className={`overflow-hidden transition-all duration-300 ease-out bg-deep-navy border-t border-white/10 ${isSearchOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="section-container py-4">
          <form onSubmit={handleSearchSubmit} className="relative">
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
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-out bg-deep-navy border-t border-white/10 ${isMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <nav className="section-container py-6 flex flex-col gap-4">
          {slingshotSports.map((sport) => (
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
