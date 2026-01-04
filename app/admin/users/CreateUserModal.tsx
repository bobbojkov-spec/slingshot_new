'use client';

import { Modal, Form, Input, Select, message } from 'antd';
import { useState } from 'react';

type AdminUser = {
  id: string;
  email: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
};

export default function CreateUserModal({
  open,
  onCancel,
  onCreated,
}: {
  open: boolean;
  onCancel: () => void;
  onCreated: (user: AdminUser) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          role: values.role,
          password: values.password,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Create failed');
      onCreated(body.user);
      form.resetFields();
    } catch (err: any) {
      message.error(err?.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Admin User" open={open} onCancel={onCancel} onOk={handleOk} confirmLoading={loading}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input placeholder="admin@example.com" />
        </Form.Item>
        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Role is required' }]}
          initialValue="admin"
        >
          <Select
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'Super admin', value: 'super_admin' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="Temporary password"
          name="password"
          rules={[{ required: true, message: 'Temporary password is required' }]}
        >
          <Input.Password placeholder="Temporary password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

