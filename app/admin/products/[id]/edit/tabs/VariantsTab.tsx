'use client';

import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { Button, Table, Typography, Switch, Space, Input, InputNumber, Popconfirm, message, Modal, Form, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import BilingualInput from '../../../../components/BilingualInput';
import type { Product } from '../EditProduct';

type Variant = {
  id?: string;
  title?: string;
  name_en?: string;
  name_bg?: string;
  sku?: string;
  price?: number;
  compare_at_price?: number;
  inventory_quantity?: number;
  available?: boolean;
  status?: string;
  position?: number;
  translation_en?: {
    title?: string;
  };
  translation_bg?: {
    title?: string;
  };
  product_color_id?: string;
};

type AvailabilityEntry = {
  variant_id: string;
  color_id: string;
  stock_qty: number;
  is_active: boolean;
};

type SharedColor = {
  id: string;
  name_en: string;
  name_bg?: string;
  hex_color: string;
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
  const [isBilingualModalOpen, setIsBilingualModalOpen] = useState(false);
  const [bilingualEditForm, setBilingualEditForm] = useState<{
    variant?: Variant;
    translation_en: { title: string };
    translation_bg: { title: string };
  }>({
    translation_en: { title: '' },
    translation_bg: { title: '' },
  });
  const [addForm] = Form.useForm();
  const [savingAvailabilityKey, setSavingAvailabilityKey] = useState<string>('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSharedColor, setSelectedSharedColor] = useState<SharedColor | null>(null);
  const [assignPosition, setAssignPosition] = useState(0);
  const [sharedColors, setSharedColors] = useState<SharedColor[]>([]);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  useEffect(() => {
    const loadSharedColors = async () => {
      try {
        const res = await fetch("/api/admin/colors");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load colors");
        setSharedColors(data.colors ?? []);
      } catch (err: any) {
        message.error(err?.message || "Unable to load colors");
      }
    };
    loadSharedColors();
  }, []);

  const variants = draft.variants || [];
  const colors = draft.colors || [];
  const availability = draft.availability || [];

  const sortedColors = useMemo(
    () => [...colors].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [colors]
  );
  const visibleColors = useMemo(
    () => sortedColors.filter((color) => color.is_visible !== false),
    [sortedColors]
  );
  const sortedVariants = useMemo(
    () => [...variants].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [variants]
  );

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

      setDraft((prev) => ({
        ...prev,
        variants: prev.variants?.map((v) =>
          v.id === id ? { ...v, ...editForm } : v
        ),
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
        availability: prev.availability?.filter((entry) => entry.variant_id !== id),
      }));

      message.success('Variant deleted');
    } catch (err: any) {
      message.error(err?.message || 'Failed to delete variant');
    }
  };

  const addVariant = async (values: any) => {
    try {
      const payload = {
        title: values.title,
        sku: values.sku,
        price: values.price,
        compare_at_price: values.compare_at_price,
        inventory_quantity: values.inventory_quantity ?? 0,
        name_en: values.name_en || values.title,
        name_bg: values.name_bg || '',
        position: values.position ?? 0,
      };

      const res = await fetch('/api/admin/products/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: draft.id,
          variant: payload,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to create variant');

      setDraft((prev) => ({
        ...prev,
        variants: [...(prev.variants || []), body.variant],
        availability: [...(prev.availability || []), ...(body.availability || [])],
      }));

      message.success('Variant added');
      setIsAddModalOpen(false);
      addForm.resetFields();
    } catch (err: any) {
      message.error(err?.message || 'Failed to create variant');
    }
  };

  const openBilingualModal = (record: Variant) => {
    setBilingualEditForm({
      variant: record,
      translation_en: {
        title: record.translation_en?.title || record.title || record.name_en || '',
      },
      translation_bg: {
        title: record.translation_bg?.title || record.name_bg || '',
      },
    });
    setIsBilingualModalOpen(true);
  };

  const saveBilingualEdit = async () => {
    if (!bilingualEditForm.variant) return;

    try {
      const res = await fetch('/api/admin/products/variants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: bilingualEditForm.variant.id,
          data: {},
          translation_en: bilingualEditForm.translation_en,
          translation_bg: bilingualEditForm.translation_bg,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update translations');

      setDraft((prev) => ({
        ...prev,
        variants: prev.variants?.map((v) =>
          v.id === bilingualEditForm.variant?.id
            ? {
              ...v,
              translation_en: bilingualEditForm.translation_en,
              translation_bg: bilingualEditForm.translation_bg,
            }
            : v
        ),
      }));

      message.success('Variant translations updated');
      setIsBilingualModalOpen(false);
    } catch (err: any) {
      message.error(err?.message || 'Failed to update translations');
    }
  };

  const handleAssignColor = async () => {
    if (!draft.id || !selectedSharedColor) return;
    setLoadingAssignment(true);
    try {
      const res = await fetch(`/api/admin/products/${draft.id}/color-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorId: selectedSharedColor.id, position: assignPosition }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to assign color');
      setDraft((prev) => ({
        ...prev,
        colors: [...(prev.colors || []), {
          id: data.assignment.id,
          color_id: selectedSharedColor.id,
          position: data.assignment.position,
          name_en: selectedSharedColor.name_en,
          name_bg: selectedSharedColor.name_bg,
          hex_color: selectedSharedColor.hex_color,
        }],
      }));
      message.success('Color assigned to product');
      setAssignModalOpen(false);
      setSelectedSharedColor(null);
    } catch (err: any) {
      message.error(err?.message || 'Failed to assign color');
    } finally {
      setLoadingAssignment(false);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!draft.id) return;
    try {
      const res = await fetch(`/api/admin/products/${draft.id}/color-assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to remove color');
      setDraft((prev) => ({
        ...prev,
        colors: prev.colors?.filter((color) => color.id !== assignmentId),
        availability: prev.availability?.filter((entry) => entry.color_id !== assignmentId),
      }));
      message.success('Color removed from product');
    } catch (err: any) {
      message.error(err?.message || 'Unable to remove color');
    }
  };

  const getAvailabilityEntry = (variantId: string, colorId: string): AvailabilityEntry => {
    const entry = availability.find((row) => row.variant_id === variantId && row.color_id === colorId);
    if (entry) {
      return entry as AvailabilityEntry;
    }
    return {
      variant_id: variantId,
      color_id: colorId,
      stock_qty: 0,
      is_active: false,
    };
  };

  const saveAvailabilityCell = async (
    variantId: string,
    colorId: string,
    overrides: Partial<AvailabilityEntry>
  ) => {
    if (!draft.id) return;

    const key = `${variantId}-${colorId}`;
    const existing = getAvailabilityEntry(variantId, colorId);
    const payload = {
      variant_id: variantId,
      color_id: colorId,
      stock_qty: overrides.stock_qty ?? existing.stock_qty,
      is_active: overrides.is_active ?? existing.is_active,
    };

    setSavingAvailabilityKey(key);
    try {
      const res = await fetch(`/api/admin/products/${draft.id}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [payload] }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to save availability');

      setDraft((prev) => ({
        ...prev,
        availability: [
          ...(prev.availability?.filter(
            (entry) => !(entry.variant_id === variantId && entry.color_id === colorId)
          ) || []),
          ...(body.entries || []),
        ],
      }));
    } catch (err: any) {
      message.error(err?.message || 'Failed to save availability');
    } finally {
      setSavingAvailabilityKey('');
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
      title: 'Title (EN)',
      dataIndex: 'title',
      key: 'title',
      render: (_: any, record: Variant) => {
        if (isEditing(record)) {
          return (
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value, name_en: e.target.value })}
            />
          );
        }
        return record.title || record.name_en || '—';
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
      title: 'Visual Color',
      key: 'product_color_id',
      width: 150,
      render: (_: any, record: Variant) => {
        const visualColors = draft.product_colors || [];
        // If editing
        if (isEditing(record)) {
          return (
            <Select
              style={{ width: '100%' }}
              allowClear
              value={editForm.product_color_id}
              onChange={(val) => setEditForm({ ...editForm, product_color_id: val })}
            >
              {visualColors.map((c: any) => (
                <Select.Option key={c.id} value={c.id}>
                  <Space>
                    <img src={c.url || c.image_path} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    {c.name || 'Unnamed'}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          );
        }
        // Read only
        const color = visualColors.find((c: any) => c.id === record.product_color_id);
        if (!color) return '—';
        return (
          <Space>
            <div style={{ width: 20, height: 20, borderRadius: 2, border: '1px solid #ddd', overflow: 'hidden' }}>
              <img src={color.url || color.image_path} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <Typography.Text style={{ fontSize: 12 }}>{color.name}</Typography.Text>
          </Space>
        );
      }
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
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      render: (_: any, record: Variant) => {
        if (isEditing(record)) {
          return (
            <InputNumber
              value={editForm.position}
              onChange={(val) => setEditForm({ ...editForm, position: val ?? 0 })}
              style={{ width: '100%' }}
            />
          );
        }
        return record.position !== undefined ? record.position : '—';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
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
              title="Quick edit"
            />
            <Button
              type="link"
              size="small"
              onClick={() => openBilingualModal(record)}
              title="Edit translations"
            >
              🌐
            </Button>
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
      <Space orientation="vertical" size={24} style={{ width: '100%' }}>
        <CardSection
          title="Product Variants"
          description="Add pricing, SKU and inventory per variant."
          action={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
              Add Variant
            </Button>
          }
        >
          <Table<Variant>
            size="small"
            rowKey={(row) => row.id || row.sku || row.title || Math.random().toString()}
            dataSource={sortedVariants}
            columns={columns}
            pagination={false}
            scroll={{ x: true }}
          />
        </CardSection>

        <CardSection
          title="Product Colors"
          description="Assign shared colors from the central catalog to this product."
          action={
            <Space>
              <Button type="default" icon={<PlusOutlined />} onClick={() => setAssignModalOpen(true)}>
                Assign Color
              </Button>
              <a href="/admin/colors" target="_blank" rel="noreferrer">
                Manage catalog
              </a>
            </Space>
          }
        >
          <Table
            size="small"
            rowKey={(row) => row.id}
            dataSource={sortedColors}
            pagination={false}
            columns={[
              { title: 'Name (EN)', dataIndex: 'name_en', key: 'name_en' },
              { title: 'Name (BG)', dataIndex: 'name_bg', key: 'name_bg' },
              {
                title: 'Color',
                key: 'color',
                render: (_: any, record: any) => (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: '1px solid #e0e0e0',
                      backgroundColor: record.hex_color || '#000',
                      margin: '0 auto',
                    }}
                  />
                ),
              },
              {
                title: 'Position',
                dataIndex: 'position',
                key: 'position',
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_: any, record: any) => (
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeAssignment(record.id)}
                  >
                    Remove
                  </Button>
                ),
              },
            ]}
          />
        </CardSection>

        <CardSection
          title="Availability Matrix"
          description="Update stock and activation per variant × color cell."
        >
          {!(visibleColors.length && sortedVariants.length) ? (
            <Typography.Text type="secondary">
              Add at least one variant and color to configure availability.
            </Typography.Text>
          ) : (
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
              <table style={{ width: '100%', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        borderBottom: '1px solid #f0f0f0',
                        minWidth: 200,
                      }}
                    >
                      Variant
                    </th>
                    {visibleColors.map((color) => (
                      <th
                        key={color.id}
                        style={{
                          textAlign: 'center',
                          padding: '8px 12px',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: color.hex_color || '#000',
                              margin: '0 auto',
                            }}
                          />
                          <span style={{ fontSize: 12 }}>{color.name_en}</span>
                          <span style={{ fontSize: 10, color: '#6b7280' }}>{color.name_bg}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedVariants.map((variant) => (
                    <tr key={variant.id}>
                      <td
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <Typography.Text strong>
                          {variant.title || variant.name_en || variant.translation_en?.title || 'Untitled'}
                        </Typography.Text>
                        <br />
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          SKU: {variant.sku || '-'}
                        </Typography.Text>
                      </td>
                      {visibleColors.map((color) => {
                        const entry = getAvailabilityEntry(variant.id!, color.id);
                        const cellKey = `${variant.id}-${color.id}`;
                        const isSaving = savingAvailabilityKey === cellKey;

                        return (
                          <td
                            key={color.id}
                            style={{
                              padding: '8px 12px',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                          >
                            <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                              <InputNumber
                                size="small"
                                min={0}
                                value={entry.stock_qty}
                                onChange={(val) =>
                                  saveAvailabilityCell(variant.id!, color.id, {
                                    stock_qty: val ?? 0,
                                  })
                                }
                                style={{ width: '100%' }}
                                disabled={isSaving}
                              />
                              <Switch
                                size="small"
                                checked={entry.is_active}
                                onChange={(checked) =>
                                  saveAvailabilityCell(variant.id!, color.id, {
                                    is_active: checked,
                                  })
                                }
                                loading={isSaving}
                                checkedChildren="Active"
                                unCheckedChildren="Inactive"
                              />
                            </Space>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardSection>
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
          <Form.Item
            name="title"
            label="Name (EN)"
            rules={[{ required: true, message: 'English name is required' }]}
          >
            <Input placeholder="e.g., 7m" />
          </Form.Item>
          <Form.Item name="name_bg" label="Name (BG)">
            <Input placeholder="e.g., 7м" />
          </Form.Item>
          <Form.Item name="sku" label="SKU">
            <Input placeholder="e.g., WF1-V6-SM-BLK" />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price (€)"
            rules={[{ required: true, message: 'Price is required' }]}
          >
            <InputNumber prefix="€" style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="compare_at_price" label="Compare at Price (€)">
            <InputNumber prefix="€" style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="inventory_quantity" label="Inventory Quantity" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="position" label="Position" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Edit Variant Translations: ${bilingualEditForm.variant?.title || ''}`}
        open={isBilingualModalOpen}
        onCancel={() => setIsBilingualModalOpen(false)}
        onOk={saveBilingualEdit}
        okText="Save Translations"
        width={900}
      >
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <BilingualInput
            label="Variant Title"
            enValue={bilingualEditForm.translation_en.title}
            bgValue={bilingualEditForm.translation_bg.title}
            onEnChange={(val) =>
              setBilingualEditForm({
                ...bilingualEditForm,
                translation_en: { ...bilingualEditForm.translation_en, title: val },
              })
            }
            onBgChange={(val) =>
              setBilingualEditForm({
                ...bilingualEditForm,
                translation_bg: { ...bilingualEditForm.translation_bg, title: val },
              })
            }
          />
        </Space>
      </Modal>

      <Modal
        title="Assign Shared Color"
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setSelectedSharedColor(null);
        }}
        okText="Assign"
        confirmLoading={loadingAssignment}
        onOk={handleAssignColor}
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="Color" required>
            <Select
              placeholder="Select a shared color"
              value={selectedSharedColor?.id}
              onChange={(value) => {
                const selection = sharedColors.find((color) => color.id === value) || null;
                setSelectedSharedColor(selection);
              }}
            >
              {sharedColors.map((color) => (
                <Select.Option key={color.id} value={color.id}>
                  <Space>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: color.hex_color || '#000',
                        display: 'inline-block',
                      }}
                    />
                    <span>{color.name_en}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Position">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={assignPosition}
              onChange={(value) => setAssignPosition(value ?? 0)}
            />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}

function CardSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        padding: 16,
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Typography.Title level={5} style={{ marginBottom: 4 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">{description}</Typography.Text>
        </div>
        {action}
      </Space>
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}
