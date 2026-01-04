import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSwitchProps {
  className?: string;
}

const LanguageSwitch = ({ className = '' }: LanguageSwitchProps) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bg' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 font-heading font-medium uppercase tracking-wider text-sm transition-colors duration-200 ${className}`}
    >
      <span className={language === 'en' ? 'text-accent' : 'text-white/60'}>EN</span>
      <span className="text-white/40">/</span>
      <span className={language === 'bg' ? 'text-accent' : 'text-white/60'}>BG</span>
    </button>
  );
};

export default LanguageSwitch;
