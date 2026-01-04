import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitch from "@/components/LanguageSwitch";

const Footer = () => {
  const { t, language } = useLanguage();

  const shopLinks = [
    { name: t('nav.kites'), href: "/category/kites" },
    { name: t('nav.boards'), href: "/category/boards" },
    { name: t('nav.wings'), href: "/category/wings" },
    { name: t('nav.foils'), href: "/category/foils" },
    { name: t('nav.accessories'), href: "/category/accessories" },
  ];

  const supportLinks = [
    { name: t('footer.about'), href: "/about" },
    { name: t('footer.contact_us'), href: "/contact" },
    { name: t('footer.shipping'), href: "/shipping" },
    { name: t('footer.returns'), href: "/returns" },
    { name: t('footer.faq'), href: "/faq" },
  ];

  return (
    <footer className="footer-section">
      {/* Main Footer */}
      <div className="section-container section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img 
                alt="Slingshot" 
                className="h-8 w-auto object-contain" 
                src="/lovable-uploads/36257ddf-c3a4-46fd-b0bb-ded5427dcfac.png" 
              />
              <span className="font-logo font-extrabold text-white text-lg tracking-tight">BG</span>
            </Link>
            <p className="font-body text-white/60 text-sm leading-relaxed mb-6">
              {t('footer.description')}
            </p>
            <div className="flex gap-4 mb-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="touch-target flex items-center justify-center text-white/60 hover:text-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="touch-target flex items-center justify-center text-white/60 hover:text-accent transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="touch-target flex items-center justify-center text-white/60 hover:text-accent transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            {/* Language Switch */}
            <div className="pt-4 border-t border-white/10">
              <span className="font-body text-xs text-white/40 uppercase tracking-wider mb-2 block">
                {language === 'bg' ? 'Език' : 'Language'}
              </span>
              <LanguageSwitch className="text-white/80 hover:text-accent" />
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-heading font-semibold text-white uppercase tracking-wider text-sm mb-6">
              {t('footer.shop')}
            </h4>
            <ul className="space-y-3">
              {shopLinks.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="footer-link font-body text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-heading font-semibold text-white uppercase tracking-wider text-sm mb-6">
              {t('footer.support')}
            </h4>
            <ul className="space-y-3">
              {supportLinks.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="footer-link font-body text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-white uppercase tracking-wider text-sm mb-6">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span className="font-body text-sm text-white/60">
                  Sofia, Bulgaria<br />
                  Vitosha Blvd 123
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <a href="tel:+359888123456" className="footer-link font-body text-sm">
                  +359 888 123 456
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <a href="mailto:info@slingshot.bg" className="footer-link font-body text-sm">
                  info@slingshot.bg
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="section-container py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-body text-sm text-white/50">
              © {new Date().getFullYear()} Slingshot Bulgaria. {t('footer.rights')}
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="footer-link font-body text-sm">
                {t('footer.privacy')}
              </Link>
              <Link to="/terms" className="footer-link font-body text-sm">
                {t('footer.terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
