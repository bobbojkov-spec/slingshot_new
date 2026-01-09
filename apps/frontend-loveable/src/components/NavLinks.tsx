import { Link } from "react-router-dom";
import { useNavigation } from "@/hooks/useNavigation";

/**
 * NavLinks - Simple navigation links using translated categories
 * This component replaces the hardcoded nav links in Header
 * with dynamically loaded, translated categories from the database
 */
interface NavLinksProps {
  className?: string;
  onLinkClick?: () => void;
}

export default function NavLinks({ className = "nav-link-white", onLinkClick }: NavLinksProps) {
  const { data, loading } = useNavigation();

  // Fallback to empty array while loading
  if (loading || !data) {
    return null;
  }

  const { categories } = data;

  return (
    <>
      {categories.slice(0, 5).map((category) => (
        <Link 
          key={category.id} 
          to={`/category/${category.slug}`} 
          className={className}
          onClick={onLinkClick}
        >
          {category.name}
        </Link>
      ))}
    </>
  );
}

