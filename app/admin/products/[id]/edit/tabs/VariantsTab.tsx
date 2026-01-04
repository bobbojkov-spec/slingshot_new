'use client';

import { Table, Typography } from 'antd';
import type { Product } from '../EditProduct';

export default function VariantsTab({ draft }: { draft: Product }) {
  const variants = draft.variants || [];

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (_: any, record: any) => record.title || record.name || '—',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (val: any) => val || '—',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (val: any) => (val !== undefined && val !== null ? `$${val}` : '—'),
    },
    {
      title: 'Compare at',
      dataIndex: 'compare_at_price',
      key: 'compare_at_price',
      render: (val: any) => (val !== undefined && val !== null ? `$${val}` : '—'),
    },
    {
      title: 'Inventory',
      dataIndex: 'inventory_quantity',
      key: 'inventory_quantity',
      render: (val: any) => (val !== undefined && val !== null ? val : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: any, record: any) =>
        val || record.available || record.is_active || record.active || '—',
    },
  ];

  return (
    <>
      <Typography.Text>Variants are read-only for now.</Typography.Text>
      <Table
        size="small"
        style={{ marginTop: 12 }}
        rowKey={(row: any) => row.id || row.sku || row.title}
        dataSource={variants}
        columns={columns}
        pagination={false}
      />
    </>
  );
}

