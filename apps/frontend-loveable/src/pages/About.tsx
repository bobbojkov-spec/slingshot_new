import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Award, Users, Globe, Heart } from "lucide-react";
import heroWave from "@/assets/hero-wave.jpg";

const About = () => {
  const { language } = useLanguage();

  const t = {
    title: language === 'bg' ? 'ЗА НАС' : 'ABOUT US',
    subtitle: language === 'bg' 
      ? 'Официален дистрибутор на Slingshot за България'
      : 'Official Slingshot Distributor for Bulgaria',
    story: {
      title: language === 'bg' ? 'Нашата история' : 'Our Story',
      text: language === 'bg'
        ? 'От 2015 година сме официален дистрибутор на Slingshot Sports за България. Нашата мисия е да донесем най-доброто оборудване за кайтборд, уинг фойлинг и уейкборд до българските райдъри. С години опит и страст към спорта, ние предлагаме не само продукти, но и експертни съвети и подкрепа за всички нива на умения.'
        : 'Since 2015, we have been the official Slingshot Sports distributor for Bulgaria. Our mission is to bring the best kiteboarding, wing foiling, and wakeboarding equipment to Bulgarian riders. With years of experience and passion for the sport, we offer not only products but also expert advice and support for all skill levels.'
    },
    values: [
      {
        icon: Award,
        title: language === 'bg' ? 'Качество' : 'Quality',
        text: language === 'bg' 
          ? 'Предлагаме само оригинални продукти с пълна гаранция'
          : 'We offer only original products with full warranty'
      },
      {
        icon: Users,
        title: language === 'bg' ? 'Общност' : 'Community',
        text: language === 'bg'
          ? 'Подкрепяме местната райдърска общност с събития и обучения'
          : 'We support the local riding community with events and training'
      },
      {
        icon: Globe,
        title: language === 'bg' ? 'Опит' : 'Experience',
        text: language === 'bg'
          ? 'Над 10 години опит в индустрията на водните спортове'
          : 'Over 10 years of experience in the watersports industry'
      },
      {
        icon: Heart,
        title: language === 'bg' ? 'Страст' : 'Passion',
        text: language === 'bg'
          ? 'Самите ние сме активни райдъри и разбираме вашите нужди'
          : 'We are active riders ourselves and understand your needs'
      }
    ],
    team: {
      title: language === 'bg' ? 'Нашият екип' : 'Our Team',
      text: language === 'bg'
        ? 'Екипът ни се състои от опитни райдъри и ентусиасти, които могат да ви помогнат да изберете правилното оборудване и да отговорят на всички ваши въпроси.'
        : 'Our team consists of experienced riders and enthusiasts who can help you choose the right equipment and answer all your questions.'
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="relative h-48 lg:h-64 animate-fade-in">
          <img src={heroWave} alt="About" className="image-cover" />
          <div className="hero-overlay-center" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-white uppercase tracking-tight">
                {t.title}
              </h1>
              <p className="text-base lg:text-lg text-white/80 mt-2 font-body">
                {t.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="section-container section-padding animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="h2 text-foreground mb-6">{t.story.title}</h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed">
              {t.story.text}
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="bg-secondary/30 section-padding">
          <div className="section-container">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.values.map((value, index) => (
                <div 
                  key={value.title}
                  className="text-center p-6 bg-background rounded-lg animate-fade-in"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground">
                    {value.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="section-container section-padding animate-fade-in">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="h2 text-foreground mb-6">{t.team.title}</h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed mb-8">
              {t.team.text}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
