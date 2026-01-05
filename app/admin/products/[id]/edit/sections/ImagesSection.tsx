'use client';

import { Alert, Button, Image, Select, Space, Upload, message } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';

type Product = {
  id?: string;
  images?: { id?: string; url: string; position?: number }[];
  [key: string]: any; // Allow additional properties
};

function normalizeImages(imgs: any[]) {
  return imgs.map((img, idx) => ({ ...img, position: idx + 1 }));
}

export default function ImagesSection({
  draft,
  setDraft,
}: {
  draft: Product;
  setDraft: React.Dispatch<React.SetStateAction<Product>>;
}) {
  const images = draft.images || [];

  const saveImages = async (imagesPayload: any[], deleteIds: string[]) => {
    if (!draft.id) throw new Error('Product ID is required');
    const payload = {
      productId: draft.id,
      images: normalizeImages(imagesPayload).map((img: any, idx: number) => ({ id: img.id, position: idx + 1 })),
      deleteIds,
    };
    const res = await fetch('/api/admin/products/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error || 'Save failed');
  };

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            style={{ border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}
          >
            <div
              style={{
                height: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa',
              }}
            >
              <Image
                src={img.url}
                alt={`Image ${idx + 1}`}
                height={140}
                width="auto"
                preview
                style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
            <div style={{ padding: 6, fontSize: 12, color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Position: {img.position ?? idx + 1}</span>
              <Space size={4}>
                <Button
                  size="small"
                  icon={<ArrowUpOutlined />}
                  onClick={async () => {
                    const next = [...images];
                    if (idx === 0) return;
                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                    const normalized = normalizeImages(next);
                    setDraft((prev) => ({ ...prev, images: normalized }));
                    try {
                      await saveImages(normalized, []);
                      message.success('Images saved');
                    } catch (err: any) {
                      message.error(err?.message || 'Save failed');
                    }
                  }}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  onClick={async () => {
                    const next = [...images];
                    if (idx === next.length - 1) return;
                    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                    const normalized = normalizeImages(next);
                    setDraft((prev) => ({ ...prev, images: normalized }));
                    try {
                      await saveImages(normalized, []);
                      message.success('Images saved');
                    } catch (err: any) {
                      message.error(err?.message || 'Save failed');
                    }
                  }}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={async () => {
                    const remaining = images.filter((_, i) => i !== idx);
                    const normalized = normalizeImages(remaining);
                    const delIds = img.id ? [img.id] : [];
                    setDraft((prev) => ({ ...prev, images: normalized }));
                    try {
                      await saveImages(normalized, delIds);
                      message.success('Images saved');
                    } catch (err: any) {
                      message.error(err?.message || 'Save failed');
                    }
                  }}
                />
              </Space>
            </div>
          </div>
        ))}
        {(!images || images.length === 0) && <Alert type="info" message="No images" showIcon />}
      </div>
      <Space size={8}>
        <Upload
          multiple
          showUploadList={false}
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              const form = new FormData();
              form.append('file', file as Blob);
              form.append('productId', draft.id || '');
              form.append('position', String((images.length || 0) + 1));
              const res = await fetch('/api/admin/products/images', {
                method: 'POST',
                body: form,
              });
              const body = await res.json();
              if (!res.ok) throw new Error(body?.error || 'Upload failed');
              const newImg = body.image;
              const next = normalizeImages([...(images || []), newImg]);
              setDraft((prev) => ({ ...prev, images: next }));
              await saveImages(next, []);
              message.success('Image uploaded and saved');
              onSuccess?.(body, file as any);
            } catch (err: any) {
              onError?.(err);
              message.error(err?.message || 'Upload failed');
            }
          }}
        >
          <Button icon={<InboxOutlined />}>Upload image</Button>
        </Upload>
        <Select
          disabled
          size="small"
          value="original"
          options={[{ label: 'Aspect: Original', value: 'original' }]}
          style={{ width: 160 }}
        />
      </Space>
    </Space>
  );
}


