import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const FAQ = () => {
  const { t, language } = useLanguage();

  const faqCategories = [
    {
      title: language === 'bg' ? 'Поръчки и Доставка' : 'Orders & Shipping',
      faqs: [
        {
          question: language === 'bg' 
            ? 'Колко време отнема доставката?' 
            : 'How long does shipping take?',
          answer: language === 'bg'
            ? 'Стандартната доставка в България отнема 2-3 работни дни. Експресната доставка е 1 работен ден за поръчки направени преди 14:00ч.'
            : 'Standard shipping within Bulgaria takes 2-3 business days. Express delivery is available with 1 business day for orders placed before 2:00 PM.',
        },
        {
          question: language === 'bg' 
            ? 'Какви са разходите за доставка?' 
            : 'What are the shipping costs?',
          answer: language === 'bg'
            ? 'Безплатна доставка за поръчки над 200 лв. За поръчки под 200 лв. - 8 лв. за стандартна доставка и 15 лв. за експресна доставка.'
            : 'Free shipping on orders over 200 BGN. For orders under 200 BGN, standard shipping is 8 BGN and express delivery is 15 BGN.',
        },
        {
          question: language === 'bg' 
            ? 'Доставяте ли извън България?' 
            : 'Do you ship outside Bulgaria?',
          answer: language === 'bg'
            ? 'Да, доставяме в цяла Европа. Сроковете и цените варират според държавата. Моля свържете се с нас за повече информация.'
            : 'Yes, we ship throughout Europe. Delivery times and costs vary by country. Please contact us for more information.',
        },
      ],
    },
    {
      title: language === 'bg' ? 'Продукти и Размери' : 'Products & Sizing',
      faqs: [
        {
          question: language === 'bg' 
            ? 'Как да избера правилния размер кайт?' 
            : 'How do I choose the right kite size?',
          answer: language === 'bg'
            ? 'Размерът на кайта зависи от вашето тегло и обичайните ветрови условия във вашия район. За райдъри 70-80кг препоръчваме 9-12м кайт за средни условия. Свържете се с нас за персонализирана консултация.'
            : 'Kite size depends on your weight and typical wind conditions in your area. For riders 70-80kg, we recommend 9-12m kites for medium conditions. Contact us for personalized advice.',
        },
        {
          question: language === 'bg' 
            ? 'Каква гаранция имат продуктите?' 
            : 'What warranty do products have?',
          answer: language === 'bg'
            ? 'Всички продукти Slingshot имат 2 години гаранция от производителя за производствени дефекти. Гаранцията не покрива нормално износване или повреди от неправилна употреба.'
            : 'All Slingshot products come with a 2-year manufacturer warranty against defects. The warranty does not cover normal wear and tear or damage from improper use.',
        },
        {
          question: language === 'bg' 
            ? 'Мога ли да тествам продукт преди покупка?' 
            : 'Can I test a product before buying?',
          answer: language === 'bg'
            ? 'Да! Предлагаме демо дни през летния сезон. Следете социалните ни мрежи за предстоящи събития или се свържете с нас за индивидуална сесия.'
            : 'Yes! We offer demo days during the summer season. Follow our social media for upcoming events or contact us to arrange a personal demo session.',
        },
      ],
    },
    {
      title: language === 'bg' ? 'Връщане и Рефунд' : 'Returns & Refunds',
      faqs: [
        {
          question: language === 'bg' 
            ? 'Каква е политиката за връщане?' 
            : 'What is your return policy?',
          answer: language === 'bg'
            ? 'Приемаме връщане на неизползвани продукти в оригинална опаковка до 14 дни от получаването. Продуктът трябва да е в перфектно състояние.'
            : 'We accept returns of unused products in original packaging within 14 days of receipt. The product must be in perfect condition.',
        },
        {
          question: language === 'bg' 
            ? 'Как да направя рекламация?' 
            : 'How do I make a claim?',
          answer: language === 'bg'
            ? 'Свържете се с нас по имейл или телефон с номера на поръчката и описание на проблема. Ще ви насочим за следващите стъпки.'
            : 'Contact us via email or phone with your order number and description of the issue. We will guide you through the next steps.',
        },
        {
          question: language === 'bg' 
            ? 'Колко време отнема рефундът?' 
            : 'How long does a refund take?',
          answer: language === 'bg'
            ? 'След получаване на върнатия продукт, рефундът се обработва до 5 работни дни. Парите се връщат по същия метод на плащане.'
            : 'After receiving the returned product, refunds are processed within 5 business days. Money is returned via the same payment method.',
        },
      ],
    },
    {
      title: language === 'bg' ? 'Плащане' : 'Payment',
      faqs: [
        {
          question: language === 'bg' 
            ? 'Какви методи на плащане приемате?' 
            : 'What payment methods do you accept?',
          answer: language === 'bg'
            ? 'Приемаме плащане с дебитни и кредитни карти (Visa, Mastercard), банков превод и наложен платеж. За по-скъпи продукти предлагаме разсрочено плащане.'
            : 'We accept debit and credit cards (Visa, Mastercard), bank transfer, and cash on delivery. For higher-value products, we offer installment payment options.',
        },
        {
          question: language === 'bg' 
            ? 'Безопасно ли е плащането онлайн?' 
            : 'Is online payment secure?',
          answer: language === 'bg'
            ? 'Да, използваме криптирана връзка и сертифицирани платежни системи. Вашите данни са напълно защитени.'
            : 'Yes, we use encrypted connections and certified payment systems. Your data is completely protected.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-deep-navy text-white py-16 lg:py-24">
          <div className="section-container text-center">
            <h1 className="text-hero mb-4">{t('faq.title')}</h1>
            <p className="text-subhero text-white/70 max-w-2xl mx-auto">
              {t('faq.subtitle')}
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="section-container section-padding">
          <div className="max-w-3xl mx-auto">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12 last:mb-0">
                <h2 className="h3 mb-6 pb-3 border-b border-border">{category.title}</h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem 
                      key={faqIndex} 
                      value={`${categoryIndex}-${faqIndex}`}
                      className="border border-border rounded-lg px-6 data-[state=open]:bg-secondary/30"
                    >
                      <AccordionTrigger className="text-left font-heading font-medium hover:text-accent hover:no-underline py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="font-body text-muted-foreground pb-4 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="max-w-3xl mx-auto mt-16 text-center">
            <div className="bg-secondary/50 rounded-2xl p-8 lg:p-12">
              <MessageCircle className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="h3 mb-3">{t('faq.still_questions')}</h3>
              <p className="font-body text-muted-foreground mb-6">
                {language === 'bg' 
                  ? 'Нашият екип е готов да ви помогне с всякакви въпроси.' 
                  : 'Our team is ready to help you with any questions.'}
              </p>
              <Link to="/contact">
                <Button className="btn-primary">
                  {t('faq.contact_team')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
