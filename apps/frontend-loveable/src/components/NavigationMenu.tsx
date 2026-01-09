import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigation } from "@/hooks/useNavigation";

/**
 * NavigationMenu - Displays hierarchical navigation structure
 * Structure: SPORT (categories) → menu_group → product_types
 * 
 * This component demonstrates the full navigation structure with:
 * - Categories (Sports like Kite, Wing, etc.) - translated via category_translations
 * - Menu Groups (gear, accessories, categories) - labels translated via frontend dictionary
 * - Product Types (Kites, Boards, etc.) - translated via product_type_translations
 */
export default function NavigationMenu() {
  const { t, language } = useLanguage();
  const { data, loading, error } = useNavigation();

  if (loading) {
    return <div className="text-white/60">Loading navigation...</div>;
  }

  if (error || !data) {
    return <div className="text-white/60">Navigation unavailable</div>;
  }

  const { categories, productTypesByGroup } = data;

  return (
    <nav className="navigation-menu">
      {/* 1. CATEGORIES (SPORTS) - Top Level */}
      <div className="sports-navigation">
        {categories.map((category) => (
          <div key={category.id} className="sport-item">
            <Link to={`/category/${category.slug}`} className="sport-link">
              {category.name}
            </Link>
            
            {/* 2. MENU GROUPS - Second Level */}
            <div className="menu-groups">
              {Object.keys(productTypesByGroup).map((menuGroupKey) => {
                const menuGroupLabel = t(`menu_group.${menuGroupKey}`);
                const productTypesInGroup = productTypesByGroup[menuGroupKey as keyof typeof productTypesByGroup];
                
                // Skip empty groups
                if (productTypesInGroup.length === 0) return null;
                
                return (
                  <div key={menuGroupKey} className="menu-group">
                    <h3 className="menu-group-label">{menuGroupLabel}</h3>
                    
                    {/* 3. PRODUCT TYPES - Third Level */}
                    <ul className="product-types-list">
                      {productTypesInGroup.map((productType) => (
                        <li key={productType.id}>
                          <Link 
                            to={`/products/${productType.slug}`}
                            className="product-type-link"
                          >
                            {productType.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

