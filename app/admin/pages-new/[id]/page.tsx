"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Breadcrumb,
    Button,
    Space,
    Tag,
    Modal,
    Form,
    Input,
    Select,
    message,
    Card,
    Tabs,
    Spin,
} from 'antd';
import {
    PlusOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    DeleteOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons';
import type { PageRecord, PageBlock, BlockType } from '../../../../types/page';

const { TextArea } = Input;

const blockTypeOptions: { label: string; value: BlockType }[] = [
    { label: 'Hero', value: 'HERO' },
    { label: 'Text', value: 'TEXT' },
    { label: 'Text + Image', value: 'TEXT_IMAGE' },
    { label: 'Gallery', value: 'GALLERY' },
    { label: 'YouTube', value: 'YOUTUBE' },
    { label: 'Featured Products', value: 'FEATURED_PRODUCTS' },
];

export default function PageBuilderPage() {
    const params = useParams();
    const pageId = params?.id ? Number(params.id) : NaN;
    const hasValidPageId = Number.isFinite(pageId) && pageId > 0;

    const [page, setPage] = useState<PageRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    const [blocksLoading, setBlocksLoading] = useState(false);
    const [addBlockModalOpen, setAddBlockModalOpen] = useState(false);
    const [editBlockModalOpen, setEditBlockModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null);
    const [addBlockForm] = Form.useForm<{ type: BlockType }>();
    const [blockForm] = Form.useForm();
    const [seoForm] = Form.useForm();
    const [seoSaving, setSeoSaving] = useState(false);

    const fetchPage = async () => {
        if (!hasValidPageId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/pages-new/${pageId}`);
            const payload = await response.json();

            if (!payload.ok) {
                throw new Error(payload.error || 'Unable to load page');
            }

            setPage(payload.data);
            seoForm.setFieldsValue({
                seo_title: payload.data?.seo_title ?? '',
                seo_description: payload.data?.seo_description ?? '',
                seo_keywords: payload.data?.seo_keywords ?? '',
                og_title: payload.data?.og_title ?? '',
                og_description: payload.data?.og_description ?? '',
                canonical_url: payload.data?.canonical_url ?? '',
            });
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to load page');
            setPage(null);
        } finally {
            setLoading(false);
        }
    };

    const loadBlocks = async () => {
        if (!hasValidPageId) return;

        setBlocksLoading(true);
        try {
            const response = await fetch(`/api/pages-new/${pageId}/blocks`);
            const payload = await response.json();

            if (!payload.ok) {
                throw new Error(payload.error || 'Unable to load blocks');
            }

            setBlocks(payload.data);
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to load blocks');
            setBlocks([]);
        } finally {
            setBlocksLoading(false);
        }
    };

    useEffect(() => {
        if (!hasValidPageId) return;
        fetchPage();
        loadBlocks();
    }, [pageId]);

    const handleAddBlock = async (values: { type: BlockType }) => {
        try {
            const response = await fetch(`/api/pages-new/${pageId}/blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: values.type, data: {} }),
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.error || 'Failed to create block');
            }

            message.success('Block added');
            setAddBlockModalOpen(false);
            loadBlocks();
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to add block');
        }
    };

    const handleEditBlock = (block: PageBlock) => {
        setEditingBlock(block);
        blockForm.setFieldsValue(block.data || {});
        setEditBlockModalOpen(true);
    };

    const handleSaveBlock = async (values: Record<string, unknown>) => {
        if (!editingBlock) return;

        try {
            const response = await fetch(`/api/pages-new/blocks/${editingBlock.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: values }),
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.error || 'Failed to update block');
            }

            message.success('Block updated');
            setEditBlockModalOpen(false);
            setEditingBlock(null);
            loadBlocks();
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to update block');
        }
    };

    const handleToggleBlock = async (block: PageBlock) => {
        try {
            const response = await fetch(`/api/pages-new/blocks/${block.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !block.enabled }),
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.error || 'Failed to toggle block');
            }

            message.success(block.enabled ? 'Block disabled' : 'Block enabled');
            loadBlocks();
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to toggle block');
        }
    };

    const handleDeleteBlock = (block: PageBlock) => {
        Modal.confirm({
            title: 'Delete block',
            content: 'Are you sure you want to delete this block?',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pages-new/blocks/${block.id}`, {
                        method: 'DELETE',
                    });

                    const result = await response.json();

                    if (!result.ok) {
                        throw new Error(result.error || 'Failed to delete block');
                    }

                    message.success('Block deleted');
                    loadBlocks();
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'Failed to delete block');
                }
            },
        });
    };

    const handleSaveSEO = async (values: Record<string, unknown>) => {
        if (!hasValidPageId) return;

        setSeoSaving(true);
        try {
            const response = await fetch(`/api/pages-new/${pageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.error || 'Failed to update SEO data');
            }

            message.success('SEO data saved');
            setPage(result.data);
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to save SEO data');
        } finally {
            setSeoSaving(false);
        }
    };

    const renderBlockForm = (type: BlockType) => {
        switch (type) {
            case 'HERO':
                return (
                    <>
                        <Form.Item name="title" label="Title">
                            <Input />
                        </Form.Item>
                        <Form.Item name="subtitle" label="Subtitle">
                            <Input />
                        </Form.Item>
                        <Form.Item name="description" label="Description">
                            <TextArea rows={3} />
                        </Form.Item>
                        <Form.Item name="cta_text" label="CTA Text">
                            <Input />
                        </Form.Item>
                        <Form.Item name="cta_link" label="CTA Link">
                            <Input />
                        </Form.Item>
                    </>
                );
            case 'TEXT':
                return (
                    <>
                        <Form.Item name="title" label="Title">
                            <Input />
                        </Form.Item>
                        <Form.Item name="content" label="Content">
                            <TextArea rows={6} />
                        </Form.Item>
                    </>
                );
            case 'TEXT_IMAGE':
                return (
                    <>
                        <Form.Item name="title" label="Title">
                            <Input />
                        </Form.Item>
                        <Form.Item name="content" label="Content">
                            <TextArea rows={6} />
                        </Form.Item>
                        <Form.Item name="layout" label="Layout">
                            <Select>
                                <Select.Option value="left">Image Left</Select.Option>
                                <Select.Option value="right">Image Right</Select.Option>
                            </Select>
                        </Form.Item>
                    </>
                );
            case 'YOUTUBE':
                return (
                    <>
                        <Form.Item name="title" label="Title">
                            <Input />
                        </Form.Item>
                        <Form.Item name="youtube_url" label="YouTube URL">
                            <Input placeholder="https://www.youtube.com/watch?v=..." />
                        </Form.Item>
                    </>
                );
            case 'FEATURED_PRODUCTS':
                return (
                    <Form.Item name="product_ids" label="Product IDs (comma-separated)">
                        <Input placeholder="1,2,3,4" />
                    </Form.Item>
                );
            case 'GALLERY':
                return <p>Gallery images are managed separately</p>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!page) {
        return <div>Page not found</div>;
    }

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item>
                    <Link href="/admin">Admin</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link href="/admin/pages-new">Pages</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>{page.title}</Breadcrumb.Item>
            </Breadcrumb>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <h2 style={{ margin: 0 }}>{page.title}</h2>
                    <Tag color={page.status === 'published' ? 'green' : 'default'}>
                        {(page.status || 'draft').toUpperCase()}
                    </Tag>
                </div>
            </div>

            <Tabs
                items={[
                    {
                        key: 'blocks',
                        label: 'Blocks',
                        children: (
                            <div>
                                <Button
                                    icon={<PlusOutlined />}
                                    type="primary"
                                    onClick={() => setAddBlockModalOpen(true)}
                                    style={{ marginBottom: 16 }}
                                >
                                    Add Block
                                </Button>

                                {blocksLoading ? (
                                    <Spin />
                                ) : blocks.length === 0 ? (
                                    <Card>
                                        <p style={{ textAlign: 'center', color: '#999' }}>
                                            No blocks yet. Click "Add Block" to get started.
                                        </p>
                                    </Card>
                                ) : (
                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                        {blocks.map((block, index) => (
                                            <Card
                                                key={block.id}
                                                title={
                                                    <Space>
                                                        <span>{block.type}</span>
                                                        {!block.enabled && <Tag>Disabled</Tag>}
                                                    </Space>
                                                }
                                                extra={
                                                    <Space>
                                                        <Button
                                                            size="small"
                                                            icon={block.enabled ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                                            onClick={() => handleToggleBlock(block)}
                                                        />
                                                        <Button
                                                            size="small"
                                                            onClick={() => handleEditBlock(block)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => handleDeleteBlock(block)}
                                                        />
                                                    </Space>
                                                }
                                            >
                                                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                                    {JSON.stringify(block.data, null, 2)}
                                                </pre>
                                            </Card>
                                        ))}
                                    </Space>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: 'seo',
                        label: 'SEO',
                        children: (
                            <Card>
                                <Form layout="vertical" form={seoForm} onFinish={handleSaveSEO}>
                                    <Form.Item name="seo_title" label="SEO Title">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="seo_description" label="SEO Description">
                                        <TextArea rows={3} />
                                    </Form.Item>
                                    <Form.Item name="seo_keywords" label="SEO Keywords">
                                        <Input placeholder="keyword1, keyword2, keyword3" />
                                    </Form.Item>
                                    <Form.Item name="og_title" label="OG Title">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="og_description" label="OG Description">
                                        <TextArea rows={3} />
                                    </Form.Item>
                                    <Form.Item name="canonical_url" label="Canonical URL">
                                        <Input placeholder="https://example.com/page" />
                                    </Form.Item>
                                    <Button type="primary" htmlType="submit" loading={seoSaving}>
                                        Save SEO Data
                                    </Button>
                                </Form>
                            </Card>
                        ),
                    },
                ]}
            />

            <Modal
                title="Add Block"
                open={addBlockModalOpen}
                onCancel={() => setAddBlockModalOpen(false)}
                onOk={() => addBlockForm.submit()}
            >
                <Form layout="vertical" form={addBlockForm} onFinish={handleAddBlock}>
                    <Form.Item name="type" label="Block Type" rules={[{ required: true }]}>
                        <Select options={blockTypeOptions} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Edit ${editingBlock?.type} Block`}
                open={editBlockModalOpen}
                onCancel={() => {
                    setEditBlockModalOpen(false);
                    setEditingBlock(null);
                }}
                onOk={() => blockForm.submit()}
                width={600}
            >
                <Form layout="vertical" form={blockForm} onFinish={handleSaveBlock}>
                    {editingBlock && renderBlockForm(editingBlock.type)}
                </Form>
            </Modal>
        </div>
    );
}
