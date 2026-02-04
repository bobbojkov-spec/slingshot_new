'use client';

import { useMemo, useState, type ReactNode, memo } from 'react';
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

function VariantsTab({
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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignColorId, setAssignColorId] = useState<string | null>(null);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);
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

  const variants = draft.variants || [];
  const visualColors = draft.product_colors || [];
  const availability = draft.availability || [];

  const sortedVisualColors = useMemo(
    () => [...visualColors].sort((a, b) => (a.display_order ?? a.position ?? 0) - (b.display_order ?? b.position ?? 0)),
    [visualColors]
  );
  const sortedVariants = useMemo(
    () => [...variants].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [variants]
  );

  const assignedColorByVariant = useMemo(() => {
    const map = new Map<string, string>();
    sortedVisualColors.forEach((color) => {
      availability
        .filter((entry) => entry.color_id === color.id && entry.is_active && entry.stock_qty > 0)
        .forEach((entry) => {
          if (!map.has(entry.variant_id)) {
            map.set(entry.variant_id, color.id);
          }
        });
    });

    sortedVariants.forEach((variant) => {
      if (variant.id && variant.product_color_id && !map.has(variant.id)) {
        map.set(variant.id, variant.product_color_id);
      }
    });

    return map;
  }, [availability, sortedVisualColors, sortedVariants]);

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


  const getAvailabilityEntry = (variantId: string, colorId: string): AvailabilityEntry => {
    const entry = availability.find((row) => row.variant_id === variantId && row.color_id === colorId);
    if (entry) {
      return entry as AvailabilityEntry;
    }
    return {
      variant_id: variantId,
      color_id: colorId,
      stock_qty: 1,
      is_active: true,
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

  const openAssignModal = (colorId: string) => {
    const currentSelection = sortedVariants
      .filter((variant) => variant.id && assignedColorByVariant.get(variant.id) === colorId)
      .map((variant) => variant.id as string);
    setAssignColorId(colorId);
    setSelectedVariantIds(currentSelection);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignments = async () => {
    if (!draft.id || !assignColorId) return;

    const currentAssigned = sortedVariants
      .filter((variant) => variant.id && assignedColorByVariant.get(variant.id) === assignColorId)
      .map((variant) => variant.id as string);
    const selectedSet = new Set(selectedVariantIds);

    const toActivate = selectedVariantIds;
    const toDeactivate = currentAssigned.filter((id) => !selectedSet.has(id));
    const conflicts = selectedVariantIds.filter((id) => {
      const existingColor = assignedColorByVariant.get(id);
      return existingColor && existingColor !== assignColorId;
    });

    const entries: AvailabilityEntry[] = [];
    toActivate.forEach((variantId) => {
      entries.push({
        variant_id: variantId,
        color_id: assignColorId,
        stock_qty: 1,
        is_active: true,
      });
    });
    toDeactivate.forEach((variantId) => {
      entries.push({
        variant_id: variantId,
        color_id: assignColorId,
        stock_qty: 0,
        is_active: false,
      });
    });
    conflicts.forEach((variantId) => {
      const oldColor = assignedColorByVariant.get(variantId);
      if (oldColor) {
        entries.push({
          variant_id: variantId,
          color_id: oldColor,
          stock_qty: 0,
          is_active: false,
        });
      }
    });

    const uniqueEntries = Array.from(
      new Map(entries.map((entry) => [`${entry.variant_id}-${entry.color_id}`, entry])).values()
    );

    if (!uniqueEntries.length) {
      setIsAssignModalOpen(false);
      return;
    }

    setSavingAssignments(true);
    try {
      const res = await fetch(`/api/admin/products/${draft.id}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: uniqueEntries }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to save assignments');

      setDraft((prev) => ({
        ...prev,
        availability: [
          ...(prev.availability?.filter(
            (entry) => !uniqueEntries.some(
              (update) => update.variant_id === entry.variant_id && update.color_id === entry.color_id
            )
          ) || []),
          ...(body.entries || uniqueEntries),
        ],
      }));

      const variantUpdates = new Map<string, string | null>();
      toActivate.forEach((variantId) => variantUpdates.set(variantId, assignColorId));
      toDeactivate.forEach((variantId) => variantUpdates.set(variantId, null));

      if (variantUpdates.size) {
        await Promise.all(
          Array.from(variantUpdates.entries()).map(async ([variantId, colorId]) => {
            const res = await fetch('/api/admin/products/variants', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                variantId,
                data: { product_color_id: colorId },
              }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body?.error || 'Failed to update primary color');
          })
        );

        setDraft((prev) => ({
          ...prev,
          variants: prev.variants?.map((variant) => {
            if (!variant.id) return variant;
            if (!variantUpdates.has(variant.id)) return variant;
            return { ...variant, product_color_id: variantUpdates.get(variant.id) || null };
          }),
        }));
      }

      message.success('Assignments updated');
      setIsAssignModalOpen(false);
    } catch (err: any) {
      message.error(err?.message || 'Failed to save assignments');
    } finally {
      setSavingAssignments(false);
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
          title="Visual Color Assignment"
          description="Assign each variant to exactly one visual color."
        >
          {!(sortedVisualColors.length && sortedVariants.length) ? (
            <Typography.Text type="secondary">
              Add at least one variant and visual color to configure assignments.
            </Typography.Text>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              {sortedVisualColors.map((color) => {
                const assignedVariants = sortedVariants.filter(
                  (variant) => variant.id && assignedColorByVariant.get(variant.id) === color.id
                );
                return (
                  <div
                    key={color.id}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 10,
                      padding: 12,
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      minHeight: 220,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: '#f5f5f5',
                        border: '1px solid #eee',
                      }}
                    >
                      <img
                        src={color.url || color.image_path}
                        alt={color.name || 'Color'}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <Typography.Text strong style={{ fontSize: 13 }}>
                      {color.name || 'Unnamed'}
                    </Typography.Text>
                    <Button size="small" onClick={() => openAssignModal(color.id)}>
                      Assign
                    </Button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      {assignedVariants.length === 0 ? (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          No variants assigned.
                        </Typography.Text>
                      ) : (
                        assignedVariants.map((variant) => (
                          <div
                            key={variant.id}
                            style={{
                              padding: '6px 8px',
                              borderRadius: 6,
                              background: '#fafafa',
                              border: '1px solid #f0f0f0',
                              fontSize: 12,
                            }}
                          >
                            <strong>{variant.title || variant.name_en || variant.translation_en?.title || 'Untitled'}</strong>
                            <div style={{ color: '#999' }}>SKU: {variant.sku || '-'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardSection>

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
        title="Assign variants to color"
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        onOk={handleSaveAssignments}
        okText="Save Assignments"
        confirmLoading={savingAssignments}
        width={720}
      >
        <Table<Variant>
          size="small"
          rowKey={(row) => row.id || row.sku || row.title || Math.random().toString()}
          dataSource={sortedVariants}
          pagination={false}
          rowSelection={{
            selectedRowKeys: selectedVariantIds,
            onChange: (keys) => setSelectedVariantIds(keys as string[]),
            getCheckboxProps: (record) => {
              if (!record.id) return { disabled: true };
              const assignedColor = assignedColorByVariant.get(record.id);
              return {
                disabled: assignedColor !== undefined && assignedColor !== assignColorId,
              };
            },
          }}
          columns={[
            {
              title: 'Variant',
              key: 'variant',
              render: (_: any, record: Variant) => (
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {record.title || record.name_en || record.translation_en?.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>SKU: {record.sku || '-'}</div>
                </div>
              ),
            },
            {
              title: 'Price',
              dataIndex: 'price',
              key: 'price',
              width: 120,
              render: (value: number) => (value !== undefined && value !== null ? `€${value}` : '—'),
            },
          ]}
          onRow={(record) => {
            return {
              onClick: () => {
                if (!record.id) return;
                const assignedColor = assignedColorByVariant.get(record.id);
                if (assignedColor && assignedColor !== assignColorId) return;
                setSelectedVariantIds((prev) =>
                  prev.includes(record.id!)
                    ? prev.filter((id) => id !== record.id)
                    : [...prev, record.id!]
                );
              },
            };
          }}
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Variants already assigned to another color are disabled. Each variant can only belong to one color.
        </Typography.Text>
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

export default memo(VariantsTab);
