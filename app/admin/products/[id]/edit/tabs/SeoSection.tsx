'use client';

import { useState } from 'react';
import { Button, Card, Col, Input, InputNumber, Row, Space, Tag, Typography, message } from 'antd';
import { RobotOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';

type SeoData = {
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

type SeoSectionProps = {
  productId: string;
  productTitle: string;
  productDescription: string;
  seoData: SeoData;
  onChange: (field: keyof SeoData, value: any) => void;
};

export default function SeoSection({ productId, productTitle, productDescription, seoData, onChange }: SeoSectionProps) {
  const [generating, setGenerating] = useState(false);

  const generateSEO = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/products/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          title: productTitle,
          description: productDescription,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to generate SEO');
      }

      // Update all SEO fields
      Object.entries(body.seo).forEach(([key, value]) => {
        onChange(key as keyof SeoData, value);
      });

      message.success('SEO data generated successfully!');
    } catch (err: any) {
      message.error(err?.message || 'Failed to generate SEO');
    } finally {
      setGenerating(false);
    }
  };

  const getSeoScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getSeoScoreIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return <CheckCircleOutlined />;
    return <WarningOutlined />;
  };

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>SEO & Social Media Optimization</span>
          {seoData.seo_score && (
            <Tag color={getSeoScoreColor(seoData.seo_score)} icon={getSeoScoreIcon(seoData.seo_score)}>
              Score: {seoData.seo_score}/100
            </Tag>
          )}
        </Space>
      }
      extra={
        <Button type="primary" icon={<RobotOutlined />} loading={generating} onClick={generateSEO}>
          Generate SEO with AI
        </Button>
      }
      style={{ marginBottom: 24 }}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {/* Search Engine Meta */}
        <div>
          <Typography.Title level={5}>Search Engine Optimization</Typography.Title>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Typography.Text strong>SEO Title</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                ({(seoData.seo_title || '').length}/60 characters - optimal: 50-60)
              </Typography.Text>
              <Input
                value={seoData.seo_title || ''}
                onChange={(e) => onChange('seo_title', e.target.value)}
                placeholder="Optimized title for search engines"
                maxLength={60}
                showCount
              />
            </Col>
            <Col span={24}>
              <Typography.Text strong>SEO Description</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                ({(seoData.seo_description || '').length}/160 characters - optimal: 120-160)
              </Typography.Text>
              <Input.TextArea
                value={seoData.seo_description || ''}
                onChange={(e) => onChange('seo_description', e.target.value)}
                placeholder="Compelling description for search results"
                maxLength={160}
                rows={3}
                showCount
              />
            </Col>
            <Col span={12}>
              <Typography.Text strong>Meta Keywords</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                (comma-separated)
              </Typography.Text>
              <Input
                value={seoData.meta_keywords || ''}
                onChange={(e) => onChange('meta_keywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
              />
            </Col>
            <Col span={12}>
              <Typography.Text strong>Meta Robots</Typography.Text>
              <Input
                value={seoData.meta_robots || 'index, follow'}
                onChange={(e) => onChange('meta_robots', e.target.value)}
                placeholder="index, follow"
              />
            </Col>
          </Row>
        </div>

        {/* Open Graph / Social Media */}
        <div>
          <Typography.Title level={5}>Social Media (Open Graph)</Typography.Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Typography.Text strong>OG Title</Typography.Text>
              <Input
                value={seoData.og_title || ''}
                onChange={(e) => onChange('og_title', e.target.value)}
                placeholder="Title for social media shares"
              />
            </Col>
            <Col span={12}>
              <Typography.Text strong>OG Image URL</Typography.Text>
              <Input
                value={seoData.og_image_url || ''}
                onChange={(e) => onChange('og_image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </Col>
            <Col span={24}>
              <Typography.Text strong>OG Description</Typography.Text>
              <Input.TextArea
                value={seoData.og_description || ''}
                onChange={(e) => onChange('og_description', e.target.value)}
                placeholder="Description for social media shares"
                rows={2}
              />
            </Col>
          </Row>
        </div>

        {/* Technical SEO */}
        <div>
          <Typography.Title level={5}>Technical SEO</Typography.Title>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Typography.Text strong>Canonical URL</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                (prevents duplicate content issues)
              </Typography.Text>
              <Input
                value={seoData.canonical_url || ''}
                onChange={(e) => onChange('canonical_url', e.target.value)}
                placeholder="https://yoursite.com/products/product-handle"
              />
            </Col>
          </Row>
        </div>

        {seoData.seo_generated_at && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Last generated: {new Date(seoData.seo_generated_at).toLocaleString()}
          </Typography.Text>
        )}
      </Space>
    </Card>
  );
}

