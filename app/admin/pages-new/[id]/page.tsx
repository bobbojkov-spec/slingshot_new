"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    Breadcrumb,
    Button,
    Space,
    Tag,
    Switch,
    Modal,
    Form,
    Input,
    Select,
    message,
    Empty,
    Spin,
    Tabs,
    Divider,
    Card,
    Progress,
    Tooltip,
    Slider,
    Typography,
} from 'antd';
import {
    PlusOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    UploadOutlined,
    FolderOutlined,
    DeleteOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { calculateSEOScore } from '@/lib/seo/calculate-seo-score';
import SimpleEditor from '@/components/SimpleEditor';
import MediaPicker from '@/components/MediaPicker';
import { PLACEHOLDER_IMAGE } from '@/lib/utils/placeholder-image';
import BilingualInput from '../../components/BilingualInput';
import type { PageRecord, PageBlock, BlockType } from '../../../../types/page';

const { TextArea } = Input;

type CropMetadata = {
    x: number;
    y: number;
    width: number;
    height: number;
    ratio: number | null;
};

type SeoFormValues = {
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
    og_title?: string;
    og_description?: string;
    canonical_url?: string;
};

const blockTypeOptions: { label: string; value: BlockType }[] = [
    { label: 'Hero', value: 'HERO' },
    { label: 'Text', value: 'TEXT' },
    { label: 'Text + Image', value: 'TEXT_IMAGE' },
];


export default function PageBuilderPage() {
    const params = useParams();
    const pageIdRaw = params?.id;
    const pageId = pageIdRaw ? Number(pageIdRaw) : NaN;
    const hasValidPageId = Number.isFinite(pageId) && pageId > 0;

    const [page, setPage] = useState<PageRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    const [blocksLoading, setBlocksLoading] = useState(false);
    const [addBlockModalOpen, setAddBlockModalOpen] = useState(false);
    const [addBlockForm] = Form.useForm<{ type: BlockType }>();
    const [seoForm] = Form.useForm<SeoFormValues>();
    const [heroForm] = Form.useForm();
    const [seoSaving, setSeoSaving] = useState(false);
    const [seoGenerating, setSeoGenerating] = useState(false);
    const [pageSaving, setPageSaving] = useState(false);
    const [imageUploading, setImageUploading] = useState<Record<number, boolean>>({});
    const [videoUploading, setVideoUploading] = useState<Record<number, boolean>>({});

    const heroExists = useMemo(() => blocks.some((block) => block.type === 'HERO'), [blocks]);

    const ensureMediaUrl = async (id: number) => {
        if (mediaCache[id]) return mediaCache[id];
        try {
            const response = await fetch(`/api/media/${id}`);
            if (!response.ok) throw new Error('Failed to fetch media');
            const payload = await response.json();
            const url = payload?.data?.url || PLACEHOLDER_IMAGE;
            setMediaCache((prev) => ({ ...prev, [id]: url }));
            return url;
        } catch (error) {
            console.error(error);
            return PLACEHOLDER_IMAGE;
        }
    };

    const openMediaPicker = (config: {
        title?: string;
        onSelect: (mediaId: number) => Promise<void> | void;
    }) => {
        setMediaPickerConfig(config);
    };

    const handleMediaPickerSelect = async (mediaId: number) => {
        if (mediaPickerConfig?.onSelect) await mediaPickerConfig.onSelect(mediaId);
        setMediaPickerConfig(null);
    };

    const handleMediaPickerCancel = () => setMediaPickerConfig(null);

    const handleAddBlock = async (values: { type: BlockType }) => {
        try {
            const response = await fetch(`/api/pages-new/${pageId}/blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: values.type, data: {} }),
            });
            const payload = await response.json();
            if (!payload.ok) throw new Error(payload.error || 'Failed to create block');
            setAddBlockModalOpen(false);
            addBlockForm.resetFields();
            loadBlocks();
            message.success('Block added');
        } catch (error) {
            message.error('Failed to add block');
        }
    };

    const handleSeoSave = async (values: SeoFormValues) => {
        if (!hasValidPageId) return;
        setSeoSaving(true);
        try {
            const payload = { ...values, og_image_id: heroOgId ?? null };
            const response = await fetch(`/api/pages-new/${pageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!result.ok) throw new Error(result.error || 'Failed to update SEO data');

            message.success('SEO data saved');
            setPage(result.data);
            seoForm.setFieldsValue({
                seo_title: result.data?.seo_title ?? '',
                seo_description: result.data?.seo_description ?? '',
                seo_keywords: result.data?.seo_keywords ?? '',
                og_title: result.data?.og_title ?? '',
                og_description: result.data?.og_description ?? '',
                canonical_url: result.data?.canonical_url ?? '',
            });
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Failed to save SEO data');
        } finally {
            setSeoSaving(false);
        }
    };

    const handleSeoGenerate = async () => {
        if (!hasValidPageId) return;
        setSeoGenerating(true);
        try {
            const response = await fetch(`/api/pages-new/${pageId}/seo/auto-generate`, { method: 'POST' });
            const result = await response.json();
            if (!result.ok) {
                message.error(result.error || 'Failed to generate SEO data');
                return;
            }
            const data = result.data || {};
            seoForm.setFieldsValue({
                seo_title: data.metaTitle ?? '',
                seo_description: data.metaDescription ?? '',
                seo_keywords: data.seoKeywords ?? '',
                og_title: data.ogTitle ?? '',
                og_description: data.ogDescription ?? '',
                canonical_url: data.canonicalUrl ?? '',
            });
            message.success('SEO data generated successfully!');
        } catch (error) {
            message.error('Failed to generate SEO data');
        } finally {
            setSeoGenerating(false);
        }
    };

    const handlePageSave = async (values: any) => {
        if (!hasValidPageId) return;
        setPageSaving(true);
        try {
            const response = await fetch(`/api/pages-new/${pageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const result = await response.json();
            if (!result.ok) throw new Error(result.error || 'Failed to update page settings');

            message.success('Page settings saved');
            setPage(result.data);

            heroForm.setFieldsValue({
                title_en: result.data?.title ?? '',
                title_bg: result.data?.title_bg ?? '',
                subtitle_en: result.data?.subtitle_en ?? '',
                subtitle_bg: result.data?.subtitle_bg ?? '',
                hero_image_url: result.data?.hero_image_url ?? '',
                hero_video_url: result.data?.hero_video_url ?? '',
            });
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Failed to save page settings');
        } finally {
            setPageSaving(false);
        }
    };

    const fetchPage = async () => {
        if (!hasValidPageId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`/api/pages-new/${pageId}`);
            const payload = await response.json();
            if (!payload.ok) throw new Error(payload.error || 'Unable to load page');
            setPage(payload.data);

            // Populate forms
            seoForm.setFieldsValue({
                seo_title: payload.data?.seo_title ?? '',
                seo_description: payload.data?.seo_description ?? '',
                seo_keywords: payload.data?.seo_keywords ?? '',
                og_title: payload.data?.og_title ?? '',
                og_description: payload.data?.og_description ?? '',
                canonical_url: payload.data?.canonical_url ?? '',
            });

            heroForm.setFieldsValue({
                title_en: payload.data?.title ?? '',
                title_bg: payload.data?.title_bg ?? '',
                subtitle_en: payload.data?.subtitle_en ?? '',
                subtitle_bg: payload.data?.subtitle_bg ?? '',
                hero_image_url: payload.data?.hero_image_url ?? '',
                hero_video_url: payload.data?.hero_video_url ?? '',
            });

            if (payload.data?.signed_hero_image_url) {
                setHeroOgUrl(payload.data.signed_hero_image_url);
            }
        } catch (error) {
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
            if (!payload.ok) throw new Error(payload.error || 'Unable to load blocks');
            setBlocks(payload.data);
        } catch (error) {
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
    }, [pageIdRaw]);

    useEffect(() => {
        if (!page) {
            seoForm.resetFields();
            return;
        }
        seoForm.setFieldsValue({
            seo_title: page.seo_title ?? '',
            seo_description: page.seo_description ?? '',
            seo_keywords: page.seo_keywords ?? '',
            og_title: page.og_title ?? '',
            og_description: page.og_description ?? '',
            canonical_url: page.canonical_url ?? '',
        });
    }, [page, seoForm]);



    const handleMoveBlock = async (block: PageBlock, direction: 'up' | 'down') => {
        const ordered = blocks.map(b => b.id);
        const idx = ordered.indexOf(block.id);
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= ordered.length) return;
        [ordered[idx], ordered[swapIdx]] = [ordered[swapIdx], ordered[idx]];
        try {
            await fetch(`/api/pages-new/${pageId}/blocks/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockIds: ordered }),
            });
            loadBlocks();
        } catch (e) { message.error('Failed to reorder'); }
    };

    const handleToggleBlockEnabled = async (block: PageBlock, value: boolean) => {
        try {
            await fetch(`/api/pages-new/blocks/${block.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: value }),
            });
            loadBlocks();
        } catch (e) { message.error('Failed to update'); }
    };

    const handleDeleteBlock = (block: PageBlock) => {
        Modal.confirm({
            title: 'Delete Block',
            content: `Delete ${block.type}?`,
            onOk: async () => {
                await fetch(`/api/pages-new/blocks/${block.id}`, { method: 'DELETE' });
                loadBlocks();
                message.success('Deleted');
            }
        });
    };

    const breadcrumbItems = [
        { title: <Link href="/admin">Admin</Link> },
        { title: <Link href="/admin/pages-new">Pages</Link> },
        { title: page?.title || 'Loading...' },
    ];

    // If data is not yet loaded, show loading state, but keep the Form hooks active
    return (
        <div style={{ padding: 24 }}>
            <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 24 }} />

            {loading && !page ? (
                <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" tip="Loading Page Builder..." /></div>
            ) : !page ? (
                <div style={{ textAlign: 'center', padding: 100 }}>Page not found</div>
            ) : (
                <>
                    <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{page.title}</h1>
                            <Space style={{ marginTop: 8 }}>
                                <Tag color={page.status === 'published' ? 'green' : 'orange'}>{page.status?.toUpperCase()}</Tag>
                                <code style={{ fontSize: 13, background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>/{page.slug}</code>
                            </Space>
                        </div>
                    </div>

                    <Tabs items={[
                        {
                            key: 'blocks', label: 'Page Content', children: (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                    {/* Fixed HERO section like Collections */}
                                    <Card title="Hero Banner (Optional)" style={{ borderRadius: 12 }}>
                                        <Form form={heroForm} layout="vertical" onFinish={handlePageSave}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                                                <Form.Item label="Image URL" name="hero_image_url">
                                                    <Input placeholder="Bucket storage path" />
                                                </Form.Item>
                                                <Form.Item label="Video URL" name="hero_video_url">
                                                    <Input placeholder="YouTube or Bucket path" />
                                                </Form.Item>
                                            </div>

                                            <Form.Item noStyle shouldUpdate>
                                                {({ getFieldValue, setFieldValue }) => (
                                                    <BilingualInput
                                                        label="Hero Subtitle"
                                                        enValue={getFieldValue('subtitle_en')}
                                                        bgValue={getFieldValue('subtitle_bg')}
                                                        onEnChange={(v) => setFieldValue('subtitle_en', v)}
                                                        onBgChange={(v) => setFieldValue('subtitle_bg', v)}
                                                    />
                                                )}
                                            </Form.Item>

                                            <Button type="primary" htmlType="submit" loading={pageSaving} style={{ marginTop: 24 }} icon={<SaveOutlined />}>
                                                Save Hero Settings
                                            </Button>
                                        </Form>
                                    </Card>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Content Blocks</h3>
                                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddBlockModalOpen(true)}>Add Content Block</Button>
                                        </div>

                                        {blocksLoading ? (
                                            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                                        ) : blocks.length === 0 ? (
                                            <Empty description="No content blocks yet" />
                                        ) : (
                                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                                {blocks.map((block) => (
                                                    <div key={block.id} style={{ display: 'flex', alignItems: 'center', padding: 16, border: '1px solid #f0f0f0', borderRadius: 12, background: '#fff' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <Space>
                                                                <strong style={{ fontSize: 16 }}>{block.position}.</strong>
                                                                <Tag color={block.type === 'HERO' ? 'blue' : 'default'} style={{ fontSize: 13, padding: '2px 8px' }}>{block.type}</Tag>
                                                                <Switch size="small" checked={Boolean(block.enabled)} onChange={(v) => handleToggleBlockEnabled(block, v)} />
                                                            </Space>
                                                        </div>
                                                        <Space>
                                                            <Button icon={<ArrowUpOutlined />} size="small" type="text" disabled={block.position === 1} onClick={() => handleMoveBlock(block, 'up')} />
                                                            <Button icon={<ArrowDownOutlined />} size="small" type="text" disabled={block.position === blocks.length} onClick={() => handleMoveBlock(block, 'down')} />
                                                            <Link href={`/admin/pages-new/${pageId}/blocks/${block.id}`}>
                                                                <Button type="link">Edit Content</Button>
                                                            </Link>
                                                            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteBlock(block)} />
                                                        </Space>
                                                    </div>
                                                ))}
                                            </Space>
                                        )}
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'seo', label: 'SEO & Meta', forceRender: true, children: (
                                <Card style={{ borderRadius: 12 }}>
                                    <Form form={seoForm} layout="vertical" onFinish={handleSeoSave}>
                                        <div style={{ display: 'flex', gap: 12, marginBottom: 24, padding: 16, background: '#f0faff', borderRadius: 8, border: '1px solid #e6f7ff' }}>
                                            <Button type="primary" loading={seoGenerating} onClick={handleSeoGenerate}>AI Auto-Generate</Button>
                                            <div style={{ fontSize: 13, color: '#0050b3', alignSelf: 'center' }}>Smart generation based on Hero and Text blocks.</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                            <div>
                                                <Form.Item label="SEO Title" name="seo_title"><Input /></Form.Item>
                                                <Form.Item label="SEO Description" name="seo_description"><TextArea rows={4} /></Form.Item>
                                                <Form.Item label="SEO Keywords" name="seo_keywords"><Input placeholder="comma, separated, tags" /></Form.Item>
                                            </div>
                                            <div>
                                                <Form.Item label="Social Title (OG)" name="og_title"><Input /></Form.Item>
                                                <Form.Item label="Social Description (OG)" name="og_description"><TextArea rows={4} /></Form.Item>
                                                <Form.Item label="Canonical URL" name="canonical_url"><Input /></Form.Item>
                                            </div>
                                        </div>

                                        <Divider />

                                        <Form.Item shouldUpdate>
                                            {() => {
                                                const v = seoForm.getFieldsValue();
                                                const res = calculateSEOScore({
                                                    seo_title: v.seo_title,
                                                    seo_description: v.seo_description,
                                                    seo_keywords: v.seo_keywords,
                                                    og_title: v.og_title,
                                                    og_description: v.og_description,
                                                    canonical_url: v.canonical_url
                                                });
                                                const color = res.score >= 80 ? '#52c41a' : res.score >= 50 ? '#faad14' : '#ff4d4f';

                                                return (
                                                    <Card size="small" style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                            <span style={{ fontWeight: 600 }}>SEO Health Check</span>
                                                            <span style={{ fontSize: 24, fontWeight: 800, color }}>{res.score}%</span>
                                                        </div>
                                                        <Progress percent={res.score} strokeColor={color} showInfo={false} style={{ marginBottom: 20 }} />
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                                            {Object.entries(res.checks).map(([k, c]: [string, any]) => (
                                                                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: c.passed ? '#52c41a' : '#999' }}>
                                                                    <Tooltip title={c.message}><span style={{ width: 8, height: 8, borderRadius: '50%', background: c.passed ? '#52c41a' : '#ff4d4f' }} /></Tooltip>
                                                                    {k.replace(/([A-Z])/g, ' $1').toUpperCase()}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Card>
                                                );
                                            }}
                                        </Form.Item>

                                        <Button type="primary" size="large" htmlType="submit" loading={seoSaving} style={{ marginTop: 16 }}>Save SEO Changes</Button>
                                    </Form>
                                </Card>
                            )
                        }
                    ]} />

                </>
            )}

            <Modal title="Add Content Block" open={addBlockModalOpen} onCancel={() => setAddBlockModalOpen(false)} onOk={() => addBlockForm.submit()} destroyOnHidden>
                <Form layout="vertical" form={addBlockForm} onFinish={handleAddBlock}>
                    <Form.Item label="Select Type" name="type" rules={[{ required: true }]}>
                        <Select options={blockTypeOptions.map(o => ({ ...o, disabled: o.value === 'HERO' && heroExists }))} />
                    </Form.Item>
                </Form>
            </Modal>

            <MediaPicker open={Boolean(mediaPickerConfig)} title={mediaPickerConfig?.title} onCancel={() => setMediaPickerConfig(null)} onSelect={handleMediaPickerSelect} />

        </div>
    );
}
