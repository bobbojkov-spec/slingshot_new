import { useState } from "react";
import { Send } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  return (
    <section className="newsletter-section section-padding">
      <div className="section-container text-center">
        <span className="text-section-title text-accent mb-3 block">Stay Updated</span>
        <h2 className="h2 text-white mb-4">Join the Crew</h2>
        <p className="font-body text-white/70 mb-8 max-w-md mx-auto">
          Get exclusive offers, new arrivals, and riding tips straight to your inbox.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded bg-white/10 border border-white/20 text-white placeholder:text-white/50 font-body focus:outline-none focus:border-accent"
          />
          <button type="submit" className="btn-primary">
            Subscribe <Send className="w-4 h-4 ml-2" />
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
