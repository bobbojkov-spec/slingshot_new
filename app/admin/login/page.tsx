'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Form, Input, Typography, message } from 'antd';

const { Title } = Typography;

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const deviceId = 'dev-browser-' + Date.now();
      const res = await fetch('/api/auth/login-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          deviceId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        message.success('Logged in!');
        router.replace('/admin');
      } else {
        message.error(data.error || 'Login failed');
      }
    } catch (err) {
      message.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: '0 16px' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        Admin Login
      </Title>
      <Card>
        <Form
          layout="vertical"
          onFinish={handleLogin}
          initialValues={{ email: 'bob@bojkov.com', password: '' }}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Email required' }]}
          >
            <Input type="email" autoFocus />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password required' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
