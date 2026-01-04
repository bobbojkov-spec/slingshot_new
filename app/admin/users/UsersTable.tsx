'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Modal, Space, Table, Tag, Typography, message, Input } from 'antd';
import CreateUserModal from './CreateUserModal';

type AdminUser = {
  id: string;
  email: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
};

export default function UsersTable({ initialUsers, initialError }: { initialUsers: AdminUser[]; initialError?: string | null }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers || []);
  const [error, setError] = useState<string | null>(initialError || null);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetModal, setResetModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to load users');
      setUsers(body.users || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    setUsers(initialUsers || []);
    setError(initialError || null);
  }, [initialUsers, initialError]);

  const doActivate = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/users/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Activate failed');
      message.success('User activated');
      await refresh();
    } catch (err: any) {
      message.error(err?.message || 'Activate failed');
    } finally {
      setActionLoading(null);
    }
  };

  const doDeactivate = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/users/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Deactivate failed');
      message.success('User deactivated');
      await refresh();
    } catch (err: any) {
      message.error(err?.message || 'Deactivate failed');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmActivate = (id: string) =>
    Modal.confirm({
      title: 'Activate admin user?',
      okText: 'Activate',
      cancelText: 'Cancel',
      onOk: () => doActivate(id),
    });

  const confirmDeactivate = (id: string) =>
    Modal.confirm({
      title: 'Deactivate admin user?',
      okText: 'Deactivate',
      cancelText: 'Cancel',
      onOk: () => doDeactivate(id),
    });

  const handleResetPassword = async () => {
    if (!resetModal.id) return;
    setResetLoading(true);
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetModal.id, new_password: resetPassword }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Reset failed');
      message.success('Password reset');
      setResetModal({ open: false });
      setResetPassword('');
    } catch (err: any) {
      message.error(err?.message || 'Reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (val: string) => val || '—',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (val: boolean) => (val ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => {
        const d = val ? new Date(val) : null;
        if (!d || Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AdminUser) => (
        <Space size={8}>
          {record.is_active ? (
            <Button size="small" loading={actionLoading === record.id} onClick={() => confirmDeactivate(record.id)}>
              Deactivate
            </Button>
          ) : (
            <Button size="small" loading={actionLoading === record.id} onClick={() => confirmActivate(record.id)}>
              Activate
            </Button>
          )}
          <Button
            size="small"
            onClick={() => {
              setResetModal({ open: true, id: record.id });
              setResetPassword('');
            }}
          >
            Reset password
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Admin Users
      </Typography.Title>
      {error ? <Alert type="error" message="Failed to load users" description={error} /> : null}
      <Button type="primary" onClick={() => setCreateOpen(true)}>
        Create admin user
      </Button>
      <Table rowKey="id" columns={columns} dataSource={users} pagination={{ pageSize: 10, size: 'small' }} />

      <CreateUserModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onCreated={async (user) => {
          setCreateOpen(false);
          message.success('Admin user created');
          await refresh();
        }}
      />

      <Modal
        title="Reset password"
        open={resetModal.open}
        onCancel={() => {
          setResetModal({ open: false });
          setResetPassword('');
        }}
        onOk={handleResetPassword}
        confirmLoading={resetLoading}
      >
        <Input.Password
          placeholder="New password"
          value={resetPassword}
          onChange={(e) => setResetPassword(e.target.value)}
        />
      </Modal>
    </Space>
  );
}


