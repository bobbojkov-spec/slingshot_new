"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Tag, Button, Select, Popconfirm } from 'antd';
import type { InquiryWithItems } from '@/lib/inquiries';

type Props = {
  inquiries: InquiryWithItems[];
};

const STATUS_OPTIONS = ['new', 'processing', 'done'];

const STATUS_COLORS: Record<string, string> = {
  new: 'blue',
  processing: 'orange',
  done: 'green',
};

export default function InquiriesClient({ inquiries }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [items, setItems] = useState(inquiries);
  const [includeArchived, setIncludeArchived] = useState(searchParams.get('archived') === 'true');

  const updateUrl = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const refresh = async (include = includeArchived) => {
    const res = await fetch(`/api/admin/inquiries?includeArchived=${include}`);
    const json = await res.json();
    if (json?.data) setItems(json.data);
  };

  const data = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.customer_name, item.customer_email, item.customer_phone, item.status,
       ...item.items.map(i => i.product_name)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
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

  return (
    <div className="space-y-6">
      {/* Header */}
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
              updateUrl({ archived: next ? 'true' : undefined });
              refresh(next);
            }}>
              {includeArchived ? 'Hide archived' : 'Show archived'}
            </Button>
          </div>
        </div>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); updateUrl({ q: e.target.value || undefined }); }}
          placeholder="Search by name, email, phone, product..."
          className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Inquiry Cards */}
      <div className="space-y-4">
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-400">No inquiries found.</div>
        )}
        {data.map((inquiry) => (
          <div
            key={inquiry.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-4 p-4 pb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/admin/inquiries/${inquiry.id}`}
                    className="font-semibold text-base text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {inquiry.customer_name}
                  </Link>
                  <Tag color={STATUS_COLORS[inquiry.status] || 'default'} className="!m-0">
                    {inquiry.status}
                  </Tag>
                  {inquiry.is_archived && (
                    <Tag color="gold" className="!m-0">archived</Tag>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>{new Date(inquiry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span>{inquiry.customer_email}</span>
                  {inquiry.customer_phone && <span>{inquiry.customer_phone}</span>}
                </div>
                {inquiry.customer_message && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{inquiry.customer_message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={inquiry.status}
                  onChange={(next) => updateStatus(inquiry.id, next)}
                  options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                  size="small"
                  style={{ minWidth: 120 }}
                />
                <Link href={`/admin/inquiries/${inquiry.id}`}>
                  <Button size="small" type="primary" ghost>View</Button>
                </Link>
                <Button size="small" onClick={() => toggleArchive(inquiry.id, inquiry.is_archived)}>
                  {inquiry.is_archived ? 'Unarchive' : 'Archive'}
                </Button>
                <Popconfirm title="Delete inquiry?" onConfirm={() => deleteRow(inquiry.id)}>
                  <Button size="small" danger>Delete</Button>
                </Popconfirm>
              </div>
            </div>

            {/* Product Items Row */}
            {inquiry.items.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {inquiry.items.length} {inquiry.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {inquiry.items.map((item, idx) => (
                    <div
                      key={`${item.product_name}-${idx}`}
                      className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 pr-4 shrink-0 min-w-0"
                    >
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-14 h-14 object-contain rounded bg-white border border-gray-100"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs border border-gray-100">
                          No img
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate max-w-[180px]" title={item.product_name}>
                          {item.product_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {[item.size, item.color].filter(Boolean).join(' / ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Qty: {item.quantity}
                          {item.price ? ` · €${Math.round(Number(item.price)).toLocaleString('de-DE')}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
