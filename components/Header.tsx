"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Search, ShoppingBag, ChevronDown } from "lucide-react";
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

  // Track which sport is currently being hovered (Desktop)
  const [activeSport, setActiveSport] = useState<string | null>(null);

  // Track which sport is expanded (Mobile)
  const [expandedSport, setExpandedSport] = useState<string | null>(null);

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

  // Close mega menu when cursor leaves the nav area
  const handleNavLeave = () => {
    setIsMegaOpen(false);
    setActiveSport(null);
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

  // Helper to get active sport data
  const currentSportData = useMemo(() => {
    if (!activeSport || !navigation?.sports) return null;
    return navigation.sports.find(s => s.slug === activeSport);
  }, [activeSport, navigation]);

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

          {/* Desktop Navigation 
                Added h-full and items-center to ensure the container spans the full height of the header.
                This prevents a gap between the link and the menu which causes the menu to close.
            */}
          <div
            className="hidden lg:flex h-full items-center justify-center"
          >
            <nav className="flex items-center gap-8 h-full">
              {navigation?.sports?.map((sport) => (
                <div
                  key={sport.slug}
                  className="relative h-full flex items-center"
                >
                  <button
                    onClick={() => {
                      if (activeSport === sport.slug && isMegaOpen) {
                        setIsMegaOpen(false);
                        setActiveSport(null);
                      } else {
                        setActiveSport(sport.slug);
                        setIsMegaOpen(true);
                      }
                    }}
                    className={`nav-link-white h-full flex items-center px-2 cursor-pointer bg-transparent border-0 outline-none ${activeSport === sport.slug && isMegaOpen ? "text-accent" : ""
                      }`}
                  >
                    {sport.name}
                  </button>
                </div>
              ))}

              {/* Standalone Shop Link */}
              <Link
                href="/shop"
                className="nav-link-white uppercase tracking-[0.3em] text-xs h-full flex items-center px-2"
                onClick={() => {
                  setIsMegaOpen(false);
                  setActiveSport(null);
                }}
              >
                {t('shop.title')}
              </Link>
            </nav>

            {/* Per-Sport Mega Menu (Full Width) 
                Added z-40 and fixed positioning.
            */}
            <div
              className={`fixed top-20 left-0 right-0 w-full bg-deep-navy/95 backdrop-blur-md border-t border-white/10 shadow-xl transition-all duration-300 origin-top z-40 ${isMegaOpen && activeSport
                ? 'opacity-100 translate-y-0 visible'
                : 'opacity-0 -translate-y-4 invisible pointer-events-none'
                }`}
            >
              <div className="section-container py-12">
                <div className="max-w-5xl mx-auto grid grid-cols-3 gap-12">

                  {/* Column 1: Gear (Filtered by Sport) */}
                  <div>
                    <h3 className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6 font-bold border-b border-white/5 pb-2">
                      {t('menu_group.gear')}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {currentSportData?.productGroups?.gear && currentSportData.productGroups.gear.length > 0 ? (
                        currentSportData.productGroups.gear.map((type) => (
                          <Link
                            key={`${activeSport}-${type.slug}`}
                            href={`/shop?category=${activeSport}&type=${type.slug}`}
                            className="text-white/80 hover:text-accent hover:translate-x-1 transition-all text-base"
                            onClick={() => setIsMegaOpen(false)}
                          >
                            {type.name}
                          </Link>
                        ))
                      ) : (
                        <Typography.Text type="secondary">No gear</Typography.Text>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Accessories (Filtered by Sport) */}
                  <div>
                    <h3 className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6 font-bold border-b border-white/5 pb-2">
                      {t('menu_group.accessories')}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {currentSportData?.productGroups?.accessories && currentSportData.productGroups.accessories.length > 0 ? (
                        currentSportData.productGroups.accessories.map((type) => (
                          <Link
                            key={`${activeSport}-${type.slug}`}
                            href={`/shop?category=${activeSport}&type=${type.slug}`}
                            className="text-white/80 hover:text-accent hover:translate-x-1 transition-all text-base"
                            onClick={() => setIsMegaOpen(false)}
                          >
                            {type.name}
                          </Link>
                        ))
                      ) : (
                        <Typography.Text type="secondary">No accessories</Typography.Text>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Categories */}
                  <div>
                    <h3 className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6 font-bold border-b border-white/5 pb-2">
                      {/* Hardcoded label to fix "HOME.CATEGORIES" translation issue temporarily if requested, or usage of t() */}
                      CATEGORIES
                    </h3>
                    <div className="flex flex-col gap-3">
                      {navigation?.activityCategories?.map((activity) => (
                        <Link
                          key={activity.id}
                          href={`/shop?category=${activeSport ?? ''}&activity=${activity.slug}`}
                          className="text-white/80 hover:text-accent hover:translate-x-1 transition-all text-base"
                          onClick={() => setIsMegaOpen(false)}
                        >
                          {activity.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div >

          {/* Right Actions */}
          < div className="flex items-center gap-2 sm:gap-4" >
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
          </div >
        </div >
      </div >

      {/* Search Dropdown */}
      < div
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
      </div >

      < div
        className={`lg:hidden fixed top-20 left-0 right-0 bottom-0 bg-deep-navy border-t border-white/10 overflow-y-auto transition-all duration-300 ease-out z-50 ${isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
      >
        <nav className="section-container py-6 flex flex-col gap-4">
          {navigation?.sports?.map((sport) => (
            <div key={sport.slug} className="border-b border-white/5 pb-2">
              <div
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => setExpandedSport(expandedSport === sport.slug ? null : sport.slug)}
              >
                <span className="nav-link-white text-lg">{sport.name}</span>
                <ChevronDown
                  className={`w-5 h-5 text-white/70 transition-transform duration-300 ${expandedSport === sport.slug ? "rotate-180" : ""
                    }`}
                />
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ${expandedSport === sport.slug ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <div className="pl-4 flex flex-col gap-3 py-2">
                  <Link
                    href={`/category/${sport.slug}`}
                    className="text-white/60 hover:text-white text-base"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('category.all_products')} {sport.name}
                  </Link>

                  {/* Gear */}
                  {sport.productGroups?.gear && sport.productGroups.gear.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-xs uppercase tracking-wider text-white/30 font-bold">{t('menu_group.gear')}</span>
                      {sport.productGroups.gear.map((type) => (
                        <Link
                          key={`mob-${sport.slug}-${type.slug}`}
                          href={`/shop?category=${sport.slug}&type=${type.slug}`}
                          className="text-white/80 hover:text-accent pl-2 border-l border-white/10"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {type.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Accessories */}
                  {sport.productGroups?.accessories && sport.productGroups.accessories.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-xs uppercase tracking-wider text-white/30 font-bold">{t('menu_group.accessories')}</span>
                      {sport.productGroups.accessories.map((type) => (
                        <Link
                          key={`mob-${sport.slug}-${type.slug}`}
                          href={`/shop?category=${sport.slug}&type=${type.slug}`}
                          className="text-white/80 hover:text-accent pl-2 border-l border-white/10"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {type.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Categories (Activities) */}
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-xs uppercase tracking-wider text-white/30 font-bold">Categories</span>
                    {navigation?.activityCategories?.map((activity) => (
                      <Link
                        key={`mob-${sport.slug}-${activity.id}`}
                        href={`/shop?category=${sport.slug}&activity=${activity.slug}`}
                        className="text-white/80 hover:text-accent pl-2 border-l border-white/10"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {activity.name}
                      </Link>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          ))}
          <Link
            href="/shop"
            className="nav-link-white text-lg py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('shop.title')}
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
      </div >
    </header >
  );
};

export default Header;
