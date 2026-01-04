'use client';

import { Input, Space, Typography } from 'antd';

type Product = {
  id?: string;
  info?: {
    title?: string;
    subtitle?: string;
    description?: string;
    specs?: string;
    seo_title?: string;
    seo_description?: string;
  };
  [key: string]: any; // Allow additional properties
};

export default function InfoSection({
  draft,
  setDraft,
}: {
  draft: Product;
  setDraft: React.Dispatch<React.SetStateAction<Product>>;
}) {
  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      <Typography.Title level={5} style={{ margin: 0 }}>
        Info
      </Typography.Title>
      <div>
        <Typography.Text strong>Title</Typography.Text>
        <Input
          value={draft.info?.title ?? ''}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, title: e.target.value },
            }))
          }
        />
      </div>
      <div>
        <Typography.Text strong>Subtitle</Typography.Text>
        <Input
          value={draft.info?.subtitle ?? ''}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, subtitle: e.target.value },
            }))
          }
        />
      </div>
      <div>
        <Typography.Text strong>Description</Typography.Text>
        <Input.TextArea
          rows={4}
          value={draft.info?.description ?? ''}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, description: e.target.value },
            }))
          }
        />
      </div>
      <div>
        <Typography.Text strong>Specs</Typography.Text>
        <Input.TextArea
          rows={3}
          value={draft.info?.specs ?? ''}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, specs: e.target.value },
            }))
          }
        />
      </div>
      <div>
        <Typography.Text strong>SEO title</Typography.Text>
        <Input
          value={draft.info?.seo_title ?? ''}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              info: { ...prev.info, seo_title: e.target.value },
            }))
          }
        />
      </div>
      <div>
        <Typography.Text strong>SEO description</Typography.Text>
        <Input.TextArea
          rows={3}
          value={draft.info?.seo_description ?? ''}
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


