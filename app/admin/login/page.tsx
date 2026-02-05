'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Divider, Form, Input, Typography, message } from 'antd';

const { Title, Text } = Typography;

declare global {
  interface Window {
    google?: any;
  }
}

function loadGoogleScript(clientId: string) {
  if (typeof window === 'undefined') return;
  if (document.getElementById('google-gis')) return;
  const script = document.createElement('script');
  script.id = 'google-gis';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.dataset.clientId = clientId;
  document.head.appendChild(script);
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [gisError, setGisError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const clientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', []);
  const deviceId = useMemo(() => `admin-${Date.now()}-${Math.random().toString(16).slice(2)}`, []);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
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

  useEffect(() => {
    if (!clientId) {
      setGisError('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID');
      return;
    }
    loadGoogleScript(clientId);

    const interval = window.setInterval(() => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        window.clearInterval(interval);
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
              setGoogleLoading(true);
              try {
                const res = await fetch('/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential: response.credential, deviceId }),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                  message.success('Logged in with Google');
                  router.replace('/admin');
                } else {
                  message.error(data.error || 'Google login failed');
                }
              } catch (err) {
                message.error('Google login failed');
              } finally {
                setGoogleLoading(false);
              }
            },
          });
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            width: 320,
          });
          setGisReady(true);
        } catch (err: any) {
          setGisError(err?.message || 'Failed to initialize Google login');
        }
      }
    }, 200);

    return () => window.clearInterval(interval);
  }, [clientId, deviceId, router]);

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: '0 16px' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        Admin Login
      </Title>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div ref={googleButtonRef} />
        </div>
        {googleLoading ? (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>
            Signing in with Google…
          </Text>
        ) : null}
        {gisError ? (
          <Text type="danger" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>
            {gisError}
          </Text>
        ) : null}
        {!gisReady && !gisError ? (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>
            Loading Google login…
          </Text>
        ) : null}

        <Divider plain>Or login with password</Divider>
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
