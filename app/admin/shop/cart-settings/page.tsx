'use client';

import { Card, Form, Input, Space, Typography } from 'antd';

export default function CartSettingsPage() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Cart Settings
      </Typography.Title>

      <Card>
        <Form layout="vertical">
          <Form.Item label="Inquiry button text">
            <Input placeholder="Request quote" />
          </Form.Item>
          <Form.Item label="Cart disclaimer text">
            <Input.TextArea rows={3} placeholder="Disclaimer shown in cart" />
          </Form.Item>
          <Form.Item label="Email recipient(s)">
            <Input placeholder="ops@example.com, sales@example.com" />
          </Form.Item>
          <Form.Item label="Auto-reply template">
            <Input.TextArea rows={4} placeholder="Auto-reply message" />
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}

