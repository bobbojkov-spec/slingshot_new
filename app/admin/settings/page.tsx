'use client';

import { Card, Col, Form, Input, Row, Select, Space, Typography } from 'antd';

export default function SettingsPage() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Settings
      </Typography.Title>

      <Card title="General">
        <Row gutter={16}>
          <Col span={12}>
            <Form layout="vertical">
              <Form.Item label="Shop name">
                <Input placeholder="Slingshot" />
              </Form.Item>
              <Form.Item label="Contact email">
                <Input placeholder="support@example.com" />
              </Form.Item>
              <Form.Item label="Phone">
                <Input placeholder="+1 555 1234" />
              </Form.Item>
            </Form>
          </Col>
          <Col span={12}>
            <Form layout="vertical">
              <Form.Item label="Language">
                <Select defaultValue="en" options={[{ label: 'English', value: 'en' }]} />
              </Form.Item>
              <Form.Item label="Currency">
                <Select defaultValue="EUR" options={[{ label: 'EUR', value: 'EUR' }]} />
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>

      <Card title="SEO Defaults">
        <Form layout="vertical">
          <Form.Item label="Default meta title">
            <Input />
          </Form.Item>
          <Form.Item label="Default meta description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Card>

      <Card title="Integrations (future)">
        <Typography.Text type="secondary">Placeholder for future integrations.</Typography.Text>
      </Card>
    </Space>
  );
}

