'use client';

import { Button, Card, Space, Table, Tag, Typography } from 'antd';

const inquiryRows = [
  {
    key: '1',
    id: 'IQ-1042',
    user: 'Guest',
    products: 'Machine V4 10m (2)',
    status: 'new',
    createdAt: '2024-02-10 09:12',
  },
  {
    key: '2',
    id: 'IQ-1039',
    user: 'lucy@example.com',
    products: 'Code V2 138 (1)',
    status: 'replied',
    createdAt: '2024-02-09 17:40',
  },
];

export default function InquiriesPage() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Inquiries
      </Typography.Title>

      <Card>
        <Table
          dataSource={inquiryRows}
          pagination={false}
          columns={[
            { title: 'Inquiry ID', dataIndex: 'id', width: 120 },
            { title: 'User', dataIndex: 'user' },
            { title: 'Products', dataIndex: 'products' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (value: string) => (
                <Tag color={value === 'new' ? 'red' : value === 'replied' ? 'blue' : 'default'}>{value}</Tag>
              ),
              width: 120,
            },
            { title: 'Created at', dataIndex: 'createdAt', width: 180 },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small">Mark replied</Button>
                  <Button size="small" type="default">
                    Add note
                  </Button>
                  <Button size="small" type="link">
                    Export
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

