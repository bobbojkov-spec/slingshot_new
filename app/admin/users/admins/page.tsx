'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
  Spin,
  Alert,
} from 'antd';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<any>(null);
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [allowlist, setAllowlist] = useState<string[]>([]);
  const [requireAllowlist, setRequireAllowlist] = useState(false);

  const roleOptions = useMemo(
    () => [
      { label: 'Admin', value: 'admin' },
      { label: 'Super admin', value: 'super_admin' },
      { label: 'Editor', value: 'editor' },
    ],
    []
  );

  const openCreate = () => {
    createForm.resetFields();
    setCreateOpen(true);
  };

  const openEdit = (record: any) => {
    setEditing(record);
    editForm.setFieldsValue(record);
    setEditOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);

      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          role: values.role,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to create admin');
      }

      await loadUsers();

      message.success('Admin user created');
      setCreateOpen(false);
      createForm.resetFields();
    } catch (err: any) {
      if (err?.message) {
        message.error(err.message);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/list');
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to load admin users');
      const users = (body.users || []).map((u: any) => ({
        key: u.user_id,
        name: u.email,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        lastLogin: u.last_login_at || '—',
      }));
      setRows(users);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const loadAllowlist = async () => {
    try {
      const res = await fetch('/api/admin/allowlist');
      const body = await res.json();
      if (res.ok) {
        setAllowlist(body.allowlist || []);
        setRequireAllowlist(Boolean(body.requireAllowlist));
      }
    } catch (err: any) {
      console.warn('Failed to load allowlist', err?.message || err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadAllowlist();
  }, []);

  const toggleActive = async (record: any) => {
    const targetActive = !record.is_active;
    try {
      const endpoint = targetActive ? '/api/admin/users/activate' : '/api/admin/users/deactivate';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.key }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Action failed');
      message.success(targetActive ? 'User activated' : 'User deactivated');
      await loadUsers();
    } catch (err: any) {
      message.error(err?.message || 'Action failed');
    }
  };

  const handleDelete = async (record: any) => {
    // No hard delete API; just remove locally to satisfy UI request
    setRows((prev) => prev.filter((r) => r.key !== record.key));
    message.success('User removed (local only)');
  };

  const handleEdit = async () => {
    try {
      const values = await editForm.validateFields();
      message.success('User will be updated (placeholder)');
      setRows((prev) =>
        prev.map((r) => (r.key === editing?.key ? { ...r, ...values, is_active: r.is_active ?? true } : r))
      );
      setEditOpen(false);
      setEditing(null);
    } catch {
      /* antd validation handles errors */
    }
  };

  const openPasswordModal = (record: any) => {
    setPasswordUser(record);
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const handlePasswordChange = async () => {
    if (!passwordUser) return;
    try {
      const values = await passwordForm.validateFields();
      setPasswordLoading(true);

      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: passwordUser.key,
          new_password: values.new_password,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to change password');
      }

      message.success('Password changed successfully');
      setPasswordModalOpen(false);
      setPasswordUser(null);
      passwordForm.resetFields();
    } catch (err: any) {
      if (err?.message) {
        message.error(err.message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Admin Users
      </Typography.Title>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span>Users</span>
            <Button type="primary" onClick={openCreate}>
              Add user
            </Button>
          </div>
        }
      >
        <Alert
          type={requireAllowlist ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 12 }}
          message="Admin allowlist"
          description={
            allowlist.length
              ? `Only these emails can log in as admin: ${allowlist.join(', ')}`
              : 'Allowlist is empty. Add emails to ADMIN_EMAIL_ALLOWLIST to enable Google/admin access.'
          }
        />
        <div style={{ overflowX: 'auto', fontSize: 10 }}>
          <Spin spinning={loading}>
            {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
            <Table
              size="small"
              tableLayout="auto"
              scroll={{ x: true }}
              style={{ width: '100%' }}
              dataSource={rows}
              pagination={false}
              columns={[
                { title: 'Name', dataIndex: 'name', ellipsis: true, width: 110 },
                { title: 'Email', dataIndex: 'email', ellipsis: true, width: 100 },
                {
                  title: 'Role',
                  dataIndex: 'role',
                  responsive: ['sm'],
                  render: (value: string) => (
                    <Select defaultValue={value} options={roleOptions} style={{ width: 80 }} disabled />
                  ),
                  width: 85,
                },
                { title: 'Last login', dataIndex: 'lastLogin', width: 120, responsive: ['lg'] },
                {
                  title: 'Active',
                  dataIndex: 'is_active',
                  width: 70,
                  render: (_: any, record: any) => (
                    <Button
                      size="small"
                      type={record.is_active ? 'primary' : 'default'}
                      onClick={() => toggleActive(record)}
                    >
                      {record.is_active ? 'Active' : 'Inactive'}
                    </Button>
                  ),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  width: 150,
                  render: (_: any, record: any) => (
                    <Space size={4}>
                      <Button type="link" onClick={() => openEdit(record)}>
                        Edit
                      </Button>
                      <Button type="link" onClick={() => openPasswordModal(record)}>
                        Change Password
                      </Button>
                      {!record.is_active ? (
                        <Button size="small" danger onClick={() => handleDelete(record)}>
                          ×
                        </Button>
                      ) : null}
                    </Space>
                  ),
                },
              ]}
            />
          </Spin>
        </div>
      </Card>

      <Modal
        title="Add admin user"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="Create"
        confirmLoading={createLoading}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Role is required' }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Repeat password" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit admin user"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onOk={handleEdit}
        okText="Save"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Role is required' }]}>
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Change Password${passwordUser ? ` for ${passwordUser.email}` : ''}`}
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          setPasswordUser(null);
          passwordForm.resetFields();
        }}
        onOk={handlePasswordChange}
        okText="Change Password"
        confirmLoading={passwordLoading}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="new_password"
            label="New Password"
            rules={[
              { required: true, message: 'Password is required' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Please confirm password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

