'use client';

import { useState } from 'react';
import { Button, Table, Typography, Switch, Space, Input, InputNumber, Popconfirm, message, Modal, Form } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import type { Product } from '../EditProduct';

type Variant = {
  id?: string;
  title?: string;
  sku?: string;
  price?: number;
  compare_at_price?: number;
  inventory_quantity?: number;
  available?: boolean;
  status?: string;
};

export default function VariantsTab({
  draft,
  setDraft,
}: {
  draft: Product;
  setDraft: React.Dispatch<React.SetStateAction<Product>>;
}) {
  const [editingKey, setEditingKey] = useState<string>('');
  const [editForm, setEditForm] = useState<Variant>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const variants = draft.variants || [];

  const isEditing = (record: Variant) => record.id === editingKey;

  const startEdit = (record: Variant) => {
    setEditingKey(record.id || '');
    setEditForm({ ...record });
  };

  const cancelEdit = () => {
    setEditingKey('');
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch('/api/admin/products/variants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: id,
          data: editForm,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update variant');

      // Update local state
      setDraft((prev) => ({
        ...prev,
        variants: prev.variants?.map((v) => (v.id === id ? { ...v, ...editForm } : v)),
      }));

      message.success('Variant updated');
      setEditingKey('');
      setEditForm({});
    } catch (err: any) {
      message.error(err?.message || 'Failed to update variant');
    }
  };

  const toggleStatus = async (record: Variant) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/admin/products/variants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: record.id,
          data: { status: newStatus },
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update status');

      setDraft((prev) => ({
        ...prev,
        variants: prev.variants?.map((v) => (v.id === record.id ? { ...v, status: newStatus } : v)),
      }));

      message.success(`Variant ${newStatus}`);
    } catch (err: any) {
      message.error(err?.message || 'Failed to update status');
    }
  };

  const deleteVariant = async (id: string) => {
    try {
      const res = await fetch('/api/admin/products/variants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: id }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to delete variant');

      setDraft((prev) => ({
        ...prev,
        variants: prev.variants?.filter((v) => v.id !== id),
      }));

      message.success('Variant deleted');
    } catch (err: any) {
      message.error(err?.message || 'Failed to delete variant');
    }
  };

  const addVariant = async (values: any) => {
    try {
      const res = await fetch('/api/admin/products/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: draft.id,
          variant: values,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to create variant');

      setDraft((prev) => ({
        ...prev,
        variants: [...(prev.variants || []), body.variant],
      }));

      message.success('Variant added');
      setIsAddModalOpen(false);
      addForm.resetFields();
    } catch (err: any) {
      message.error(err?.message || 'Failed to create variant');
    }
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (_: any, record: Variant) => (
        <Switch
          checked={record.status === 'active'}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => toggleStatus(record)}
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (_: any, record: Variant) => {
        if (isEditing(record)) {
          return (
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          );
        }
        return record.title || record.name || '—';
      },
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (_: any, record: Variant) => {
        if (isEditing(record)) {
          return (
            <Input
              value={editForm.sku}
              onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
            />
          );
        }
        return record.sku || '—';
      },
    },
    {
      title: 'Price (€)',
      dataIndex: 'price',
      key: 'price',
      render: (_: any, record: Variant) => {
        if (isEditing(record)) {
          return (
            <InputNumber
              value={editForm.price}
              onChange={(val) => setEditForm({ ...editForm, price: val || 0 })}
              prefix="€"
              style={{ width: '100%' }}
            />
          );
        }
        return record.price !== undefined && record.price !== null ? `€${record.price}` : '—';
      },
    },
    {
      title: 'Compare at (€)',
      dataIndex: 'compare_at_price',
      key: 'compare_at_price',
      render: (_: any, record: Variant) => {
        if (isEditing(record)) {
          return (
            <InputNumber
              value={editForm.compare_at_price}
              onChange={(val) => setEditForm({ ...editForm, compare_at_price: val || undefined })}
              prefix="€"
              style={{ width: '100%' }}
            />
          );
        }
        return record.compare_at_price !== undefined && record.compare_at_price !== null
          ? `€${record.compare_at_price}`
          : '—';
      },
    },
    {
      title: 'Inventory',
      dataIndex: 'inventory_quantity',
      key: 'inventory_quantity',
      render: (_: any, record: Variant) => {
        if (isEditing(record)) {
          return (
            <InputNumber
              value={editForm.inventory_quantity}
              onChange={(val) => setEditForm({ ...editForm, inventory_quantity: val || 0 })}
              style={{ width: '100%' }}
            />
          );
        }
        return record.inventory_quantity !== undefined && record.inventory_quantity !== null
          ? record.inventory_quantity
          : '—';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Variant) => {
        if (isEditing(record)) {
          return (
            <Space size={4}>
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => saveEdit(record.id!)}
              >
                Save
              </Button>
              <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit}>
                Cancel
              </Button>
            </Space>
          );
        }

        return (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => startEdit(record)}
            />
            {record.status !== 'active' && (
              <Popconfirm
                title="Delete variant?"
                description="This action cannot be undone."
                onConfirm={() => deleteVariant(record.id!)}
                okText="Delete"
                okType="danger"
                cancelText="Cancel"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Text>
            Manage product variants. Only inactive variants can be deleted.
          </Typography.Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
            Add Variant
          </Button>
        </Space>

        <Table<Variant>
          size="small"
          rowKey={(row) => row.id || row.sku || row.title || Math.random().toString()}
          dataSource={variants}
          columns={columns}
          pagination={false}
          scroll={{ x: true }}
        />
      </Space>

      <Modal
        title="Add New Variant"
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          addForm.resetFields();
        }}
        onOk={() => addForm.submit()}
        okText="Add Variant"
      >
        <Form form={addForm} layout="vertical" onFinish={addVariant}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="e.g., Small / Black" />
          </Form.Item>
          <Form.Item name="sku" label="SKU">
            <Input placeholder="e.g., WF1-V6-SM-BLK" />
          </Form.Item>
          <Form.Item name="price" label="Price (€)" rules={[{ required: true, message: 'Price is required' }]}>
            <InputNumber prefix="€" style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="compare_at_price" label="Compare at Price (€)">
            <InputNumber prefix="€" style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="inventory_quantity" label="Inventory Quantity" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
