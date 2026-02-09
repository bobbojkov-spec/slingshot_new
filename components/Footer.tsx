"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useNavigationContext } from "@/contexts/NavigationContext";
import { usePathname } from "next/navigation";
import { buildLocalePath } from "@/lib/i18n/locale-links";

const Footer = () => {
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();
  const { data: navigation } = useNavigationContext();
  const rightsText = t("footer.rights").replace("{year}", new Date().getFullYear().toString());

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/bg/admin')) return null;

  const customPages = navigation?.customPages || [];

  // All footer pages in one list
  const footerPages = customPages
    .filter(page => {
      if (page.status !== 'published') return false;
      return page.show_footer || (page.footer_column != null && page.footer_column > 0);
    })
    .sort((a, b) => (a.footer_order || 0) - (b.footer_order || 0));

  return (
    <footer className="footer-section">
      <div className="section-container section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 lg:gap-8">
          {/* Column 1: Brand + Social + Language (40%) */}
          <div>
            <Link href={buildLocalePath("/", language)} className="flex items-center gap-4 mb-6">
              <img
                alt="Slingshot"
                className="h-8 w-auto object-contain"
                src="/lovable-uploads/36257ddf-c3a4-46fd-b0bb-ded5427dcfac.png"
              />
              <span className="font-logo font-bold text-white text-lg tracking-tight">BG</span>
            </Link>
            <p className="font-body text-white/60 text-sm leading-relaxed mb-6">{t("footer.description")}</p>
            <div className="flex gap-4 mb-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="touch-target flex items-center justify-center text-white/60 hover:text-accent transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="touch-target flex items-center justify-center text-white/60 hover:text-accent transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="touch-target flex items-center justify-center text-white/60 hover:text-accent transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            <div className="pt-4 border-t border-white/10">
              <span className="font-body text-xs text-white/40 uppercase tracking-wider mb-2 block">
                {t("footer.languageLabel")}
              </span>
              <div className="bg-white/5 border border-white/10 rounded p-2 flex items-center shadow-sm w-fit">
                <button
                  onClick={() => setLanguage("bg", true)}
                  className={`px-4 py-2 text-xs font-bold rounded transition-all ${language === "bg"
                    ? "bg-white text-deep-navy shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                >
                  BG
                </button>
                <button
                  onClick={() => setLanguage("en", true)}
                  className={`px-4 py-2 text-xs font-bold rounded transition-all ${language === "en"
                    ? "bg-white text-deep-navy shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Shop (20%) */}
          <div>
            <h4 className="font-heading font-medium text-white uppercase tracking-wider text-sm mb-6">
              {t("footer.sections.shop")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href={buildLocalePath("/shop?brand=slingshot", language)} className="footer-link font-body text-sm">
                  {language === "bg" ? "Slingshot продукти" : "Slingshot Products"}
                </Link>
              </li>
              <li>
                <Link href={buildLocalePath("/shop?brand=ride-engine", language)} className="footer-link font-body text-sm">
                  {language === "bg" ? "Ride Engine продукти" : "Ride Engine Products"}
                </Link>
              </li>
              <li>
                <Link href={buildLocalePath("/collections/featured-products", language)} className="footer-link font-body text-sm">
                  {language === "bg" ? "Нови продукти" : "New Products"}
                </Link>
              </li>
              <li>
                <Link href={buildLocalePath("/collections/best-sellers", language)} className="footer-link font-body text-sm">
                  {language === "bg" ? "Най-продавани" : "Best Sellers"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Pages (20%) */}
          <div>
            <h4 className="font-heading font-medium text-white uppercase tracking-wider text-sm mb-6">
              {language === "bg" ? "Страници" : "Pages"}
            </h4>
            <ul className="space-y-3">
              {footerPages.map(page => (
                <li key={page.id}>
                  <Link href={buildLocalePath(`/${page.slug}`, language)} className="footer-link font-body text-sm">
                    {language === 'bg' ? (page.title_bg || page.title) : page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact (20%) */}
          <div>
            <h4 className="font-heading font-medium text-white uppercase tracking-wider text-sm mb-6">
              {t("footer.sections.contact")}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span className="font-body text-sm text-white/60">
                  {t("footer.contact.location")}
                  <br />
                  {t("footer.contact.address")}
                </span>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <a href="tel:+359888123456" className="footer-link font-body text-sm">
                  {t("footer.contact.phone")}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <a href="mailto:info@slingshot.bg" className="footer-link font-body text-sm">
                  {t("footer.contact.email")}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section-container py-6">
          <p className="font-body text-sm text-white/50 text-center">{rightsText}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
