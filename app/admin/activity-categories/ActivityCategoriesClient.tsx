"use client";

import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from 'antd';
import { useMemo, useState } from 'react';

type ActivityCategory = {
  id: string;
  name_en: string;
  name_bg: string;
  slug: string;
  position: number;
  is_active: boolean;
};

export default function ActivityCategoriesClient({
  activityCategories,
}: {
  activityCategories: ActivityCategory[];
}) {
  const [items, setItems] = useState<ActivityCategory[]>(activityCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityCategory | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const openModal = (category?: ActivityCategory) => {
    setEditing(category ?? null);
    setModalOpen(true);
    form.setFieldsValue({
      name_en: category?.name_en ?? '',
      name_bg: category?.name_bg ?? '',
      slug: category?.slug ?? '',
      position: category?.position ?? 0,
      is_active: category?.is_active ?? true,
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...values,
        id: editing?.id,
      };
      const res = await fetch('/api/admin/activity-categories', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to save category');

      const updated = body.activityCategory;
      setItems((prev) => {
        if (editing) {
          return prev.map((item) => (item.id === updated.id ? updated : item));
        }
        return [...prev, updated];
      });
      message.success('Category saved');
      setModalOpen(false);
    } catch (err: any) {
      message.error(err?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/activity-categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Delete failed');
      setItems((prev) => prev.filter((item) => item.id !== id));
      message.success('Category deleted');
    } catch (err: any) {
      message.error(err?.message || 'Failed to delete category');
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Name (EN)',
        dataIndex: 'name_en',
        key: 'name_en',
      },
      {
        title: 'Name (BG)',
        dataIndex: 'name_bg',
        key: 'name_bg',
      },
      {
        title: 'Slug',
        dataIndex: 'slug',
        key: 'slug',
      },
      {
        title: 'Position',
        dataIndex: 'position',
        key: 'position',
      },
      {
        title: 'Active',
        dataIndex: 'is_active',
        key: 'is_active',
        render: (value: boolean) =>
          value ? (
            <Typography.Text type="success">Active</Typography.Text>
          ) : (
            <Typography.Text type="secondary">Inactive</Typography.Text>
          ),
      },
      {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        render: (_: any, record: ActivityCategory) => (
          <Space size="small">
            <Button type="link" onClick={() => openModal(record)}>
              Edit
            </Button>
            <Button
              type="link"
              danger
              loading={busyId === record.id}
              onClick={() => handleDelete(record.id)}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    [busyId],
  );

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Activity Categories
        </Typography.Title>
        <Button type="primary" onClick={() => openModal()}>
          Add Activity Category
        </Button>
      </Space>

      <Table<ActivityCategory>
        columns={columns}
        dataSource={items}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: <Empty description="Add categories to show them in the dropdown" /> }}
      />

      <Modal
        title={editing ? 'Edit Activity Category' : 'New Activity Category'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name_en"
            label="Name (English)"
            rules={[{ required: true, message: 'English name is required' }]}
          >
            <Input placeholder="Example: Freeride" />
          </Form.Item>
          <Form.Item
            name="name_bg"
            label="Name (Bulgarian)"
            rules={[{ required: true, message: 'Bulgarian name is required' }]}
          >
            <Input placeholder="Пример: Фрийрайд" />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="Optional slug" />
          </Form.Item>
          <Form.Item name="position" label="Position">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="Is Active" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

