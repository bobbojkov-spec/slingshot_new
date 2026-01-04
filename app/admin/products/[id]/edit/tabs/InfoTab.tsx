'use client';

import { useMemo } from 'react';
import { Input, Select, Space, Typography, Divider } from 'antd';
import type { Product } from '../EditProduct';
import BilingualInput from '@/app/admin/components/BilingualInput';
import BilingualRichText from '@/app/admin/components/BilingualRichText';

type Option = { label: string; value: string };

export default function InfoTab({
  draft,
  setDraft,
  categories,
  productTypes,
}: {
  draft: Product;
  setDraft: React.Dispatch<React.SetStateAction<Product>>;
  categories: { id: string; name: string }[];
  productTypes: string[];
}) {
  // Debug: Check what we're receiving
  console.log('[InfoTab] draft.translation_en:', draft.translation_en);
  console.log('[InfoTab] draft.translation_bg:', draft.translation_bg);

  const categoryOptions = useMemo<Option[]>(
    () => (categories || []).map((c) => ({ label: c.name, value: c.id })),
    [categories]
  );

  const productTypeOptions = useMemo<Option[]>(
    () => (productTypes || []).map((t) => ({ label: t, value: t })),
    [productTypes]
  );

  // Helper to update EN translation
  const updateTranslationEN = (field: string, value: any) => {
    setDraft((prev) => ({
      ...prev,
      translation_en: {
        ...prev.translation_en,
        [field]: value,
      },
    }));
  };

  // Helper to update BG translation
  const updateTranslationBG = (field: string, value: any) => {
    setDraft((prev) => ({
      ...prev,
      translation_bg: {
        ...prev.translation_bg,
        [field]: value,
      },
    }));
  };

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%', maxWidth: 1000, margin: '0 auto' }}>
      {/* NON-TRANSLATABLE FIELDS */}
      <Typography.Title level={5} style={{ marginBottom: 0 }}>General Information</Typography.Title>
      
      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Handle (URL slug)</Typography.Text>
        <Input
          value={draft.info?.handle ?? ''}
          style={{ width: '100%', maxWidth: '80vw' }}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, handle: e.target.value },
            }))
          }
          placeholder="product-url-slug"
        />
      </div>

      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Category</Typography.Text>
        <Select
          style={{ width: '100%', maxWidth: '80vw' }}
          options={categoryOptions}
          value={draft.info?.categoryId || undefined}
          onChange={(val) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, categoryId: val, categoryName: categoryOptions.find((c) => c.value === val)?.label || '' },
            }))
          }
          allowClear
          placeholder="Select category"
        />
      </div>

      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Brand</Typography.Text>
        <Input
          value={draft.info?.brand ?? ''}
          style={{ width: '100%', maxWidth: '80vw' }}
          disabled
          placeholder="Brand is read-only (no column in products table)"
        />
      </div>

      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Product Type</Typography.Text>
        <Select
          style={{ width: '100%', maxWidth: '80vw' }}
          options={productTypeOptions}
          showSearch
          allowClear
          placeholder="Select product type"
          value={draft.info?.product_type || undefined}
          onChange={(val) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, product_type: val || '' },
            }))
          }
        />
      </div>

      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Status</Typography.Text>
        <Select
          style={{ width: '100%', maxWidth: '80vw' }}
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Not Active', value: 'inactive' },
          ]}
          value={draft.info?.status || undefined}
          onChange={(val) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, status: val || '' },
            }))
          }
          allowClear
          placeholder="Select status"
        />
      </div>

      <Divider />

      {/* TRANSLATABLE FIELDS */}
      <Typography.Title level={5} style={{ marginBottom: 0 }}>
        🌐 Multilingual Content (EN 🇬🇧 / BG 🇧🇬)
      </Typography.Title>

      <BilingualInput
        label="Product Title"
        enValue={draft.translation_en?.title}
        bgValue={draft.translation_bg?.title}
        onEnChange={(val) => updateTranslationEN('title', val)}
        onBgChange={(val) => updateTranslationBG('title', val)}
        placeholder="Product name"
      />

      <BilingualInput
        label="Tags (comma separated)"
        enValue={Array.isArray(draft.translation_en?.tags) ? draft.translation_en.tags.join(', ') : ''}
        bgValue={Array.isArray(draft.translation_bg?.tags) ? draft.translation_bg.tags.join(', ') : ''}
        onEnChange={(val) => updateTranslationEN('tags', val.split(',').map(t => t.trim()).filter(Boolean))}
        onBgChange={(val) => updateTranslationBG('tags', val.split(',').map(t => t.trim()).filter(Boolean))}
        placeholder="tag1, tag2, tag3"
      />

      <BilingualRichText
        label="Description HTML"
        enValue={draft.translation_en?.description_html}
        bgValue={draft.translation_bg?.description_html}
        onEnChange={(val) => updateTranslationEN('description_html', val)}
        onBgChange={(val) => updateTranslationBG('description_html', val)}
      />

      <BilingualRichText
        label="Description HTML 2"
        enValue={draft.translation_en?.description_html2}
        bgValue={draft.translation_bg?.description_html2}
        onEnChange={(val) => updateTranslationEN('description_html2', val)}
        onBgChange={(val) => updateTranslationBG('description_html2', val)}
      />

      <BilingualInput
        label="Specs HTML"
        enValue={draft.translation_en?.specs_html}
        bgValue={draft.translation_bg?.specs_html}
        onEnChange={(val) => updateTranslationEN('specs_html', val)}
        onBgChange={(val) => updateTranslationBG('specs_html', val)}
        placeholder="Technical specifications"
        rows={3}
      />

      <BilingualInput
        label="Package Includes"
        enValue={draft.translation_en?.package_includes}
        bgValue={draft.translation_bg?.package_includes}
        onEnChange={(val) => updateTranslationEN('package_includes', val)}
        onBgChange={(val) => updateTranslationBG('package_includes', val)}
        placeholder="What's included in the box"
        rows={3}
      />

      <Divider />

      <Typography.Title level={5} style={{ marginBottom: 0 }}>SEO (Multilingual)</Typography.Title>

      <BilingualInput
        label="SEO Title"
        enValue={draft.translation_en?.seo_title}
        bgValue={draft.translation_bg?.seo_title}
        onEnChange={(val) => updateTranslationEN('seo_title', val)}
        onBgChange={(val) => updateTranslationBG('seo_title', val)}
        placeholder="SEO page title"
      />

      <BilingualInput
        label="SEO Description"
        enValue={draft.translation_en?.seo_description}
        bgValue={draft.translation_bg?.seo_description}
        onEnChange={(val) => updateTranslationEN('seo_description', val)}
        onBgChange={(val) => updateTranslationBG('seo_description', val)}
        placeholder="SEO meta description"
        rows={2}
      />
    </Space>
  );
}
