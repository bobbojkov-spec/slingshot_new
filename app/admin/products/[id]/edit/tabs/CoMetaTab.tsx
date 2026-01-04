'use client';

import SeoSection from './SeoSection';
import type { Product } from '../EditProduct';

export default function CoMetaTab({
  draft,
  setDraft,
}: {
  draft: Product;
  setDraft: React.Dispatch<React.SetStateAction<Product>>;
}) {
  const handleSeoChange = (field: string, value: any) => {
    setDraft((prev) => ({
      ...prev,
      info: { ...prev.info, [field]: value },
    }));
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <SeoSection
        productId={draft.id}
        productTitle={draft.info?.title || ''}
        productDescription={draft.info?.description_html || ''}
        seoData={{
          seo_title: draft.info?.seo_title,
          seo_description: draft.info?.seo_description,
          meta_keywords: draft.info?.meta_keywords,
          og_title: draft.info?.og_title,
          og_description: draft.info?.og_description,
          og_image_url: draft.info?.og_image_url,
          canonical_url: draft.info?.canonical_url,
          meta_robots: draft.info?.meta_robots,
          seo_score: draft.info?.seo_score,
          seo_generated_at: draft.info?.seo_generated_at,
        }}
        onChange={handleSeoChange}
      />
    </div>
  );
}

