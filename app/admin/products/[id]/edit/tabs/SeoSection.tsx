'use client';

import { useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Typography, message, Tag } from 'antd';
import { RobotOutlined, CheckCircleOutlined, WarningOutlined, TranslationOutlined } from '@ant-design/icons';

export type SeoData = {
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  canonical_url?: string;
  meta_robots?: string;
  seo_score?: number;
};

type SeoSectionProps = {
  language: 'en' | 'bg';
  seoData: SeoData;
  onChange: (field: keyof SeoData, value: any) => void;
  onTranslate?: () => Promise<void>;
  isTranslating?: boolean;
};

export default function SeoSection({ language, seoData, onChange, onTranslate, isTranslating }: SeoSectionProps) {
  const languageLabel = language === 'en' ? 'English' : 'Bulgarian';
  const languageColor = language === 'en' ? 'blue' : 'orange';

  const getSeoScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <Tag color={languageColor}>{languageLabel}</Tag>
          <Typography.Text strong>SEO Metadata</Typography.Text>
        </Space>
      }
      extra={
        language === 'bg' && onTranslate && (
          <Button
            size="small"
            icon={<TranslationOutlined />}
            onClick={onTranslate}
            loading={isTranslating}
          >
            Translate with AI
          </Button>
        )
      }
      style={{ height: '100%' }}
    >
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Typography.Text strong style={{ fontSize: 12 }}>SEO Title</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 10, marginLeft: 8 }}>
            ({(seoData.seo_title || '').length}/60)
          </Typography.Text>
          <Input
            size="small"
            value={seoData.seo_title || ''}
            onChange={(e) => onChange('seo_title', e.target.value)}
            placeholder="Search engine title"
            maxLength={60}
          />
        </div>

        <div>
          <Typography.Text strong style={{ fontSize: 12 }}>SEO Description</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 10, marginLeft: 8 }}>
            ({(seoData.seo_description || '').length}/160)
          </Typography.Text>
          <Input.TextArea
            size="small"
            value={seoData.seo_description || ''}
            onChange={(e) => onChange('seo_description', e.target.value)}
            placeholder="Search engine description"
            maxLength={160}
            rows={2}
          />
        </div>

        <div>
          <Typography.Text strong style={{ fontSize: 12 }}>Meta Keywords</Typography.Text>
          <Input
            size="small"
            value={seoData.meta_keywords || ''}
            onChange={(e) => onChange('meta_keywords', e.target.value)}
            placeholder="keyword1, keyword2..."
          />
        </div>

        <div>
          <Typography.Text strong style={{ fontSize: 12 }}>Social Title (OG)</Typography.Text>
          <Input
            size="small"
            value={seoData.og_title || ''}
            onChange={(e) => onChange('og_title', e.target.value)}
            placeholder="OG Title"
          />
        </div>

        <div>
          <Typography.Text strong style={{ fontSize: 12 }}>Social Description (OG)</Typography.Text>
          <Input.TextArea
            size="small"
            value={seoData.og_description || ''}
            onChange={(e) => onChange('og_description', e.target.value)}
            placeholder="OG Description"
            rows={2}
          />
        </div>
      </Space>
    </Card>
  );
}
