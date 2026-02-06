"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Descriptions, Select, Tag } from 'antd';

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

export default function InquiryDetailClient({ inquiryId }: { inquiryId: string }) {
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading || !inquiry) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/inquiries" className="text-sm text-muted-foreground">← Back to inquiries</Link>
          <h1 className="text-2xl font-semibold mt-2">Inquiry {inquiry.id}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Tag color={inquiry.is_archived ? 'gold' : 'blue'}>
            {inquiry.is_archived ? 'Archived' : 'Active'}
          </Tag>
          <Button onClick={toggleArchive}>
            {inquiry.is_archived ? 'Unarchive' : 'Archive'}
          </Button>
        </div>
      </div>

      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Customer">
            {inquiry.customer_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {inquiry.customer_email}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {inquiry.customer_phone}
          </Descriptions.Item>
          <Descriptions.Item label="Message">
            {inquiry.customer_message || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Select
              value={inquiry.status}
              onChange={updateStatus}
              options={STATUS_OPTIONS.map((status) => ({ value: status, label: status }))}
              style={{ minWidth: 180 }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(inquiry.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Updated">
            {inquiry.updated_at ? new Date(inquiry.updated_at).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Items">
        <div className="space-y-4">
          {items.length === 0 && <div>No items.</div>}
          {items.map((item, index) => (
            <div key={`${item.product_name}-${index}`} className="flex items-center gap-4">
              {item.product_image && (
                <img src={item.product_image} alt={item.product_name} className="h-16 w-16 object-contain" />
              )}
              <div className="flex-1">
                <div className="font-semibold">
                  {item.product_slug ? (
                    <Link href={`/product/${item.product_slug}`}>{item.product_name}</Link>
                  ) : (
                    item.product_name
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {[item.size, item.color].filter(Boolean).join(' / ')}
                </div>
              </div>
              <div className="text-sm">Qty: {item.quantity}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}