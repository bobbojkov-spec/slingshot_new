'use client';

import { useMemo, useState } from 'react';
import { Breadcrumb, Button, Space, Tabs, Typography, message } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import InfoTab from './tabs/InfoTab';
import VariantsTab from './tabs/VariantsTab';
import CoMetaTab from './tabs/CoMetaTab';

type ProductTranslation = {
  title?: string;
  description_html?: string;
  description_html2?: string;
  specs_html?: string;
  package_includes?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
};

type ProductInfo = {
  title?: string;
  name?: string;
  subtitle?: string;
  handle?: string;
  brand?: string;
  product_type?: string;
  tags?: string[] | string;
  status?: string;
  availability?: string;
  categoryId?: string;
  categoryName?: string;
  description_html?: string;
  description_html2?: string;
  specs_html?: string;
  package_includes?: string;
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  canonical_url?: string;
  meta_robots?: string;
  seo_score?: number;
  seo_generated_at?: string;
};

export type Product = {
  id: string;
  info: ProductInfo;
  variants?: any[];
  images?: any[];
  translation_en?: ProductTranslation;
  translation_bg?: ProductTranslation;
};

export default function EditProduct({
  product,
  categories,
  productTypes,
}: {
  product: Product;
  categories: { id: string; name: string }[];
  productTypes: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backUrl = useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `/admin/products?${qs}` : '/admin/products';
  }, [searchParams]);
  const [draft, setDraft] = useState<Product>(() => structuredClone(product));
  const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'cometa'>('info');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/products/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: draft }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || 'Save failed');
      }
      message.success('Product saved');
    } catch (err: any) {
      message.error(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space
      orientation="vertical"
      size={16}
      style={{ width: '100%', padding: 16, maxWidth: 1200, margin: '0 auto' }}
    >
      <Breadcrumb
        items={[
          { title: <Link href={backUrl}>Products</Link> },
          { title: 'Edit Product' },
        ]}
      />
      <Space>
        <Button onClick={() => router.push(backUrl)}>Cancel</Button>
        <Button type="primary" loading={saving} onClick={handleSave}>
          Save
        </Button>
      </Space>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'info' | 'variants' | 'cometa')}
        items={[
          {
            key: 'info',
            label: 'Info',
            children: <InfoTab draft={draft} setDraft={setDraft} categories={categories} productTypes={productTypes} />,
          },
          {
            key: 'variants',
            label: 'Variants',
            children: <VariantsTab draft={draft} setDraft={setDraft} />,
          },
          {
            key: 'cometa',
            label: 'SEO Meta',
            children: <CoMetaTab draft={draft} setDraft={setDraft} />,
          },
        ]}
      />
    </Space>
  );
}

