'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Form, Input, Space, Typography, message } from 'antd';

const { Title, Text } = Typography;

const generateDeviceId = () => {
  if (typeof window === 'undefined') return '';
  try {
    let deviceId = window.localStorage.getItem('adminDeviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem('adminDeviceId', deviceId);
    }
    return deviceId;
  } catch {
    return '';
  }
};

const isVerificationStep = (step: 'creds' | 'code') => step === 'code';

export default function AdminLoginPage() {
  const router = useRouter();
  const [credentialsForm] = Form.useForm();
  const [codeForm] = Form.useForm();
  const [step, setStep] = useState<'creds' | 'code'>('creds');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [lastCode, setLastCode] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated) {
          router.replace('/admin');
        }
      })
      .catch(() => {
        // ignore
      });
  }, [router]);

  const deviceId = useMemo(() => generateDeviceId(), []);

  const confirmSession = async () => {
    const res = await fetch('/api/auth/me');
    const payload = await res.json();
    if (res.ok && payload?.authenticated) {
      message.success('Logged in successfully');
      router.push('/admin');
      router.refresh();
    } else {
      message.error('Authentication failed. Please try again.');
    }
  };

  const handleLoginSubmit = async () => {
    try {
      const values = await credentialsForm.validateFields();
      setLoading(true);
      setEmail(values.email);

      const response = await fetch('/api/auth/login-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          deviceId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || 'Login failed');
        return;
      }

      if (data.verified) {
        await confirmSession();
        return;
      }

      setLastCode(data.code || null);
      setStep('code');
      message.success('Verification code sent to your email');
    } catch (error: any) {
      console.error('login error:', error);
      message.error('Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (values: { code: string }) => {
    try {
      setLoading(true);

      const verifyResponse = await fetch('/api/users/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          deviceId,
          code: values.code,
        }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) {
        message.error(verifyData.error || 'Invalid verification code');
        return;
      }

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, deviceId }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        message.error(loginData.error || 'Failed to finalize login');
        return;
      }

      await confirmSession();
    } catch (error: any) {
      console.error('code verification error:', error);
      message.error('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%', maxWidth: 420, margin: '40px auto' }}>
      <Title level={3} style={{ margin: 0 }}>
        Admin Login
      </Title>

      <Card>
        {isVerificationStep(step) ? (
          <Space orientation="vertical" style={{ width: '100%' }} size={12}>
            <Alert
              type="info"
              title="Enter the 6-digit code sent to your email."
              description={lastCode ? `Local testing code: ${lastCode}` : undefined}
              showIcon
            />
            <Form layout="vertical" form={codeForm} onFinish={handleCodeSubmit}>
              <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Code is required' }]}>
                <Input maxLength={6} placeholder="123456" />
              </Form.Item>
              <Space style={{ width: '100%' }}>
                <Button onClick={() => setStep('creds')}>Back</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Verify & Login
                </Button>
              </Space>
            </Form>
          </Space>
        ) : (
          <Form layout="vertical" form={credentialsForm}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input placeholder="admin@example.com" autoComplete="email" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password placeholder="Password" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" block onClick={handleLoginSubmit} loading={loading}>
              Send code
            </Button>
          </Form>
        )}
        <Space size={6} style={{ marginTop: 16 }}>
          <Text type="secondary">
            Verification is powered by device-password pairing. Keep your device consistent for
            trusted logins.
          </Text>
        </Space>
      </Card>
    </Space>
  );
}

