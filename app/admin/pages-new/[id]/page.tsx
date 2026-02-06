"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
    Card,
    Progress,
    Tooltip,
    Divider
} from 'antd';
import {
    PlusOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    DeleteOutlined,
    SaveOutlined,
    ArrowLeftOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import { calculateSEOScore } from '@/lib/seo/calculate-seo-score';
import TiptapBilingualRichText from '@/app/admin/components/TiptapBilingualRichText';
import BilingualInput from '../../components/BilingualInput';
import type { PageRecord, PageBlock, BlockType } from '../../../../types/page';

const { TextArea } = Input;

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
    { label: 'FAQ Module', value: 'FAQ' },
    { label: 'Contact Form', value: 'CONTACT_FORM' },
];

export default function PageBuilderPage() {
    const params = useParams();
    const router = useRouter();
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
    const [settingsForm] = Form.useForm();
    const [seoSaving, setSeoSaving] = useState(false);
    const [seoGenerating, setSeoGenerating] = useState(false);
    const [pageSaving, setPageSaving] = useState(false);

    // Hero Upload State
    const [uploading, setUploading] = useState(false);
    const [videoUploading, setVideoUploading] = useState(false);
    const [heroDisplayUrl, setHeroDisplayUrl] = useState('');
    const [heroImageError, setHeroImageError] = useState(false);
    const [heroImageUrl, setHeroImageUrl] = useState('');
    const [heroVideoUrl, setHeroVideoUrl] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pageId', pageId.toString());

        try {
            const response = await fetch('/api/admin/pages/hero/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');

            const relativePath = data.paths.full || data.paths.middle || data.paths.thumb;
            const signedUrl = data.urls.full || data.urls.middle || data.urls.thumb;

            setHeroImageUrl(relativePath);
            setHeroDisplayUrl(signedUrl);
            settingsForm.setFieldsValue({ hero_image_url: relativePath });
        } catch (err: any) {
            message.error(err.message || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setVideoUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pageId', pageId.toString());

        try {
            const response = await fetch('/api/admin/pages/hero/upload-video', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');

            setHeroVideoUrl(data.path);
            settingsForm.setFieldsValue({ hero_video_url: data.path });
            message.success('Video uploaded');
        } catch (err: any) {
            message.error(err.message || 'Video upload failed');
        } finally {
            setVideoUploading(false);
            e.target.value = '';
        }
    };

    const fetchPage = async () => {
        if (!hasValidPageId) { setLoading(false); return; }
        setLoading(true);
        try {
            const response = await fetch(`/api/pages-new/${pageId}`);
            const payload = await response.json();
            if (!payload.ok) throw new Error(payload.error);
            setPage(payload.data);

            // Populate forms
            const d = payload.data;
            settingsForm.setFieldsValue({
                title: d.title,
                title_bg: d.title_bg,
                slug: d.slug,
                status: d.status,
                show_footer: d.show_footer,
                hero_image_url: d.hero_image_url,
                hero_video_url: d.hero_video_url,
                subtitle_en: d.subtitle_en,
                subtitle_bg: d.subtitle_bg,
                content: d.content,
                content_bg: d.content_bg,
            });

            setHeroImageUrl(d.hero_image_url || '');
            setHeroVideoUrl(d.hero_video_url || '');
            if (d.signed_hero_image_url) setHeroDisplayUrl(d.signed_hero_image_url);
            else if (d.hero_image_url) setHeroDisplayUrl(d.hero_image_url); // Fallback

            seoForm.setFieldsValue({
                seo_title: d.seo_title || '',
                seo_description: d.seo_description || '',
                seo_keywords: d.seo_keywords || '',
                og_title: d.og_title || '',
                og_description: d.og_description || '',
                canonical_url: d.canonical_url || '',
            });

        } catch (e: any) {
            message.error(e.message || 'Failed to load page');
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
            if (payload.ok) setBlocks(payload.data);
        } catch (e) { console.error(e); } finally { setBlocksLoading(false); }
    };

    useEffect(() => { fetchPage(); loadBlocks(); }, [pageId]);

    const handleSettingsSave = async (values: any) => {
        if (!hasValidPageId) return;
        setPageSaving(true);
        try {
            const res = await fetch(`/api/pages-new/${pageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const result = await res.json();
            if (!result.ok) throw new Error(result.error);
            setPage(result.data);
            message.success('Settings saved successfully');
        } catch (e: any) {
            message.error(e.message || 'Save failed');
        } finally {
            setPageSaving(false);
        }
    };

    const handleAddBlock = async (values: { type: BlockType }) => {
        try {
            const response = await fetch(`/api/pages-new/${pageId}/blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: values.type, data: {} }),
            });
            if (response.ok) {
                setAddBlockModalOpen(false);
                addBlockForm.resetFields();
                loadBlocks();
                message.success('Block added');
            }
        } catch (e) { message.error('Failed to create block'); }
    };

    const handleSeoSave = async (values: SeoFormValues) => {
        setSeoSaving(true);
        try {
            const res = await fetch(`/api/pages-new/${pageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (res.ok) message.success('SEO saved');
            else throw new Error('Failed');
        } catch (e) { message.error('Failed to save SEO'); }
        finally { setSeoSaving(false); }
    };

    const handleSeoGenerate = async () => {
        setSeoGenerating(true);
        try {
            const res = await fetch(`/api/pages-new/${pageId}/seo/auto-generate`, { method: 'POST' });
            const data = await res.json();
            if (data.ok) {
                const d = data.data;
                seoForm.setFieldsValue({
                    seo_title: d.metaTitle,
                    seo_description: d.metaDescription,
                    seo_keywords: d.seoKeywords,
                    og_title: d.ogTitle,
                    og_description: d.ogDescription,
                    canonical_url: d.canonicalUrl,
                });
                message.success('SEO Generated');
            } else throw new Error(data.error);
        } catch (e: any) { message.error(e.message); }
        finally { setSeoGenerating(false); }
    };

    if (loading && !page) return <Spin fullscreen tip="Loading Page Editor..." />;
    if (!page) return <Empty description="Page not found" />;

    return (
        <div className="p-8 max-w-7xl mx-auto pb-32">
            <div className="mb-6">
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/pages-new')} style={{ paddingLeft: 0, fontSize: 16 }}>
                    Back to Pages
                </Button>
            </div>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{page.title}</h1>
                    <Space>
                        <Tag color={page.status === 'published' ? 'green' : 'orange'}>{page.status?.toUpperCase()}</Tag>
                        <Tag>{`/${page.slug}`}</Tag>
                    </Space>
                </div>
            </div>

            <Tabs defaultActiveKey="settings" items={[
                {
                    key: 'settings',
                    label: 'Page Settings & Content',
                    children: (
                        <Form form={settingsForm} layout="vertical" onFinish={handleSettingsSave} className="space-y-8">

                            {/* 1. Basic Info & Visibility */}
                            <Card title="General Information" className="shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <BilingualInput
                                            label="Page Title"
                                            enValue={settingsForm.getFieldValue('title')}
                                            bgValue={settingsForm.getFieldValue('title_bg')}
                                            onEnChange={v => settingsForm.setFieldValue('title', v)}
                                            onBgChange={v => settingsForm.setFieldValue('title_bg', v)}
                                        />
                                        <Form.Item label="URL Slug" name="slug" help="Unique identifier for the URL (e.g., 'about-us')">
                                            <Input />
                                        </Form.Item>
                                    </div>
                                    <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-100">
                                        <Form.Item label="Status" name="status">
                                            <Select options={[{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }]} />
                                        </Form.Item>
                                        <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                                            <span className="text-sm font-medium">Show in Footer?</span>
                                            <Form.Item name="show_footer" valuePropName="checked" noStyle>
                                                <Switch />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* 2. Hero Section (Replicated from Collections) */}
                            <Card title="Hero Banner (Optional)" className="shadow-sm">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="w-full md:w-[320px] flex-shrink-0">
                                        <div className="relative aspect-video w-full rounded overflow-hidden bg-gray-50 border border-gray-100 group">
                                            {heroDisplayUrl && !heroImageError ? (
                                                <img
                                                    src={heroDisplayUrl}
                                                    alt="Hero"
                                                    className="w-full h-full object-cover"
                                                    onError={() => setHeroImageError(true)}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                                    <UploadOutlined style={{ fontSize: 24 }} />
                                                    <span className="text-xs uppercase font-bold">No Image</span>
                                                </div>
                                            )}
                                            {uploading && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <Spin tip="Uploading..." />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Upload Media</label>
                                            <label className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 w-fit">
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                                                <UploadOutlined className="mr-2" /> {uploading ? 'Processing...' : 'Upload Hero Image'}
                                            </label>
                                            <p className="text-xs text-gray-500">Auto-generates 300px, 1000px, 1900px variants.</p>
                                        </div>
                                        <Form.Item label="Image URL (Manual)" name="hero_image_url">
                                            <Input onChange={e => { setHeroImageUrl(e.target.value); setHeroDisplayUrl(e.target.value); }} />
                                        </Form.Item>

                                        <Divider />

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Video</label>
                                            <div className="flex gap-2">
                                                <Form.Item name="hero_video_url" noStyle><Input placeholder="Video URL" /></Form.Item>
                                                <label className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200 border border-gray-300">
                                                    <input type="file" className="hidden" accept="video/*" onChange={handleVideoFileChange} disabled={videoUploading} />
                                                    {videoUploading ? <Spin size="small" /> : 'Upload MP4'}
                                                </label>
                                            </div>
                                        </div>

                                        <BilingualInput
                                            label="Hero Subtitle"
                                            enValue={settingsForm.getFieldValue('subtitle_en')}
                                            bgValue={settingsForm.getFieldValue('subtitle_bg')}
                                            onEnChange={(v) => settingsForm.setFieldValue('subtitle_en', v)}
                                            onBgChange={(v) => settingsForm.setFieldValue('subtitle_bg', v)}
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* 3. Main Page Content (Tiptap) */}
                            <Card title="Main Content" className="shadow-sm">
                                <TiptapBilingualRichText
                                    label="Page Body"
                                    enValue={settingsForm.getFieldValue('content') || ''}
                                    bgValue={settingsForm.getFieldValue('content_bg') || ''}
                                    onEnChange={(val: string) => settingsForm.setFieldValue('content', val)}
                                    onBgChange={(val: string) => settingsForm.setFieldValue('content_bg', val)}
                                />
                            </Card>

                            <div className="sticky bottom-4 z-10 flex justify-end">
                                <Button type="primary" size="large" htmlType="submit" loading={pageSaving} icon={<SaveOutlined />} className="shadow-lg">
                                    Save All Settings
                                </Button>
                            </div>
                        </Form>
                    )
                },
                {
                    key: 'advanced',
                    label: 'Advanced Blocks',
                    children: (
                        <Card title="Content Blocks (Legacy / Modular)" className="shadow-sm">
                            <div className="flex justify-end mb-4">
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddBlockModalOpen(true)}>Add Block</Button>
                            </div>

                            {blocksLoading ? <div className="text-center p-8"><Spin /></div> : (
                                <Space direction="vertical" className="w-full">
                                    {blocks.length === 0 && <Empty description="No blocks added" />}
                                    {blocks.map((block, idx) => (
                                        <div key={block.id} className="flex items-center p-4 border rounded bg-white hover:shadow-sm transition-shadow">
                                            <div className="flex-1">
                                                <Space>
                                                    <Tag color="blue">{idx + 1}</Tag>
                                                    <span className="font-medium">{block.type}</span>
                                                    <Tag>{block.enabled ? 'Enabled' : 'Disabled'}</Tag>
                                                </Space>
                                            </div>
                                            <Space>
                                                <Link href={`/admin/pages-new/${pageId}/blocks/${block.id}`}>
                                                    <Button size="small">Edit</Button>
                                                </Link>
                                                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {/* Handle delete logic */ }} />
                                            </Space>
                                        </div>
                                    ))}
                                </Space>
                            )}
                        </Card>
                    )
                },
                {
                    key: 'seo',
                    label: 'SEO & Meta',
                    children: (
                        <Form form={seoForm} layout="vertical" onFinish={handleSeoSave}>
                            <Card className="shadow-sm">
                                <div className="flex items-center gap-4 bg-blue-50 p-4 rounded mb-6">
                                    <Button type="primary" loading={seoGenerating} onClick={handleSeoGenerate}>AI Auto-Generate SEO</Button>
                                    <span className="text-sm text-blue-800">Generates metadata from page content and title.</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <Form.Item label="Meta Title" name="seo_title"><Input /></Form.Item>
                                        <Form.Item label="Meta Description" name="seo_description"><TextArea rows={4} /></Form.Item>
                                        <Form.Item label="Keywords" name="seo_keywords"><Input /></Form.Item>
                                    </div>
                                    <div className="space-y-4">
                                        <Form.Item label="OG Title" name="og_title"><Input /></Form.Item>
                                        <Form.Item label="OG Description" name="og_description"><TextArea rows={4} /></Form.Item>
                                        <Form.Item label="Canonical URL" name="canonical_url"><Input /></Form.Item>
                                    </div>
                                </div>
                                <Divider />
                                <div className="flex justify-end">
                                    <Button type="primary" htmlType="submit" loading={seoSaving}>Save SEO</Button>
                                </div>
                            </Card>
                        </Form>
                    )
                }
            ]} />

            {/* Modals */}
            <Modal title="Add Block" open={addBlockModalOpen} onCancel={() => setAddBlockModalOpen(false)} onOk={addBlockForm.submit} forceRender>
                <Form form={addBlockForm} onFinish={handleAddBlock}>
                    <Form.Item name="type" rules={[{ required: true }]}>
                        <Select options={blockTypeOptions} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
