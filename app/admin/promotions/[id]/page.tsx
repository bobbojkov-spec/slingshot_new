"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    Breadcrumb,
    Button,
    Card,
    Form,
    Input,
    Select,
    Switch,
    DatePicker,
    message,
    Space,
    Typography,
    Divider,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function PromotionFormPage() {
    const { id } = useParams();
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const isNew = id === 'new';

    useEffect(() => {
        if (!isNew) {
            setLoading(true);
            fetch(`/api/admin/promotions/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.promotion) {
                        const promo = data.promotion;
                        form.setFieldsValue({
                            ...promo,
                            validity: [
                                promo.valid_from ? dayjs(promo.valid_from) : null,
                                promo.valid_to ? dayjs(promo.valid_to) : null,
                            ],
                        });
                    }
                })
                .catch(() => message.error('Failed to load promotion'))
                .finally(() => setLoading(false));
        }
    }, [id, isNew, form]);

    const onFinish = async (values: any) => {
        setSaving(true);
        const [valid_from, valid_to] = values.validity || [null, null];

        const payload = {
            ...values,
            valid_from: valid_from ? valid_from.toISOString() : null,
            valid_to: valid_to ? valid_to.toISOString() : null,
        };
        delete payload.validity;

        try {
            const url = isNew ? '/api/admin/promotions' : `/api/admin/promotions/${id}`;
            const method = isNew ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                message.success(`Promotion ${isNew ? 'created' : 'updated'} successfully`);
                router.push('/admin/promotions');
            } else {
                message.error('Failed to save promotion');
            }
        } catch (error) {
            message.error('Error saving promotion');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Breadcrumb items={[
                { title: <Link href="/admin">Dashboard</Link> },
                { title: <Link href="/admin/promotions">Promotions</Link> },
                { title: isNew ? 'New Promotion' : 'Edit Promotion' },
            ]} />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    display_type: 'small',
                    placement: 'homepage',
                    is_active: true,
                }}
                disabled={loading}
            >
                <Card
                    loading={loading}
                    title={
                        <Space>
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => router.push('/admin/promotions')}
                            />
                            <span>{isNew ? 'Create New Promotion' : 'Edit Promotion Details'}</span>
                        </Space>
                    }
                    extra={
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={saving}
                        >
                            Save Promotion
                        </Button>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <Form.Item
                                label="Promotion Title"
                                name="title"
                                rules={[{ required: true, message: 'Please enter a title' }]}
                            >
                                <Input placeholder="e.g. Winter Sale is Live!" size="large" />
                            </Form.Item>

                            <Form.Item
                                label="Content / Message"
                                name="content"
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Enter the notification message..."
                                />
                            </Form.Item>

                            <Form.Item
                                label="Image URL (Optional)"
                                name="image_url"
                            >
                                <Input placeholder="https://..." />
                            </Form.Item>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Form.Item
                                    label="Display Size"
                                    name="display_type"
                                >
                                    <Select>
                                        <Select.Option value="small">Small (Bottom Right)</Select.Option>
                                        <Select.Option value="big">Big (Centered)</Select.Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    label="Placement"
                                    name="placement"
                                >
                                    <Select>
                                        <Select.Option value="homepage">Homepage Only</Select.Option>
                                        <Select.Option value="everywhere">Everywhere</Select.Option>
                                        <Select.Option value="product">Product Details Only</Select.Option>
                                    </Select>
                                </Form.Item>
                            </div>

                            <Form.Item
                                label="Validity Period"
                                name="validity"
                            >
                                <RangePicker showTime style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item
                                label="System Status"
                                name="is_active"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                            </Form.Item>
                        </div>
                    </div>
                </Card>
            </Form>
        </Space>
    );
}
