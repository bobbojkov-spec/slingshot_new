import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-wave.jpg";

const HeroSection = () => {
  return (
    <section className="hero-section">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Kitesurfing action" 
          className="image-cover"
        />
        <div className="hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 section-container">
        <div className="max-w-2xl animate-fade-in-up">
          <span className="text-section-title text-accent mb-4 block">
            Official Slingshot Distributor
          </span>
          <h1 className="text-hero text-white mb-6">
            RIDE THE<br />
            <span className="text-accent">WIND</span>
          </h1>
          <p className="text-subhero text-white/80 mb-8 max-w-lg">
            Premium kiteboarding, wing foiling, and wakeboarding gear. 
            Engineered for performance, built for adventure.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/shop" className="btn-primary group">
              Shop Now
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/shop?category=kites" className="btn-secondary">
              Explore Kites
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
