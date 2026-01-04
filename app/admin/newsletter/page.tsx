'use client';

import { Button, Card, Input, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

const subscriberRows = [
  { key: '1', email: 'kite@wind.com', source: 'footer', subscribedAt: '2024-02-08', active: true },
  { key: '2', email: 'demo@example.com', source: 'popup', subscribedAt: '2024-02-07', active: false },
];

export default function NewsletterPage() {
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    // Newsletter signup logic
    console.log('Newsletter signup:', email);
    // TODO: Implement API call to subscribe email
    setEmail('');
  };

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Newsletter
      </Typography.Title>

      <Card title="Add Subscriber">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button type="primary" onClick={handleSubscribe}>
            Subscribe
          </Button>
        </Space.Compact>
      </Card>

      <Card>
        <Table
          dataSource={subscriberRows}
          pagination={false}
          columns={[
            { title: 'Email', dataIndex: 'email' },
            { title: 'Source', dataIndex: 'source', width: 120 },
            { title: 'Subscribed at', dataIndex: 'subscribedAt', width: 140 },
            {
              title: 'Active',
              dataIndex: 'active',
              render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag>,
              width: 100,
            },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small">Export CSV</Button>
                  <Button size="small" danger>
                    Deactivate
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}

