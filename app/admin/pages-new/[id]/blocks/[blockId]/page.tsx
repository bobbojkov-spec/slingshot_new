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
    message,
    Spin,
    Divider,
    Space,
    Typography,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import SimpleEditor from '@/components/SimpleEditor';
import BilingualInput from '@/app/admin/components/BilingualInput';
import type { PageRecord, PageBlock, BlockType } from '@/types/page';

const { TextArea } = Input;

export default function BlockEditPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params?.id;
    const blockId = params?.blockId;
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState<PageRecord | null>(null);
    const [block, setBlock] = useState<PageBlock | null>(null);

    useEffect(() => {
        if (pageId && blockId) {
            loadData();
        }
    }, [pageId, blockId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pageRes, blockRes] = await Promise.all([
                fetch(`/api/pages-new/${pageId}`),
                fetch(`/api/pages-new/blocks/${blockId}`)
            ]);

            const pageData = await pageRes.json();
            const blockData = await blockRes.json();

            if (pageData.ok) setPage(pageData.data);
            if (blockData.ok) {
                setBlock(blockData.data);
                form.setFieldsValue({
                    enabled: Boolean(blockData.data.enabled),
                    ...(blockData.data.data || {})
                });
            }
        } catch (error) {
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values: any) => {
        if (!block) return;
        setSaving(true);
        try {
            const payload = {
                enabled: values.enabled,
                data: values // Simplified for now since structure is flat in values
            };
            delete payload.data.enabled; // Don't duplicate

            const response = await fetch(`/api/pages-new/blocks/${blockId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!result.ok) throw new Error(result.error);
            message.success('Block updated');
            router.push(`/admin/pages-new/${pageId}`);
        } catch (error) {
            message.error('Failed to update block');
        } finally {
            setSaving(false);
        }
    };

    const renderBlockFields = (type?: BlockType) => {
        // Reuse common fields
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Form.Item name="enabled" valuePropName="checked" label="Status">
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>

                <Divider titlePlacement="left">Main Content</Divider>
                <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue, setFieldValue }) => (
                        <BilingualInput
                            label="Title"
                            enValue={getFieldValue('title_en')}
                            bgValue={getFieldValue('title_bg')}
                            onEnChange={(v) => setFieldValue('title_en', v)}
                            onBgChange={(v) => setFieldValue('title_bg', v)}
                        />
                    )}
                </Form.Item>

                <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue, setFieldValue }) => (
                        <BilingualInput
                            label="Subtitle"
                            enValue={getFieldValue('subtitle_en')}
                            bgValue={getFieldValue('subtitle_bg')}
                            onEnChange={(v) => setFieldValue('subtitle_en', v)}
                            onBgChange={(v) => setFieldValue('subtitle_bg', v)}
                        />
                    )}
                </Form.Item>

                {(type === 'TEXT' || type === 'TEXT_IMAGE') && (
                    <>
                        <Divider titlePlacement="left">English Content</Divider>
                        <Form.Item name="content_en" noStyle>
                            <Form.Item noStyle shouldUpdate>
                                {({ getFieldValue, setFieldValue }) => (
                                    <SimpleEditor
                                        value={getFieldValue('content_en') || ''}
                                        onChange={(v) => setFieldValue('content_en', v)}
                                    />
                                )}
                            </Form.Item>
                        </Form.Item>

                        <Divider titlePlacement="left">Bulgarian Content</Divider>
                        <Form.Item name="content_bg" noStyle>
                            <Form.Item noStyle shouldUpdate>
                                {({ getFieldValue, setFieldValue }) => (
                                    <SimpleEditor
                                        value={getFieldValue('content_bg') || ''}
                                        onChange={(v) => setFieldValue('content_bg', v)}
                                    />
                                )}
                            </Form.Item>
                        </Form.Item>
                    </>
                )}

                {type === 'TEXT_IMAGE' && (
                    <>
                        <Divider titlePlacement="left">Image & Layout</Divider>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <Form.Item label="Image URL" name="image_url">
                                <Input placeholder="Storage path or full URL" />
                            </Form.Item>
                            <Form.Item label="Layout" name="layout">
                                <Select options={[
                                    { label: 'Image Left', value: 'left' },
                                    { label: 'Image Right', value: 'right' },
                                ]} />
                            </Form.Item>
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

    const breadcrumbItems = [
        { title: <Link href="/admin">Admin</Link> },
        { title: <Link href="/admin/pages-new">Pages</Link> },
        { title: <Link href={`/admin/pages-new/${pageId}`}>{page?.title || 'Page'}</Link> },
        { title: `Edit ${block?.type} Block` },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 24 }} />

            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Edit Content Block</h1>
                    <Typography.Text type="secondary">{block?.type} Block for "{page?.title}"</Typography.Text>
                </div>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>Save Block</Button>
                </Space>
            </div>

            <Card style={{ borderRadius: 12 }}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    {renderBlockFields(block?.type)}
                    <Button type="primary" size="large" htmlType="submit" loading={saving} style={{ marginTop: 32 }} block icon={<SaveOutlined />}>
                        Save All Block Changes
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
