'use client';

import { useMemo, useState } from 'react';
import { Checkbox, Input, Select, Space, Typography, Divider, message } from 'antd';
import type { Product } from '../EditProduct';
import BilingualInput from '@/app/admin/components/BilingualInput';
import BilingualRichText from '@/app/admin/components/BilingualRichText';
import BilingualTags from '@/app/admin/components/BilingualTags';
import { colorsUrl } from '../colorsApi';

type Option = { label: string; value: string };

export default function InfoTab({
  draft,
  setDraft,
  categories,
  collections,
}: {
  draft: Product;
  setDraft: React.Dispatch<React.SetStateAction<Product>>;
  categories: { id: string; name: string }[];
  collections: { id: string; title: string }[];
}) {
  // Debug: Check what we're receiving
  console.log('[InfoTab] draft.translation_en:', draft.translation_en);
  console.log('[InfoTab] draft.translation_bg:', draft.translation_bg);

  const categoryOptions = useMemo<Option[]>(
    () => (categories || []).map((c) => ({ label: c.name, value: c.id })),
    [categories]
  );


  const [updatingColorId, setUpdatingColorId] = useState<string | null>(null);
  const productColors = draft.colors || [];
  const sortedProductColors = useMemo(
    () => [...productColors].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [productColors]
  );

  const handleToggleColor = async (color: any) => {
    if (!draft.id) return;
    setUpdatingColorId(color.id);
    try {
      const url = colorsUrl(draft.id);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorId: color.id, is_visible: !(color.is_visible !== false) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update color visibility');

      setDraft((prev) => ({
        ...prev,
        colors: prev.colors?.map((c) =>
          c.id === color.id ? { ...c, ...body.color } : c
        ),
      }));

      message.success(`Color ${body.color.is_visible ? 'enabled' : 'hidden'}`);
    } catch (error: any) {
      message.error(error?.message || 'Unable to update color visibility');
    } finally {
      setUpdatingColorId(null);
    }
  };

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
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, brand: e.target.value },
            }))
          }
          placeholder="Brand (e.g. Slingshot, Ride Engine)"
        />
      </div>

      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Hero Video URL (YouTube)</Typography.Text>
        <Input
          value={draft.info?.video_url ?? ''}
          style={{ width: '100%', maxWidth: '80vw' }}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, video_url: e.target.value },
            }))
          }
          placeholder="https://www.youtube.com/watch?v=..."
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

      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Product Colors</Typography.Text>
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {sortedProductColors.length ? (
            sortedProductColors.map((color) => {
              const checked = color.is_visible !== false;
              return (
                <Checkbox
                  key={color.id}
                  checked={checked}
                  onChange={() => handleToggleColor(color)}
                  disabled={updatingColorId === color.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 4,
                    borderRadius: 8,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  title={`${color.name_en} / ${color.name_bg}`}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 12,
                      backgroundColor: color.hex_color || '#000',
                      border: '1px solid #e0e0e0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                </Checkbox>
              );
            })
          ) : (
            <Typography.Text type="secondary">No colors yet</Typography.Text>
          )}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Collections</Typography.Text>
        <Space wrap>
          {(draft.collection_ids || []).length > 0 ? (
            (draft.collection_ids || []).map(id => {
              const col = collections.find(c => c.id === id);
              return col ? <div key={id} style={{ padding: '4px 12px', background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13 }}>{col.title}</div> : null;
            })
          ) : (
            <Typography.Text type="secondary">Not in any collection</Typography.Text>
          )}
        </Space>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
          Collections are managed from the collections page.
        </Typography.Text>
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

      <BilingualTags
        label="Tags"
        enValue={draft.translation_en?.tags}
        bgValue={draft.translation_bg?.tags}
        onEnChange={(val) => updateTranslationEN('tags', val)}
        onBgChange={(val) => updateTranslationBG('tags', val)}
        placeholder="Add tags"
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
