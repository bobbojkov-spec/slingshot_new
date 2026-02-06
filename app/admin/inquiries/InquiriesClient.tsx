"use client";

import { useMemo, useState } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { InquiryRecord } from '@/lib/inquiries';

type Props = {
  inquiries: InquiryRecord[];
};

export default function InquiriesClient({ inquiries }: Props) {
  const [search, setSearch] = useState('');

  const data = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inquiries;
    return inquiries.filter((item) =>
      [item.customer_name, item.customer_email, item.customer_phone, item.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [search, inquiries]);

  const columns: ColumnsType<InquiryRecord> = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Email',
      dataIndex: 'customer_email',
      key: 'customer_email',
    },
    {
      title: 'Phone',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Message',
      dataIndex: 'customer_message',
      key: 'customer_message',
      render: (value: string | null) => value || '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Inquiries</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone..."
          className="w-full max-w-md rounded border border-border px-3 py-2"
        />
      </div>
      <Table
        rowKey="id"
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}