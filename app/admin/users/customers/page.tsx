'use client';

import { Card, Space, Table, Typography } from 'antd';

const customerRows = [
  { key: '1', name: 'Lucy Rivers', email: 'lucy@example.com', phone: '555-1234', inquiries: 3, registeredAt: '2023-11-02' },
  { key: '2', name: 'Guest', email: 'guest', phone: '-', inquiries: 5, registeredAt: '-' },
];

export default function CustomersPage() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Customers
      </Typography.Title>

      <Card>
        <Table
          dataSource={customerRows}
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Phone', dataIndex: 'phone' },
            { title: 'Inquiries count', dataIndex: 'inquiries', width: 140 },
            { title: 'Registered at', dataIndex: 'registeredAt', width: 140 },
          ]}
        />
      </Card>
    </Space>
  );
}

