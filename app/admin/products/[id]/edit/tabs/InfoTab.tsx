'use client';

import { useMemo, useState, useEffect } from 'react';
import { Checkbox, Input, Select, Space, Typography, Divider, message, Upload, Button, Row, Col } from 'antd';
import { UploadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import type { Product } from '../EditProduct';
import BilingualInput from '@/app/admin/components/BilingualInput';
import BilingualRichText from '@/app/admin/components/BilingualRichText';
import BilingualTags from '@/app/admin/components/BilingualTags';

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
  const categoryOptions = useMemo<Option[]>(
    () => (categories || []).map((c) => ({ label: c.name, value: c.id })),
    [categories]
  );

  const [uploadingVideo, setUploadingVideo] = useState(false);

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

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hero-videos');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setDraft((prev) => ({
        ...prev,
        info: { ...prev.info, hero_video_url: data.url },
      }));
      message.success('Video uploaded successfully');
    } catch (error: any) {
      message.error(error.message || 'Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>

      {/* Row 1: Slug, Category, Brand */}
      <div>
        <Typography.Title level={5}>General Information</Typography.Title>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Handle (Slug)</Typography.Text>
              <Input
                value={draft.info?.handle ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    info: { ...prev.info, handle: e.target.value },
                  }))
                }
                placeholder="product-url-slug"
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Category</Typography.Text>
              <Select
                style={{ width: '100%' }}
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
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Brand</Typography.Text>
              <Select
                style={{ width: '100%' }}
                options={[
                  { label: 'Slingshot', value: 'Slingshot' },
                  { label: 'Ride Engine', value: 'Ride Engine' },
                ]}
                value={draft.info?.brand ?? undefined}
                onChange={(val) =>
                  setDraft((prev) => ({
                    ...prev,
                    info: { ...prev.info, brand: val },
                  }))
                }
                allowClear
                placeholder="Select Brand"
              />
            </div>
          </Col>
        </Row>
      </div>

      {/* Row 2: Hero Video (YouTube), Hero Video (Upload), Status */}
      <div>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Hero Video (YouTube)</Typography.Text>
              <Input
                prefix={<VideoCameraOutlined />}
                value={draft.info?.video_url ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    info: { ...prev.info, video_url: e.target.value },
                  }))
                }
                placeholder="https://youtube.com/..."
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Hero Video (MP4)</Typography.Text>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  value={draft.info?.hero_video_url ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      info: { ...prev.info, hero_video_url: e.target.value },
                    }))
                  }
                  placeholder="https://.../video.mp4"
                />
                <Upload
                  beforeUpload={(file) => {
                    handleVideoUpload(file);
                    return false;
                  }}
                  showUploadList={false}
                  accept="video/mp4,video/webm"
                >
                  <Button icon={<UploadOutlined />} loading={uploadingVideo} />
                </Upload>
              </div>
              {draft.info?.hero_video_url && (
                <div style={{ marginTop: 4 }}>
                  <VideoPreviewLink url={draft.info.hero_video_url} />
                </div>
              )}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Status</Typography.Text>
              <Select
                style={{ width: '100%' }}
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
          </Col>
        </Row>
      </div>

      {/* Row 2.5: Hero Image (Desktop/Wide) */}
      <div>
        <Row gutter={16}>
          <Col span={24}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Hero Image (Desktop/Wide)</Typography.Text>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  prefix={<UploadOutlined />}
                  value={draft.info?.hero_image_url ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      info: { ...prev.info, hero_image_url: e.target.value },
                    }))
                  }
                  placeholder="https://.../hero.jpg"
                />
                <Upload
                  beforeUpload={async (file) => {
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('folder', 'hero-images');

                      const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        body: formData,
                      });

                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Upload failed');

                      setDraft((prev) => ({
                        ...prev,
                        info: { ...prev.info, hero_image_url: data.url },
                      }));
                      message.success('Hero image uploaded');
                    } catch (error: any) {
                      message.error(error.message || 'Upload failed');
                    }
                    return false;
                  }}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} />
                </Upload>
              </div>
              {draft.info?.hero_image_url && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={draft.info.hero_image_url}
                    alt="Hero Preview"
                    style={{ maxHeight: 200, borderRadius: 8, border: '1px solid #ddd' }}
                  />
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 16 }}>
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

      <BilingualRichText
        label="Specs HTML"
        enValue={draft.translation_en?.specs_html}
        bgValue={draft.translation_bg?.specs_html}
        onEnChange={(val) => updateTranslationEN('specs_html', val)}
        onBgChange={(val) => updateTranslationBG('specs_html', val)}
      />

      <BilingualRichText
        label="Package Includes"
        enValue={draft.translation_en?.package_includes}
        bgValue={draft.translation_bg?.package_includes}
        onEnChange={(val) => updateTranslationEN('package_includes', val)}
        onBgChange={(val) => updateTranslationBG('package_includes', val)}
      />

    </Space >
  );
}

function VideoPreviewLink({ url }: { url: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    // Check if it needs signing
    if (url.includes('slingshot')) { // Simple check if it's our bucket
      fetch(`/api/admin/sign-url?path=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => {
          if (data.url) setSignedUrl(data.url);
        })
        .catch(() => setSignedUrl(url));
    } else {
      setSignedUrl(url);
    }
  }, [url]);

  if (!signedUrl) return null;

  return (
    <Typography.Link href={signedUrl} target="_blank" style={{ fontSize: 12 }}>
      Preview Uploaded Video
    </Typography.Link>
  );
}
