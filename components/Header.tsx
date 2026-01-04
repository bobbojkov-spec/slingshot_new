"use client";

import Link from "next/link";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const navLinks = [
  { key: "header.nav.kites", href: "/category/kites" },
  { key: "header.nav.boards", href: "/category/boards" },
  { key: "header.nav.wings", href: "/category/wings" },
  { key: "header.nav.foils", href: "/category/foils" },
  { key: "header.nav.accessories", href: "/category/accessories" }
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { open } = useCart();
  const { language, setLanguage, t } = useLanguage();

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
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const headerClass = `fixed w-full z-50 transition-all duration-300 bg-deep-navy ${isScrolled ? "shadow-lg" : ""}`;

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSearchOpen(false);
    setSearchQuery("");
  };

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

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.key} href={link.href} className="nav-link-white">
                {t(link.key)}
              </Link>
            ))}
          </nav>

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
              className={`text-sm uppercase tracking-wide transition-colors ${
                language === "bg" ? "text-white font-semibold" : "text-white/70 hover:text-accent"
              }`}
            >
              BG
            </button>
            <span className="text-white/40">/</span>
            <button
              onClick={() => setLanguage("en")}
              className={`text-sm uppercase tracking-wide transition-colors ${
                language === "en" ? "text-white font-semibold" : "text-white/70 hover:text-accent"
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
        className={`overflow-hidden transition-all duration-300 ease-out bg-deep-navy border-t border-white/10 ${
          isSearchOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
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

      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-out bg-deep-navy border-t border-white/10 ${
          isMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
          <nav className="section-container py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="nav-link-white text-lg py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
          <div className="pt-4 mt-2 border-t border-white/10">
            <span className="font-body text-xs text-white/40 uppercase tracking-wider mb-2 block">
              {t("header.languageLabel")}
            </span>
            <div className="flex items-center gap-2">
              <button
                className={`text-sm uppercase tracking-wide transition-colors ${
                  language === "bg" ? "text-white font-semibold" : "text-white/70 hover:text-accent"
                }`}
                onClick={() => setLanguage("bg")}
              >
                BG
              </button>
              <span className="text-white/40">/</span>
              <button
                className={`text-sm uppercase tracking-wide transition-colors ${
                  language === "en" ? "text-white font-semibold" : "text-white/70 hover:text-accent"
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

