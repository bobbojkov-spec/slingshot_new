import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'bg';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'nav.kites': 'Kites',
    'nav.boards': 'Boards',
    'nav.wings': 'Wings',
    'nav.foils': 'Foils',
    'nav.accessories': 'Accessories',
    'search.placeholder': 'Search products...',
    'language.switch': 'BG',
    
    // Shop
    'shop.title': 'SHOP',
    'shop.subtitle': 'All Slingshot Gear',
    'shop.filter': 'Filter',
    'shop.category': 'Category',
    'shop.price': 'Price',
    'shop.products': 'products',
    'shop.no_results': 'No products found',
    'shop.search_results': 'Search results for',
    
    // Products
    'product.add_to_cart': 'Add to Cart',
    'product.view': 'View Product',
    'product.new': 'New',
    'product.sale': 'Sale',
    
    // Categories
    'category.kites': 'Kites',
    'category.boards': 'Boards',
    'category.wings': 'Wings',
    'category.foils': 'Foils',
    'category.accessories': 'Accessories',
    'category.explore': 'Explore Collection',
    
    // Home
    'home.hero.title': 'RIDE TO FLY',
    'home.hero.subtitle': 'Premium kiteboarding and wing foiling equipment from the world\'s leading brand.',
    'home.hero.shop': 'Shop Now',
    'home.hero.explore': 'Explore Gear',
    'home.bestsellers': 'Best Sellers',
    'home.bestsellers.subtitle': 'Top picks from our riders',
    'home.categories': 'Shop by Category',
    'home.newsletter.title': 'Join the Ride',
    'home.newsletter.subtitle': 'Subscribe for exclusive offers, new product launches, and riding tips.',
    'home.newsletter.placeholder': 'Enter your email',
    'home.newsletter.button': 'Subscribe',
    
    // Footer
    'footer.shop': 'Shop',
    'footer.support': 'Support',
    'footer.contact': 'Contact',
    'footer.contact_us': 'Contact Us',
    'footer.shipping': 'Shipping Info',
    'footer.returns': 'Returns',
    'footer.size_guide': 'Size Guide',
    'footer.faq': 'FAQ',
    'footer.about': 'About Us',
    'footer.team': 'Team Riders',
    'footer.blog': 'Blog',
    'footer.locations': 'Locations',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.description': 'Official Slingshot distributor for Bulgaria. Premium kiteboarding, wing foiling, and wakeboarding equipment.',
    'footer.rights': 'All rights reserved.',
    
    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': 'We\'d love to hear from you. Get in touch with our team.',
    'contact.form.name': 'Your Name',
    'contact.form.email': 'Email Address',
    'contact.form.phone': 'Phone Number',
    'contact.form.subject': 'Subject',
    'contact.form.message': 'Message',
    'contact.form.send': 'Send Message',
    'contact.info.title': 'Get in Touch',
    'contact.info.visit': 'Visit Us',
    'contact.info.call': 'Call Us',
    'contact.info.email': 'Email Us',
    'contact.info.hours': 'Business Hours',
    'contact.info.hours_detail': 'Mon - Fri: 9:00 - 18:00\nSat: 10:00 - 14:00',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Find answers to common questions about our products and services.',
    'faq.still_questions': 'Still have questions?',
    'faq.contact_team': 'Contact our team',
    
    // Category Page
    'category.all_products': 'All Products',
    'category.featured': 'Featured',
    'category.new_arrivals': 'New Arrivals',
    
    // Cart
    'cart.title': 'Inquiry Cart',
    'cart.empty': 'Your inquiry cart is empty',
    'cart.add_to_inquiry': 'Add to Inquiry',
    'cart.send_inquiry': 'Send Inquiry',
  },
  bg: {
    // Header
    'nav.kites': 'Кайтове',
    'nav.boards': 'Дъски',
    'nav.wings': 'Уингове',
    'nav.foils': 'Фойлове',
    'nav.accessories': 'Аксесоари',
    'search.placeholder': 'Търсене на продукти...',
    'language.switch': 'EN',
    
    // Shop
    'shop.title': 'МАГАЗИН',
    'shop.subtitle': 'Цялото оборудване Slingshot',
    'shop.filter': 'Филтър',
    'shop.category': 'Категория',
    'shop.price': 'Цена',
    'shop.products': 'продукта',
    'shop.no_results': 'Няма намерени продукти',
    'shop.search_results': 'Резултати от търсенето за',
    
    // Products
    'product.add_to_cart': 'Добави в количката',
    'product.view': 'Виж продукта',
    'product.new': 'Ново',
    'product.sale': 'Намаление',
    
    // Categories
    'category.kites': 'Кайтове',
    'category.boards': 'Дъски',
    'category.wings': 'Уингове',
    'category.foils': 'Фойлове',
    'category.accessories': 'Аксесоари',
    'category.explore': 'Разгледай колекцията',
    
    // Home
    'home.hero.title': 'ЛЕТИМ ЗАЕДНО',
    'home.hero.subtitle': 'Първокласно оборудване за кайтборд и уинг фойлинг от водещата световна марка.',
    'home.hero.shop': 'Пазарувай',
    'home.hero.explore': 'Разгледай',
    'home.bestsellers': 'Най-продавани',
    'home.bestsellers.subtitle': 'Топ избор от нашите райдъри',
    'home.categories': 'Пазарувай по категория',
    'home.newsletter.title': 'Присъедини се',
    'home.newsletter.subtitle': 'Абонирай се за ексклузивни оферти, нови продукти и съвети за каране.',
    'home.newsletter.placeholder': 'Въведи имейл',
    'home.newsletter.button': 'Абонирай се',
    
    // Footer
    'footer.shop': 'Магазин',
    'footer.support': 'Поддръжка',
    'footer.contact': 'Контакт',
    'footer.contact_us': 'Свържете се с нас',
    'footer.shipping': 'Доставка',
    'footer.returns': 'Връщане',
    'footer.size_guide': 'Размери',
    'footer.faq': 'Въпроси',
    'footer.about': 'За нас',
    'footer.team': 'Отбор',
    'footer.blog': 'Блог',
    'footer.locations': 'Локации',
    'footer.privacy': 'Поверителност',
    'footer.terms': 'Условия за ползване',
    'footer.description': 'Официален дистрибутор на Slingshot за България. Първокласно оборудване за кайтборд, уинг фойлинг и уейкборд.',
    'footer.rights': 'Всички права запазени.',
    
    // Contact
    'contact.title': 'Свържете се с нас',
    'contact.subtitle': 'Ще се радваме да чуем от вас. Свържете се с нашия екип.',
    'contact.form.name': 'Вашето име',
    'contact.form.email': 'Имейл адрес',
    'contact.form.phone': 'Телефонен номер',
    'contact.form.subject': 'Тема',
    'contact.form.message': 'Съобщение',
    'contact.form.send': 'Изпрати съобщение',
    'contact.info.title': 'Връзка с нас',
    'contact.info.visit': 'Посетете ни',
    'contact.info.call': 'Обадете се',
    'contact.info.email': 'Пишете ни',
    'contact.info.hours': 'Работно време',
    'contact.info.hours_detail': 'Пон - Пет: 9:00 - 18:00\nСъб: 10:00 - 14:00',
    
    // FAQ
    'faq.title': 'Често задавани въпроси',
    'faq.subtitle': 'Намерете отговори на често задаваните въпроси за нашите продукти и услуги.',
    'faq.still_questions': 'Имате още въпроси?',
    'faq.contact_team': 'Свържете се с нас',
    
    // Category Page
    'category.all_products': 'Всички продукти',
    'category.featured': 'Препоръчани',
    'category.new_arrivals': 'Нови продукти',
    
    // Cart
    'cart.title': 'Запитване',
    'cart.empty': 'Вашата количка е празна',
    'cart.add_to_inquiry': 'Добави за запитване',
    'cart.send_inquiry': 'Изпрати запитване',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Get country from IP using free API
const detectCountryFromIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code;
  } catch {
    return null;
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initLanguage = async () => {
      // Check for saved preference in cookie
      const savedLang = document.cookie
        .split('; ')
        .find(row => row.startsWith('preferred_lang='))
        ?.split('=')[1] as Language | undefined;

      if (savedLang && (savedLang === 'en' || savedLang === 'bg')) {
        setLanguageState(savedLang);
      } else {
        // Detect from IP
        const country = await detectCountryFromIP();
        if (country === 'BG') {
          setLanguageState('bg');
        }
      }
      setInitialized(true);
    };

    initLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Save to cookie (expires in 1 year)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `preferred_lang=${lang};expires=${expires.toUTCString()};path=/`;
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  if (!initialized) {
    return null; // Or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
