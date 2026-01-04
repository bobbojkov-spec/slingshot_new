import { Link } from "react-router-dom";
import kitefoilImage from "@/assets/action/kitefoil.jpg";
import quickfliteImage from "@/assets/action/quickflite.jpg";
import wavemasteryImage from "@/assets/action/wavemastery.jpg";
import machineImage from "@/assets/action/machine.jpg";

const categories = [
  {
    name: "Kites",
    description: "High-performance kites for all conditions",
    image: machineImage,
    href: "/shop?category=kites",
  },
  {
    name: "Boards",
    description: "Twin tips, surfboards, and foil boards",
    image: kitefoilImage,
    href: "/shop?category=boards",
  },
  {
    name: "Wings",
    description: "Wing foiling gear for ultimate freedom",
    image: quickfliteImage,
    href: "/shop?category=wings",
  },
  {
    name: "Foils",
    description: "Complete foil systems and components",
    image: wavemasteryImage,
    href: "/shop?category=foils",
  },
];

const CategoryGrid = () => {
  return (
    <section className="section-padding bg-background">
      <div className="section-container">
        <div className="text-center mb-12">
          <span className="text-section-title block mb-3">Browse</span>
          <h2 className="h2 text-foreground">Shop by Category</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <Link 
              key={category.name} 
              to={category.href}
              className="category-card group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img 
                src={category.image} 
                alt={category.name}
                className="image-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="category-card-overlay" />
              <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-6">
                <h3 className="font-heading font-semibold text-white text-lg lg:text-xl uppercase tracking-wide mb-1">
                  {category.name}
                </h3>
                <p className="font-body text-white/70 text-sm hidden lg:block">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
