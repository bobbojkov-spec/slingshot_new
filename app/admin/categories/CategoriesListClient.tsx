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
  Divider,
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

type Category = {
  id: string;
  name: string;
  slug?: string;
  handle?: string;
  description?: string;
  status?: string;
  visible?: boolean;
  sort_order?: number;
  image_url?: string;
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

export default function CategoriesListClient({
  categories: initialCategories,
}: {
  categories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingKey, setEditingKey] = useState<string>('');
  const [editForm, setEditForm] = useState<{
    slug?: string;
    sort_order?: number;
    image_url?: string;
    translation_en: { name: string; description: string };
    translation_bg: { name: string; description: string };
  }>({
    translation_en: { name: '', description: '' },
    translation_bg: { name: '', description: '' },
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryTranslating, setCategoryTranslating] = useState<Record<string, boolean>>(
    {}
  );
  const [addForm] = Form.useForm();

  const isEditing = (record: Category) => record.id === editingKey;

  const startEdit = (record: Category) => {
    setEditingKey(record.id);
    console.log('🔍 Editing category:', JSON.stringify(record, null, 2));
    setEditForm({
      slug: record.slug,
      sort_order: record.sort_order,
      image_url: record.image_url,
      translation_en: {
        name: record.translation_en?.name || record.name || '',
        description: record.translation_en?.description || record.description || '',
      },
      translation_bg: {
        name: record.translation_bg?.name || '',
        description: record.translation_bg?.description || '',
      },
    });
  };

  const cancelEdit = () => {
    setEditingKey('');
    setEditForm({
      translation_en: { name: '', description: '' },
      translation_bg: { name: '', description: '' },
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: id,
          data: {
            slug: editForm.slug,
            sort_order: editForm.sort_order,
            image_url: editForm.image_url,
          },
          translation_en: editForm.translation_en,
          translation_bg: editForm.translation_bg,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update category');

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id
            ? {
                ...cat,
                slug: editForm.slug,
                sort_order: editForm.sort_order,
                image_url: editForm.image_url,
                translation_en: editForm.translation_en,
                translation_bg: editForm.translation_bg,
              }
            : cat
        )
      );

      message.success('Category updated');
      setEditingKey('');
      setEditForm({
        translation_en: { name: '', description: '' },
        translation_bg: { name: '', description: '' },
      });
    } catch (err: any) {
      message.error(err?.message || 'Failed to update category');
    }
  };

  const translateCategory = async (record: Category) => {
    const englishName = record.translation_en?.name || record.name || '';
    const englishDescription = record.translation_en?.description || record.description || '';
    if (!englishName) {
      message.info('Please provide an English name before translating');
      return;
    }

    setCategoryTranslating((prev) => ({ ...prev, [record.id]: true }));

    try {
      const res = await fetch('/api/admin/categories/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: record.id,
          slug: record.slug,
          translation_en: {
            name: englishName,
            description: englishDescription,
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to translate category');
      }

      const translated = body.translation_bg || {};
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === record.id
            ? { ...cat, translation_bg: { name: translated.name, description: translated.description } }
            : cat
        )
      );

      if (editingKey === record.id) {
        setEditForm((prev) => ({
          ...prev,
          translation_bg: {
            name: translated.name || prev.translation_bg.name,
            description: translated.description || prev.translation_bg.description,
          },
        }));
      }

      message.success('Category translated to Bulgarian');
    } catch (err: any) {
      message.error(err?.message || 'Translation failed');
    } finally {
      setCategoryTranslating((prev) => {
        const next = { ...prev };
        delete next[record.id];
        return next;
      });
    }
  };

  const toggleStatus = async (record: Category) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: record.id,
          data: { status: newStatus },
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update status');

      setCategories((prev) =>
        prev.map((cat) => (cat.id === record.id ? { ...cat, status: newStatus } : cat))
      );

      message.success(`Category ${newStatus}`);
    } catch (err: any) {
      message.error(err?.message || 'Failed to update status');
    }
  };

  const toggleVisible = async (record: Category) => {
    const newVisible = !record.visible;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: record.id,
          data: { visible: newVisible },
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update visibility');

      setCategories((prev) =>
        prev.map((cat) => (cat.id === record.id ? { ...cat, visible: newVisible } : cat))
      );

      message.success(`Category ${newVisible ? 'visible' : 'hidden'}`);
    } catch (err: any) {
      message.error(err?.message || 'Failed to update visibility');
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: id }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to delete category');

      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      message.success('Category deleted');
    } catch (err: any) {
      message.error(err?.message || 'Failed to delete category');
    }
  };

  const addCategory = async (values: any) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to create category');

      setCategories((prev) => [...prev, body.category]);
      message.success('Category added');
      setIsAddModalOpen(false);
      addForm.resetFields();
    } catch (err: any) {
      message.error(err?.message || 'Failed to create category');
    }
  };

  const copyToBulgarian = (field: 'name' | 'description') => {
    setEditForm({
      ...editForm,
      translation_bg: {
        ...editForm.translation_bg,
        [field]: editForm.translation_en[field],
      },
    });
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_: any, record: Category) => (
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
      render: (_: any, record: Category) => (
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
      render: (_: any, record: Category) => {
        return <Typography.Text strong>{record.translation_en?.name || record.name}</Typography.Text>;
      },
    },
    {
      title: 'Slug / Handle',
      dataIndex: 'slug',
      key: 'slug',
      render: (_: any, record: Category) => {
        if (isEditing(record)) {
          return (
            <Input
              value={editForm.slug}
              onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
              placeholder="auto-generated if empty"
            />
          );
        }
        return record.slug || record.handle || '—';
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (_: any, record: Category) => {
        return record.translation_en?.description || record.description || '—';
      },
    },
    {
      title: 'Sort Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 120,
      render: (_: any, record: Category) => {
        if (isEditing(record)) {
          return (
            <InputNumber
              value={editForm.sort_order}
              onChange={(val) => setEditForm({ ...editForm, sort_order: val || 0 })}
              style={{ width: '100%' }}
            />
          );
        }
        return record.sort_order ?? 0;
      },
    },
    {
      title: 'Products',
      dataIndex: 'product_count',
      key: 'product_count',
      width: 100,
      render: (_: any, record: Category) => {
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
      render: (_: any, record: Category) => {
        if (isEditing(record)) {
          return (
            <Space size={4}>
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => saveEdit(record.id)}
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
              title="Edit"
            />
            {record.status !== 'active' && (record.product_count || 0) === 0 && (
              <Popconfirm
                title="Delete category?"
                description="This category has no products and can be safely deleted."
                onConfirm={() => deleteCategory(record.id)}
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

  const expandedRowRender = (record: Category) => {
    if (!isEditing(record)) return null;

    return (
      <div style={{ padding: '16px 24px', backgroundColor: '#fafafa' }}>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Divider orientation="left">Multilingual Content</Divider>

          <div>
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text strong>Category Name</Typography.Text>
              
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  🇬🇧 English
                </Typography.Text>
                <Input
                  value={editForm.translation_en.name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      translation_en: { ...editForm.translation_en, name: e.target.value },
                    })
                  }
                  placeholder="Category name in English"
                  style={{ backgroundColor: '#fff' }}
                />
              </div>

              <div>
              <Space
                style={{
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  🇧🇬 Bulgarian
                </Typography.Text>
                <Space size={4}>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToBulgarian('name')}
                    disabled={!editForm.translation_en.name}
                  >
                    Copy from English
                  </Button>
                  <Button
                    size="small"
                    icon={<RobotOutlined />}
                    onClick={() => translateCategory(record)}
                    loading={Boolean(categoryTranslating[record.id])}
                    disabled={!record.translation_en?.name && !record.name}
                  >
                    Translate
                  </Button>
                </Space>
              </Space>
                <Input
                  value={editForm.translation_bg.name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      translation_bg: { ...editForm.translation_bg, name: e.target.value },
                    })
                  }
                  placeholder="Category name in Bulgarian"
                  style={{ backgroundColor: '#fffbe6' }}
                />
              </div>
            </Space>
          </div>

          <div>
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text strong>Description</Typography.Text>
              
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  🇬🇧 English
                </Typography.Text>
                <Input.TextArea
                  value={editForm.translation_en.description}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      translation_en: { ...editForm.translation_en, description: e.target.value },
                    })
                  }
                  placeholder="Description in English"
                  rows={3}
                  style={{ backgroundColor: '#fff' }}
                />
              </div>

              <div>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    🇧🇬 Bulgarian
                  </Typography.Text>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToBulgarian('description')}
                    disabled={!editForm.translation_en.description}
                  >
                    Copy from English
                  </Button>
                </Space>
                <Input.TextArea
                  value={editForm.translation_bg.description}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      translation_bg: { ...editForm.translation_bg, description: e.target.value },
                    })
                  }
                  placeholder="Description in Bulgarian"
                  rows={3}
                  style={{ backgroundColor: '#fffbe6' }}
                />
              </div>
            </Space>
          </div>
        </Space>
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Categories
              </Typography.Title>
              <Typography.Text type="secondary">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              </Typography.Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
              Add Category
            </Button>
          </div>
        }
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Manage product categories. Click Edit to see bilingual fields. Delete is only available for inactive categories with no products.
        </Typography.Text>

        <Table<Category>
          size="middle"
          rowKey="id"
          dataSource={categories}
          columns={columns}
          expandable={{
            expandedRowRender,
            expandedRowKeys: editingKey ? [editingKey] : [],
            showExpandColumn: false,
          }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total}` }}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title="Add New Category"
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          addForm.resetFields();
        }}
        onOk={() => addForm.submit()}
        okText="Add Category"
        width={600}
      >
        <Form form={addForm} layout="vertical" onFinish={addCategory}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Category name is required' }]}
          >
            <Input placeholder="e.g., Electronics" />
          </Form.Item>
          <Form.Item name="slug" label="Slug (URL)">
            <Input placeholder="e.g., electronics (auto-generated if empty)" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of this category" />
          </Form.Item>
          <Form.Item name="sort_order" label="Sort Order" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="image_url" label="Image URL">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
