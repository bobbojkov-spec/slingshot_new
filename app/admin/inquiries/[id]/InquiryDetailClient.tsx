"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Select, Tag, Popconfirm } from 'antd';
import { useRouter } from 'next/navigation';

type InquiryItem = {
  product_name: string;
  product_slug: string | null;
  product_image: string | null;
  variant_id: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number | null;
};

type InquiryDetail = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_message: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  is_archived?: boolean;
};

const STATUS_OPTIONS = ['new', 'processing', 'done'];

const STATUS_COLORS: Record<string, string> = {
  new: 'blue',
  processing: 'orange',
  done: 'green',
};

export default function InquiryDetailClient({ inquiryId }: { inquiryId: string }) {
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/inquiries/${inquiryId}`);
    const json = await res.json();
    if (json?.inquiry) {
      setInquiry(json.inquiry);
      setItems(json.items || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [inquiryId]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchData();
  };

  const toggleArchive = async () => {
    await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: !inquiry?.is_archived }),
    });
    await fetchData();
  };

  const deleteInquiry = async () => {
    await fetch(`/api/admin/inquiries/${inquiryId}`, { method: 'DELETE' });
    router.push('/admin/inquiries');
  };

  if (loading || !inquiry) {
    return <div className="py-12 text-center text-gray-400">Loading...</div>;
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + Header */}
      <div>
        <Link href="/admin/inquiries" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          &larr; Back to inquiries
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{inquiry.customer_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Tag color={STATUS_COLORS[inquiry.status] || 'default'} className="!m-0">
              {inquiry.status}
            </Tag>
            {inquiry.is_archived && <Tag color="gold" className="!m-0">archived</Tag>}
            <span className="text-sm text-gray-500">
              {new Date(inquiry.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <Select
            value={inquiry.status}
            onChange={updateStatus}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            style={{ minWidth: 140 }}
          />
          <Button onClick={toggleArchive}>
            {inquiry.is_archived ? 'Unarchive' : 'Archive'}
          </Button>
          <Popconfirm title="Delete this inquiry permanently?" onConfirm={deleteInquiry}>
            <Button danger>Delete</Button>
          </Popconfirm>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Customer Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</div>
            <a href={`mailto:${inquiry.customer_email}`} className="text-sm text-blue-600 hover:underline">
              {inquiry.customer_email}
            </a>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</div>
            <a href={`tel:${inquiry.customer_phone}`} className="text-sm text-gray-800">
              {inquiry.customer_phone}
            </a>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Submitted</div>
            <div className="text-sm text-gray-800">
              {new Date(inquiry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {inquiry.updated_at && inquiry.updated_at !== inquiry.created_at && (
                <span className="text-gray-400"> (updated {new Date(inquiry.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})</span>
              )}
            </div>
          </div>
        </div>

        {inquiry.customer_message && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Message</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.customer_message}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Products ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h3>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-gray-400 py-4 text-center">No items in this inquiry.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`${item.product_name}-${index}`}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                {/* Thumbnail */}
                {item.product_image ? (
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-20 h-20 object-contain rounded-md bg-white border border-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-md bg-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0 border border-gray-100">
                    No image
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">
                    {item.product_slug ? (
                      <Link
                        href={`/product/${item.product_slug}`}
                        className="hover:text-blue-600 transition-colors"
                        target="_blank"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      item.product_name
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {item.size && (
                      <span className="inline-flex items-center bg-white px-2 py-0.5 rounded border border-gray-200">
                        Size: {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="inline-flex items-center bg-white px-2 py-0.5 rounded border border-gray-200">
                        Color: {item.color}
                      </span>
                    )}
                  </div>
                </div>

                {/* Qty + Price */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium text-gray-800">
                    Qty: {item.quantity}
                  </div>
                  {item.price && (
                    <div className="text-sm text-gray-500 mt-0.5">
                      &euro;{Math.round(Number(item.price)).toLocaleString('de-DE')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
