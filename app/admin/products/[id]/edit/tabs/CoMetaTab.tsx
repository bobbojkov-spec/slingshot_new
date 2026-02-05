'use client';

import { useState } from 'react';
import { Button, Row, Col, Space, message, Card, Alert, Collapse } from 'antd';
import { RobotOutlined, InfoCircleOutlined } from '@ant-design/icons';
import SeoSection, { SeoData } from './SeoSection';
import type { Product } from '../EditProduct';

export default function CoMetaTab({
  draft,
  setDraft,
}: {
  draft: Product;
  setDraft: React.Dispatch<React.SetStateAction<Product>>;
}) {
  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState(false);

  const handleSeoChange = (lang: 'en' | 'bg', field: keyof SeoData, value: any) => {
    const translationKey = lang === 'en' ? 'translation_en' : 'translation_bg';
    setDraft((prev) => ({
      ...prev,
      [translationKey]: { ...prev[translationKey], [field]: value },
    }));
  };

  const generateSEO = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/products/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: draft.id,
          title: draft.translation_en?.title || draft.info?.title || '',
          description: draft.translation_en?.description_html || draft.info?.description_html || '',
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to generate SEO');

      // Fill BOTH En and Bulgarian inputs with the generated English content
      // User can then click "Translate with AI" for Bulgarian
      const seo = body.seo;
      setDraft((prev) => ({
        ...prev,
        translation_en: {
          ...prev.translation_en,
          seo_title: seo.seo_title,
          seo_description: seo.seo_description,
          meta_keywords: seo.meta_keywords,
          og_title: seo.og_title,
          og_description: seo.og_description,
        },
        translation_bg: {
          ...prev.translation_bg,
          seo_title: seo.seo_title,
          seo_description: seo.seo_description,
          meta_keywords: seo.meta_keywords,
          og_title: seo.og_title,
          og_description: seo.og_description,
        },
        // Also update legacy info fields if needed for compatibility
        info: {
          ...prev.info,
          ...seo
        }
      }));

      message.success('SEO data generated for both languages!');
    } catch (err: any) {
      message.error(err?.message || 'Failed to generate SEO');
    } finally {
      setGenerating(false);
    }
  };

  const translateToBulgarian = async () => {
    const enSeo = {
      seo_title: draft.translation_en?.seo_title,
      seo_description: draft.translation_en?.seo_description,
      meta_keywords: draft.translation_en?.meta_keywords,
      og_title: draft.translation_en?.og_title,
      og_description: draft.translation_en?.og_description,
    };

    if (!enSeo.seo_title && !enSeo.seo_description) {
      message.warning('Please generate or enter English SEO data first');
      return;
    }

    setTranslating(true);
    try {
      const res = await fetch('/api/admin/products/translate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: enSeo }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Translation failed');

      const bgSeo = body.translatedFields;
      setDraft((prev) => ({
        ...prev,
        translation_bg: {
          ...prev.translation_bg,
          ...bgSeo
        }
      }));

      message.success('SEO translated to Bulgarian successfully!');
    } catch (err: any) {
      message.error(err?.message || 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <Alert
        message="SEO is Auto-Generated"
        description="Meta tags (title, description, keywords) are automatically generated from product name, brand, category, tags, and collections. No manual input required for most products."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Collapse
        defaultActiveKey={[]}
        items={[
          {
            key: 'manual-seo',
            label: 'Advanced: Manual SEO Override',
            children: (
              <>
                <Card
                  styles={{ body: { padding: 16 } }}
                  style={{ marginBottom: 24 }}
                >
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0 }}>SEO & Meta Management</h3>
                        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Override auto-generated SEO for special cases.</p>
                      </div>
                      <Button
                        type="primary"
                        icon={<RobotOutlined />}
                        loading={generating}
                        onClick={generateSEO}
                        size="large"
                      >
                        Generate SEO (EN & BG)
                      </Button>
                    </div>
                  </Space>
                </Card>

                <Row gutter={24}>
                  <Col span={12}>
                    <SeoSection
                      language="en"
                      seoData={draft.translation_en || {}}
                      onChange={(field, value) => handleSeoChange('en', field, value)}
                    />
                  </Col>
                  <Col span={12}>
                    <SeoSection
                      language="bg"
                      seoData={draft.translation_bg || {}}
                      onChange={(field, value) => handleSeoChange('bg', field, value)}
                      onTranslate={translateToBulgarian}
                      isTranslating={translating}
                    />
                  </Col>
                </Row>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
