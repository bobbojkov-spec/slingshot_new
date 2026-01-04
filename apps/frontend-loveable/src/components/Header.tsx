import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingBag, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import LanguageSwitch from "@/components/LanguageSwitch";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { itemCount, setIsCartOpen } = useCart();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Close search on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const navLinks = [
    { name: t('nav.kites'), href: "/category/kites" },
    { name: t('nav.boards'), href: "/category/boards" },
    { name: t('nav.wings'), href: "/category/wings" },
    { name: t('nav.foils'), href: "/category/foils" },
    { name: t('nav.accessories'), href: "/category/accessories" },
  ];

  const headerClass = `fixed w-full z-50 transition-all duration-300 bg-deep-navy ${isScrolled ? 'shadow-lg' : ''}`;
  const linkClass = "nav-link-white";

  return (
    <header className={headerClass}>
      <div className="section-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
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
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.name} to={link.href} className={linkClass}>
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="touch-target flex items-center justify-center text-white/80 hover:text-accent transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="touch-target flex items-center justify-center text-white/80 hover:text-accent transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Desktop Language Switch */}
            <div className="hidden lg:block">
              <LanguageSwitch className="text-white/80 hover:text-accent" />
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden touch-target flex items-center justify-center text-white" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Dropdown */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-out bg-deep-navy border-t border-white/10 ${
          isSearchOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="section-container py-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-12 
                         text-white placeholder:text-white/50 font-body
                         focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                         transition-all duration-200"
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
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-out bg-deep-navy border-t border-white/10 ${
          isMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="section-container py-6 flex flex-col gap-4">
          {navLinks.map(link => (
            <Link 
              key={link.name} 
              to={link.href} 
              className="nav-link-white text-lg py-2" 
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Language Switch in Mobile Menu */}
          <div className="pt-4 mt-2 border-t border-white/10">
            <LanguageSwitch className="text-white/80 hover:text-accent" />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
