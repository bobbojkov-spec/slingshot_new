'use client';

import { Card, Form, Input, Select, Space, Switch, Table, Typography } from 'antd';

const heroRows = [
  {
    key: '1',
    title: 'Ride the Wind',
    position: 'homepage',
    active: true,
    cta: 'Shop Kites',
  },
  { key: '2', title: 'Shop Boards', position: 'category', active: false, cta: 'View Boards' },
];

export default function HeroSectionsPage() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Hero Sections
      </Typography.Title>

      <Card title="Hero list">
        <Table
          pagination={false}
          dataSource={heroRows}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            { title: 'Position', dataIndex: 'position' },
            { title: 'CTA', dataIndex: 'cta' },
            { title: 'Active', dataIndex: 'active', render: (value: boolean) => (value ? 'Yes' : 'No'), width: 80 },
          ]}
        />
      </Card>

      <Card title="Hero fields">
        <Form layout="vertical">
          <Form.Item label="Title">
            <Input placeholder="Hero title" />
          </Form.Item>
          <Form.Item label="Subtitle">
            <Input placeholder="Hero subtitle" />
          </Form.Item>
          <Form.Item label="Background image (desktop)">
            <Input placeholder="Upload / select" />
          </Form.Item>
          <Form.Item label="Background image (mobile)">
            <Input placeholder="Upload / select" />
          </Form.Item>
          <Form.Item label="CTA text">
            <Input placeholder="Shop now" />
          </Form.Item>
          <Form.Item label="CTA link">
            <Input placeholder="/collections" />
          </Form.Item>
          <Form.Item label="Position">
            <Select
              placeholder="Select position"
              options={[
                { label: 'Homepage', value: 'homepage' },
                { label: 'Category', value: 'category' },
                { label: 'Page', value: 'page' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Active" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}

