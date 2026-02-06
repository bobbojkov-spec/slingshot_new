"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Table, Tag, Button, Select, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { InquiryRecord } from '@/lib/inquiries';

type Props = {
  inquiries: InquiryRecord[];
};

const STATUS_OPTIONS = ['new', 'processing', 'done'];

export default function InquiriesClient({ inquiries }: Props) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(inquiries);
  const [includeArchived, setIncludeArchived] = useState(false);

  const refresh = async (include = includeArchived) => {
    const res = await fetch(`/api/admin/inquiries?includeArchived=${include}`);
    const json = await res.json();
    if (json?.data) setItems(json.data);
  };

  const data = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.customer_name, item.customer_email, item.customer_phone, item.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [search, items]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await refresh();
  };

  const toggleArchive = async (id: string, isArchived: boolean) => {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: !isArchived }),
    });
    await refresh();
  };

  const deleteRow = async (id: string) => {
    await fetch(`/api/admin/inquiries/${id}`, { method: 'DELETE' });
    await refresh();
  };

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
      render: (value: string, record) => (
        <Select
          value={value}
          onChange={(next) => updateStatus(record.id, next)}
          options={STATUS_OPTIONS.map((status) => ({ value: status, label: status }))}
          style={{ minWidth: 140 }}
        />
      ),
    },
    {
      title: 'Message',
      dataIndex: 'customer_message',
      key: 'customer_message',
      render: (value: string | null) => value || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_value, record) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/inquiries/${record.id}`}>
            <Button size="small">View</Button>
          </Link>
          <Button size="small" onClick={() => toggleArchive(record.id, (record as any).is_archived)}>
            {(record as any).is_archived ? 'Unarchive' : 'Archive'}
          </Button>
          <Popconfirm
            title="Delete inquiry?"
            onConfirm={() => deleteRow(record.id)}
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold">Inquiries</h1>
          <div className="flex items-center gap-2">
            <Tag color={includeArchived ? 'gold' : 'blue'}>
              {includeArchived ? 'Including archived' : 'Active only'}
            </Tag>
            <Button size="small" onClick={() => {
              const next = !includeArchived;
              setIncludeArchived(next);
              refresh(next);
            }}>
              {includeArchived ? 'Hide archived' : 'Show archived'}
            </Button>
          </div>
        </div>
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