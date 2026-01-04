'use client';

import { Card, Form, Input, Space, Switch, Table, Tabs, Typography } from 'antd';

const pageRows = [
  { key: '1', title: 'About', slug: 'about', published: true },
  { key: '2', title: 'Contact', slug: 'contact', published: true },
  { key: '3', title: 'Warranty', slug: 'warranty', published: false },
];

export default function PagesPage() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Pages
      </Typography.Title>

      <Card title="Pages list">
        <Table
          pagination={false}
          dataSource={pageRows}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            { title: 'Slug', dataIndex: 'slug' },
            { title: 'Published', dataIndex: 'published', render: (value: boolean) => (value ? 'Yes' : 'No'), width: 100 },
          ]}
        />
      </Card>

      <Card title="Page editor">
        <Tabs
          items={[
            {
              key: 'content',
              label: 'Content',
              children: (
                <Form layout="vertical">
                  <Form.Item label="Title">
                    <Input placeholder="Page title" />
                  </Form.Item>
                  <Form.Item label="Slug">
                    <Input placeholder="slug" />
                  </Form.Item>
                  <Form.Item label="Content (rich text)">
                    <Input.TextArea rows={6} placeholder="Content" />
                  </Form.Item>
                  <Form.Item label="Published" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'seo',
              label: 'SEO',
              children: (
                <Form layout="vertical">
                  <Form.Item label="Meta title">
                    <Input />
                  </Form.Item>
                  <Form.Item label="Meta description">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}

