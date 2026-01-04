'use client';

import { useState } from 'react';
import { Button, Divider, Space, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import InfoSection from './sections/InfoSection';
import ImagesSection from './sections/ImagesSection';

type Product = {
  id?: string;
  title?: string;
  handle?: string;
  brand?: string;
  status?: string;
  availability?: string;
  category?: any;
  tags?: string[];
  description_html?: string;
  description_html2?: string;
  images?: any[];
  info?: {
    title?: string;
    subtitle?: string;
    description?: string;
    specs?: string;
    seo_title?: string;
    seo_description?: string;
  };
};

export default function EditProductClient({ product }: { product: Product }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Product>(() => structuredClone(product));
  const [saving, setSaving] = useState(false);

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%', padding: 16 }}>
      <Typography.Text>
        Products &gt; {draft.info?.title || draft.title || draft.handle || draft.id}
      </Typography.Text>
      <Space>
        <Button onClick={() => router.push('/admin/products')}>Cancel</Button>
        <Button
          type="primary"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            // Placeholder save; wire to real API as needed
            setSaving(false);
            router.push('/admin/products');
          }}
        >
          Save
        </Button>
      </Space>
      <Divider />
      <InfoSection draft={draft} setDraft={setDraft} />
      <ImagesSection draft={draft} setDraft={setDraft} />
    </Space>
  );
}


