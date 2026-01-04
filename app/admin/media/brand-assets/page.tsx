'use client';

import { Card, Form, Input, Space, Typography } from 'antd';

export default function BrandAssetsPage() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Brand Assets
      </Typography.Title>

      <Card title="Assets">
        <Form layout="vertical">
          <Form.Item label="Logo (light)">
            <Input placeholder="Upload / select" />
          </Form.Item>
          <Form.Item label="Logo (dark)">
            <Input placeholder="Upload / select" />
          </Form.Item>
          <Form.Item label="Favicon">
            <Input placeholder="Upload / select" />
          </Form.Item>
          <Form.Item label="Footer logo">
            <Input placeholder="Upload / select" />
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}

