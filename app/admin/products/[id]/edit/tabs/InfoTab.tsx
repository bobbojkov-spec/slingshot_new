'use client';

import { useEffect, useMemo } from 'react';
import { Input, Select, Space, Typography } from 'antd';
import { useQuill } from 'react-quilljs';
import type { Product } from '../EditProduct';

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
  const tagsValue = Array.isArray(draft.info?.tags) ? draft.info?.tags?.join(', ') : draft.info?.tags || '';

  const categoryOptions = useMemo<Option[]>(
    () => (categories || []).map((c) => ({ label: c.name, value: c.id })),
    [categories]
  );

  const productTypeOptions = useMemo<Option[]>(
    () => (productTypes || []).map((t) => ({ label: t, value: t })),
    [productTypes]
  );

  const { quill, quillRef } = useQuill();
  const { quill: quill2, quillRef: quillRef2 } = useQuill();

  useEffect(() => {
    if (quill) {
      quill.clipboard.dangerouslyPasteHTML(draft.info?.description_html || '');
      const handler = () =>
        setDraft((prev) => ({
          ...prev,
          info: { ...prev.info, description_html: quill.root.innerHTML },
        }));
      quill.on('text-change', handler);
      return () => {
        quill.off('text-change', handler);
      };
    }
  }, [quill, draft.info?.description_html, setDraft]);

  useEffect(() => {
    if (quill2) {
      quill2.clipboard.dangerouslyPasteHTML(draft.info?.description_html2 || '');
      const handler = () =>
        setDraft((prev) => ({
          ...prev,
          info: { ...prev.info, description_html2: quill2.root.innerHTML },
        }));
      quill2.on('text-change', handler);
      return () => {
        quill2.off('text-change', handler);
      };
    }
  }, [quill2, draft.info?.description_html2, setDraft]);

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Name / Title</Typography.Text>
        <Input
          value={draft.info?.title ?? ''}
          style={{ width: '100%', maxWidth: '80vw' }}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, title: e.target.value, name: e.target.value },
            }))
          }
        />
      </div>
      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Handle</Typography.Text>
        <Input
          value={draft.info?.handle ?? ''}
          style={{ width: '100%', maxWidth: '80vw' }}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, handle: e.target.value },
            }))
          }
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
        <Typography.Text strong>Product type</Typography.Text>
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
        <Typography.Text strong>Tags (comma separated)</Typography.Text>
        <Select
          mode="tags"
          style={{ width: '100%', maxWidth: '80vw' }}
          value={Array.isArray(draft.info?.tags) ? draft.info?.tags : tagsValue ? tagsValue.split(',').map((t) => t.trim()).filter(Boolean) : []}
          onChange={(vals) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, tags: vals },
            }))
          }
          tokenSeparators={[',']}
          placeholder="Add tags"
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
      <div>
        <Typography.Text strong>Description HTML</Typography.Text>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, width: '100%', maxWidth: '80vw' }}>
          <div ref={quillRef} />
        </div>
      </div>
      <div>
        <Typography.Text strong>Description HTML 2</Typography.Text>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, width: '100%', maxWidth: '80vw' }}>
          <div ref={quillRef2} />
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Specs HTML</Typography.Text>
        <Input.TextArea
          rows={3}
          value={draft.info?.specs_html ?? ''}
          style={{ width: '100%', maxWidth: '80vw' }}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, specs_html: e.target.value },
            }))
          }
        />
      </div>
      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>Package includes</Typography.Text>
        <Input.TextArea
          rows={3}
          value={draft.info?.package_includes ?? ''}
          style={{ width: '100%', maxWidth: '80vw' }}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, package_includes: e.target.value },
            }))
          }
        />
      </div>
      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>SEO title</Typography.Text>
        <Input
          value={draft.info?.seo_title ?? ''}
          style={{ width: '100%', maxWidth: '80vw' }}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, seo_title: e.target.value },
            }))
          }
        />
      </div>
      <div style={{ width: '100%', maxWidth: '80vw' }}>
        <Typography.Text strong>SEO description</Typography.Text>
        <Input.TextArea
          rows={3}
          value={draft.info?.seo_description ?? ''}
          style={{ width: '100%', maxWidth: '80vw' }}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, seo_description: e.target.value },
            }))
          }
        />
      </div>
    </Space>
  );
}

