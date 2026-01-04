import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });
    
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-deep-navy text-white py-16 lg:py-24">
          <div className="section-container text-center">
            <h1 className="text-hero mb-4">{t('contact.title')}</h1>
            <p className="text-subhero text-white/70 max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="section-container section-padding">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form */}
            <div className="order-2 lg:order-1">
              <h2 className="h3 mb-8">{t('contact.info.title')}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium mb-2">
                      {t('contact.form.name')} *
                    </label>
                    <Input 
                      required 
                      name="name"
                      className="w-full"
                      placeholder={t('contact.form.name')}
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium mb-2">
                      {t('contact.form.email')} *
                    </label>
                    <Input 
                      required 
                      type="email"
                      name="email"
                      className="w-full"
                      placeholder={t('contact.form.email')}
                    />
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium mb-2">
                      {t('contact.form.phone')}
                    </label>
                    <Input 
                      type="tel"
                      name="phone"
                      className="w-full"
                      placeholder="+359 888 123 456"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium mb-2">
                      {t('contact.form.subject')} *
                    </label>
                    <Input 
                      required
                      name="subject"
                      className="w-full"
                      placeholder={t('contact.form.subject')}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block font-body text-sm font-medium mb-2">
                    {t('contact.form.message')} *
                  </label>
                  <Textarea 
                    required
                    name="message"
                    rows={6}
                    className="w-full resize-none"
                    placeholder={t('contact.form.message')}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="btn-primary w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {t('contact.form.send')}
                    </span>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="order-1 lg:order-2">
              <div className="bg-secondary/50 rounded-2xl p-8 lg:p-10 space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-2">
                      {t('contact.info.visit')}
                    </h3>
                    <p className="font-body text-muted-foreground">
                      Sofia, Bulgaria<br />
                      Vitosha Blvd 123<br />
                      1000 Sofia
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-2">
                      {t('contact.info.call')}
                    </h3>
                    <a href="tel:+359888123456" className="font-body text-muted-foreground hover:text-accent transition-colors">
                      +359 888 123 456
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-2">
                      {t('contact.info.email')}
                    </h3>
                    <a href="mailto:info@slingshot.bg" className="font-body text-muted-foreground hover:text-accent transition-colors">
                      info@slingshot.bg
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-2">
                      {t('contact.info.hours')}
                    </h3>
                    <p className="font-body text-muted-foreground whitespace-pre-line">
                      {t('contact.info.hours_detail')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="mt-6 rounded-2xl overflow-hidden h-64 bg-secondary/30 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-body text-sm">Interactive map coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
