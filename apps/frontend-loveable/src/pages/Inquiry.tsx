import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShoppingBag, ArrowLeft, ArrowRight, Minus, Plus, Trash2, Check, Send, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type Step = 'summary' | 'contact' | 'confirmation';

const Inquiry = () => {
  const { items, removeItem, updateQuantity, clearCart, itemCount } = useCart();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('summary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const t = {
    inquiry: language === 'bg' ? 'Запитване' : 'Inquiry',
    summary: language === 'bg' ? 'Преглед' : 'Summary',
    contact: language === 'bg' ? 'Данни за контакт' : 'Contact Details',
    confirmation: language === 'bg' ? 'Потвърждение' : 'Confirmation',
    emptyCart: language === 'bg' ? 'Вашата количка е празна' : 'Your inquiry cart is empty',
    browseProducts: language === 'bg' ? 'Разгледай продукти' : 'Browse Products',
    backToShop: language === 'bg' ? 'Обратно към магазина' : 'Back to Shop',
    continue: language === 'bg' ? 'Продължи' : 'Continue',
    back: language === 'bg' ? 'Назад' : 'Back',
    sendInquiry: language === 'bg' ? 'Изпрати запитване' : 'Send Inquiry',
    yourItems: language === 'bg' ? 'Вашите продукти' : 'Your Items',
    totalItems: language === 'bg' ? 'Общо артикули' : 'Total Items',
    name: language === 'bg' ? 'Име' : 'Name',
    phone: language === 'bg' ? 'Телефон' : 'Phone',
    email: language === 'bg' ? 'Имейл' : 'Email',
    message: language === 'bg' ? 'Съобщение (по избор)' : 'Message (optional)',
    namePlaceholder: language === 'bg' ? 'Вашето име' : 'Your name',
    phonePlaceholder: language === 'bg' ? 'Вашият телефон' : 'Your phone number',
    emailPlaceholder: language === 'bg' ? 'Вашият имейл' : 'Your email address',
    messagePlaceholder: language === 'bg' ? 'Допълнителна информация или въпроси...' : 'Additional information or questions...',
    required: language === 'bg' ? 'Задължително поле' : 'Required field',
    successTitle: language === 'bg' ? 'Запитването е изпратено!' : 'Inquiry Sent!',
    successMessage: language === 'bg' ? 'Благодарим ви! Ще се свържем с вас възможно най-скоро.' : 'Thank you! We will contact you as soon as possible.',
    backToHome: language === 'bg' ? 'Обратно към началото' : 'Back to Home',
    continueShoping: language === 'bg' ? 'Продължи пазаруването' : 'Continue Shopping',
    step: language === 'bg' ? 'Стъпка' : 'Step',
    of: language === 'bg' ? 'от' : 'of',
  };

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'summary', label: t.summary, icon: <ShoppingBag className="w-4 h-4" /> },
    { key: 'contact', label: t.contact, icon: <User className="w-4 h-4" /> },
    { key: 'confirmation', label: t.confirmation, icon: <Check className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error(language === 'bg' ? 'Моля, въведете име' : 'Please enter your name');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error(language === 'bg' ? 'Моля, въведете телефон' : 'Please enter your phone');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error(language === 'bg' ? 'Моля, въведете валиден имейл' : 'Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate sending inquiry (in real app, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Log the inquiry data (for demo purposes)
    console.log('Inquiry submitted:', {
      items,
      contact: formData,
      timestamp: new Date().toISOString()
    });
    
    setIsSubmitting(false);
    setCurrentStep('confirmation');
    clearCart();
  };

  const handleContinue = () => {
    if (currentStep === 'summary') {
      setCurrentStep('contact');
    } else if (currentStep === 'contact') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 'contact') {
      setCurrentStep('summary');
    }
  };

  // Empty cart state
  if (items.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-28 pb-20">
          <div className="text-center animate-fade-in">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground/30 mb-6" />
            <h1 className="font-heading text-2xl mb-4">{t.emptyCart}</h1>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t.browseProducts}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-28 pb-8 md:pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          
          {/* Progress Steps */}
          {currentStep !== 'confirmation' && (
            <div className="mb-8 md:mb-12 animate-fade-in">
              <div className="flex items-center justify-center gap-2 md:gap-4">
                {steps.map((step, index) => (
                  <div key={step.key} className="flex items-center">
                    <div className={`
                      flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300
                      ${index <= currentStepIndex 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'}
                    `}>
                      {step.icon}
                      <span className="hidden sm:inline font-body text-sm">{step.label}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        w-8 md:w-16 h-0.5 mx-2 transition-colors duration-300
                        ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}
                      `} />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-muted-foreground text-sm mt-4 sm:hidden">
                {t.step} {currentStepIndex + 1} {t.of} {steps.length}
              </p>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 'summary' && (
            <div className="animate-fade-in">
              <h1 className="font-heading text-2xl md:text-3xl mb-6">{t.yourItems}</h1>
              
              <div className="space-y-4 mb-8">
                {items.map((item, index) => (
                  <div 
                    key={`${item.id}-${item.size}-${item.color}-${index}`}
                    className="flex gap-4 p-4 bg-card rounded-lg border border-border"
                  >
                    <Link 
                      to={`/product/${item.slug}`}
                      className="w-24 h-24 bg-muted rounded overflow-hidden shrink-0"
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-contain p-2"
                      />
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/product/${item.slug}`}
                        className="font-heading font-semibold hover:text-accent transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mb-1">
                        {item.category} {item.size && `• ${item.size}`}
                      </p>
                      {item.color && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span 
                            className={`w-3 h-3 rounded-full ${
                              item.color === 'blue' ? 'bg-blue-500' : 
                              item.color === 'green' ? 'bg-emerald-500' : 
                              item.color === 'orange' ? 'bg-orange-500' : 'bg-gray-400'
                            }`}
                          />
                          <span className="text-xs text-muted-foreground capitalize">{item.color}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, item.color)}
                            className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:border-primary transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-body text-lg w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                            className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:border-primary transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeItem(item.id, item.size, item.color)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="font-body text-muted-foreground">{t.totalItems}</span>
                  <span className="font-heading text-xl">{itemCount}</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'contact' && (
            <div className="animate-fade-in max-w-xl mx-auto">
              <h1 className="font-heading text-2xl md:text-3xl mb-6">{t.contact}</h1>
              
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 font-body text-sm mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {t.name} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t.namePlaceholder}
                    className="bg-card"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 font-body text-sm mb-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {t.phone} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t.phonePlaceholder}
                    className="bg-card"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 font-body text-sm mb-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {t.email} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t.emailPlaceholder}
                    className="bg-card"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 font-body text-sm mb-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    {t.message}
                  </label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={t.messagePlaceholder}
                    rows={4}
                    className="bg-card resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 'confirmation' && (
            <div className="animate-fade-in text-center py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="font-heading text-3xl md:text-4xl mb-4">{t.successTitle}</h1>
              <p className="font-body text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                {t.successMessage}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2">
                  {t.backToHome}
                </Link>
                <Link to="/shop" className="btn-secondary inline-flex items-center justify-center gap-2">
                  {t.continueShoping}
                </Link>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 'confirmation' && (
            <div className="flex gap-4 justify-between mt-8 animate-fade-in">
              {currentStep === 'summary' ? (
                <Link to="/shop" className="btn-secondary inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t.backToShop}
                </Link>
              ) : (
                <button onClick={handleBack} className="btn-secondary inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t.back}
                </button>
              )}

              <button 
                onClick={handleContinue}
                disabled={isSubmitting}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {currentStep === 'contact' ? (
                  <>
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {t.sendInquiry}
                  </>
                ) : (
                  <>
                    {t.continue}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Inquiry;
