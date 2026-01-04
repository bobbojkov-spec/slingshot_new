'use client';

import { useState } from 'react';
import {
  Button,
  Table,
  Typography,
  Switch,
  Space,
  Input,
  Popconfirm,
  message,
  Modal,
  Form,
  InputNumber,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  CopyOutlined,
  RobotOutlined,
} from '@ant-design/icons';

type ProductType = {
  id: string;
  name: string;
  slug?: string;
  handle?: string;
  description?: string;
  status?: string;
  visible?: boolean;
  sort_order?: number;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
  translation_en?: {
    name?: string;
    description?: string;
  };
  translation_bg?: {
    name?: string;
    description?: string;
  };
};

export default function ProductTypesListClient({
  productTypes: initialProductTypes,
}: {
  productTypes: ProductType[];
}) {
  const [productTypes, setProductTypes] = useState<ProductType[]>(initialProductTypes);
  const [editingKey, setEditingKey] = useState<string>('');
  const [editForm, setEditForm] = useState<Partial<ProductType>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [translationSaving, setTranslationSaving] = useState<Record<string, boolean>>(
    {}
  );
  const [translationSavedAt, setTranslationSavedAt] = useState<Record<string, number>>(
    {}
  );
  const [addForm] = Form.useForm();

  const isEditing = (record: ProductType) => record.id === editingKey;

  const startEdit = (record: ProductType) => {
    setEditingKey(record.id);
    setEditForm({ ...record });
  };

  const cancelEdit = () => {
    setEditingKey('');
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch('/api/admin/product-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTypeId: id,
          data: editForm,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update product type');

      setProductTypes((prev) =>
        prev.map((type) => (type.id === id ? { ...type, ...editForm } : type))
      );

      message.success('Product type updated');
      setEditingKey('');
      setEditForm({});
    } catch (err: any) {
      message.error(err?.message || 'Failed to update product type');
    }
  };

  const toggleStatus = async (record: ProductType) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/admin/product-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTypeId: record.id,
          data: { status: newStatus },
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update status');

      setProductTypes((prev) =>
        prev.map((type) => (type.id === record.id ? { ...type, status: newStatus } : type))
      );

      message.success(`Product type ${newStatus}`);
    } catch (err: any) {
      message.error(err?.message || 'Failed to update status');
    }
  };

  const toggleVisible = async (record: ProductType) => {
    const newVisible = !record.visible;
    try {
      const res = await fetch('/api/admin/product-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTypeId: record.id,
          data: { visible: newVisible },
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update visibility');

      setProductTypes((prev) =>
        prev.map((type) => (type.id === record.id ? { ...type, visible: newVisible } : type))
      );

      message.success(`Product type ${newVisible ? 'visible' : 'hidden'}`);
    } catch (err: any) {
      message.error(err?.message || 'Failed to update visibility');
    }
  };

  const deleteProductType = async (id: string) => {
    try {
      const res = await fetch('/api/admin/product-types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productTypeId: id }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to delete product type');

      setProductTypes((prev) => prev.filter((type) => type.id !== id));
      message.success('Product type deleted');
    } catch (err: any) {
      message.error(err?.message || 'Failed to delete product type');
    }
  };

  const addProductType = async (values: any) => {
    try {
      const res = await fetch('/api/admin/product-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to create product type');

      setProductTypes((prev) => [...prev, body.productType]);
      message.success('Product type added');
      setIsAddModalOpen(false);
      addForm.resetFields();
    } catch (err: any) {
      message.error(err?.message || 'Failed to create product type');
    }
  };

  const handleBgChange = (id: string, value: string) => {
    setProductTypes((prev) =>
      prev.map((type) =>
        type.id === id
          ? {
              ...type,
              translation_bg: { ...type.translation_bg, name: value },
            }
          : type
      )
    );
  };

  const saveTranslation = async (record: ProductType) => {
    if (translationSaving[record.id]) return;
    const enValue = record.translation_en?.name || record.name || '';
    const bgValue = record.translation_bg?.name || '';

    setTranslationSaving((prev) => ({ ...prev, [record.id]: true }));

    try {
      const res = await fetch('/api/admin/product-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTypeId: record.id,
          data: {},
          translation_en: { name: enValue },
          translation_bg: { name: bgValue },
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to save translation');

      setProductTypes((prev) =>
        prev.map((type) =>
          type.id === record.id
            ? {
                ...type,
                translation_en: { ...(type.translation_en || {}), name: enValue },
                translation_bg: { ...(type.translation_bg || {}), name: bgValue },
              }
            : type
        )
      );

      setTranslationSavedAt((prev) => {
        const next = { ...prev, [record.id]: Date.now() };
        setTimeout(() => {
          setTranslationSavedAt((current) => {
            const { [record.id]: _, ...rest } = current;
            return rest;
          });
        }, 5000);
        return next;
      });
    } catch (err: any) {
      message.error(err?.message || 'Failed to save translation');
    } finally {
      setTranslationSaving((prev) => {
        const next = { ...prev };
        delete next[record.id];
        return next;
      });
    }
  };

  const copyEnglishToBulgarian = (record: ProductType) => {
    const english = record.translation_en?.name || record.name || '';
    if (!english) return;
    const updatedRecord = {
      ...record,
      translation_bg: { name: english },
    };
    setProductTypes((prev) =>
      prev.map((type) => (type.id === record.id ? updatedRecord : type))
    );
    void saveTranslation(updatedRecord);
  };

  const translateProductType = async (record: ProductType) => {
    if (translationSaving[record.id]) return;
    const english = record.translation_en?.name || record.name || '';
    if (!english) {
      message.info('Provide an English name first');
      return;
    }

    setTranslationSaving((prev) => ({ ...prev, [record.id]: true }));

    try {
      const res = await fetch('/api/admin/product-types/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTypeId: record.id,
          slug: record.slug,
          translation_en: { name: english },
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to translate product type');

      const translated = body.translation_bg || {};
      setProductTypes((prev) =>
        prev.map((type) =>
          type.id === record.id
            ? {
                ...type,
                translation_bg: { name: translated.name || english },
              }
            : type
        )
      );

      setTranslationSavedAt((prev) => {
        const next = { ...prev, [record.id]: Date.now() };
        setTimeout(() => {
          setTranslationSavedAt((current) => {
            const { [record.id]: _, ...rest } = current;
            return rest;
          });
        }, 5000);
        return next;
      });

      message.success('Product type translated to Bulgarian');
    } catch (err: any) {
      message.error(err?.message || 'Translation failed');
    } finally {
      setTranslationSaving((prev) => {
        const next = { ...prev };
        delete next[record.id];
        return next;
      });
    }
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_: any, record: ProductType) => (
        <Switch
          checked={record.status === 'active'}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => toggleStatus(record)}
        />
      ),
    },
    {
      title: 'Visible',
      dataIndex: 'visible',
      key: 'visible',
      width: 120,
      render: (_: any, record: ProductType) => (
        <Switch
          checked={record.visible === true}
          checkedChildren="Visible"
          unCheckedChildren="Hidden"
          onChange={() => toggleVisible(record)}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (_: any, record: ProductType) => {
        const editing = isEditing(record);
        return editing ? (
          <Input
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
        ) : (
          <Typography.Text strong>{record.name}</Typography.Text>
        );
      },
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 200,
      render: (_: any, record: ProductType) => {
        const editing = isEditing(record);
        return editing ? (
          <Input
            value={editForm.slug}
            onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
          />
        ) : (
          <Typography.Text>{record.slug}</Typography.Text>
        );
      },
    },
    {
      title: 'Translation',
      key: 'translation',
      width: 320,
      render: (_: any, record: ProductType) => {
        const englishValue = record.translation_en?.name || record.name || '';
        const bulgarianValue = record.translation_bg?.name || '';
        const isSaving = Boolean(translationSaving[record.id]);
        const savedAt = translationSavedAt[record.id];
        return (
          <div style={{ minWidth: 300 }}>
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                🇬🇧 English
              </Typography.Text>
              <Input value={englishValue} readOnly style={{ backgroundColor: '#fff' }} />
              <div>
                <Space
                  style={{ justifyContent: 'space-between', width: '100%' }}
                >
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    🇧🇬 Bulgarian
                  </Typography.Text>
                  <Space size={4}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyEnglishToBulgarian(record)}
                      disabled={!englishValue || isSaving}
                    >
                      Copy
                    </Button>
                    <Button
                      size="small"
                      icon={<RobotOutlined />}
                      onClick={() => translateProductType(record)}
                      disabled={!englishValue || isSaving}
                      loading={isSaving}
                    >
                      Translate
                    </Button>
                  </Space>
                </Space>
                <Input
                  value={bulgarianValue}
                  onChange={(e) => handleBgChange(record.id, e.target.value)}
                  onBlur={() => saveTranslation(record)}
                  placeholder="Bulgarian name"
                  style={{ backgroundColor: '#fffbe6' }}
                  disabled={isSaving}
                />
              </div>
              {isSaving && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Saving…
                </Typography.Text>
              )}
              {!isSaving && savedAt && (
                <Typography.Text type="success" style={{ fontSize: 12 }}>
                  Saved
                </Typography.Text>
              )}
            </Space>
          </div>
        );
      },
    },
    {
      title: 'Sort Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 120,
      render: (_: any, record: ProductType) => {
        const editing = isEditing(record);
        return editing ? (
          <InputNumber
            value={editForm.sort_order}
            onChange={(value) => setEditForm({ ...editForm, sort_order: value || 0 })}
            min={0}
          />
        ) : (
          <Typography.Text>{record.sort_order ?? 0}</Typography.Text>
        );
      },
    },
    {
      title: 'Products',
      dataIndex: 'product_count',
      key: 'product_count',
      width: 100,
      render: (_: any, record: ProductType) => {
        const count = record.product_count || 0;
        return (
          <Typography.Text strong={count > 0} type={count > 0 ? 'success' : 'secondary'}>
            {count}
          </Typography.Text>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: ProductType) => {
        const editing = isEditing(record);

        if (editing) {
          return (
            <Space size={4}>
              <Button
                type="link"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => saveEdit(record.id)}
              />
              <Button type="link" size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
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
            {/* translation available inline */}
            {record.status !== 'active' && (record.product_count || 0) === 0 && (
              <Popconfirm
                title="Delete product type?"
                description="This product type has no products and can be safely deleted."
                onConfirm={() => deleteProductType(record.id)}
                okText="Delete"
                okType="danger"
                cancelText="Cancel"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
            {record.status !== 'active' && (record.product_count || 0) > 0 && (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled
                title={`Cannot delete: ${record.product_count} products linked`}
              />
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Card>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Product Types
            </Typography.Title>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Manage product types. Delete is only available for inactive types with no products.
            </Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
            Add Product Type
          </Button>
        </Space>

        <Table
          rowKey="id"
          dataSource={productTypes}
          columns={columns}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Space>

      <Modal
        title="Add New Product Type"
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          addForm.resetFields();
        }}
        footer={null}
      >
        <Form form={addForm} onFinish={addProductType} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter product type name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="slug" label="Slug" extra="Leave empty to auto-generate from name">
            <Input />
          </Form.Item>

          <Form.Item name="sort_order" label="Sort Order" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Product Type
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </Card>
  );
}
