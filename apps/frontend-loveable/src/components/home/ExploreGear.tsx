import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroRideToFly from "@/assets/hero-ridetofly.jpg";

const ExploreGear = () => {
  return (
    <section className="relative min-h-[60vh] flex items-center">
      <div className="absolute inset-0">
        <img src={heroRideToFly} alt="Ride to fly" className="image-cover" />
        <div className="hero-overlay-center" />
      </div>
      <div className="relative z-10 section-container text-center">
        <span className="text-section-title text-accent mb-4 block">Discover</span>
        <h2 className="text-hero text-white mb-6">EXPLORE THE GEAR</h2>
        <p className="text-subhero text-white/80 mb-8 max-w-xl mx-auto">
          From beginner to pro, find the perfect equipment for your next session.
        </p>
        <Link to="/shop" className="btn-primary group">
          Shop Collection <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
};

export default ExploreGear;
