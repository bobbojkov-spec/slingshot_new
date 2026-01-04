 'use client';

import { Table, Typography, Button, Space } from 'antd';
import Link from 'next/link';

type Product = {
  id: string;
  title?: string;
  handle?: string;
  status?: string;
  availability?: string;
  updated_at?: string;
  created_at?: string;
};

export default function ProductsListClient({ products }: { products: Product[] }) {
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (_: any, record: Product) => record.title || record.handle || 'Untitled',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v: string) => v || '—',
    },
    {
      title: 'Availability',
      dataIndex: 'availability',
      render: (v: string) => v || '—',
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      render: (v: string, r: Product) => {
        const val = v || r.created_at;
        if (!val) return '—';
        const d = new Date(val);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString();
      },
    },
    {
      title: '',
      width: 120,
      render: (_: any, record: Product) => (
        <Space>
          <Link href={`/admin/products/${record.id}/edit`}>
            <Button type="link">Edit</Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size={16}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Products
      </Typography.Title>
      <Table<Product>
        rowKey="id"
        dataSource={products}
        columns={columns}
        pagination={{ pageSize: 20 }}
      />
    </Space>
  );
}


