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

const buildBlockData = (type: BlockType, values: Record<string, unknown>) => {
    const data: Record<string, unknown> = {};

    // Common bilingual fields
    if (values.title_en) data.title_en = values.title_en;
    if (values.title_bg) data.title_bg = values.title_bg;
    if (values.subtitle_en) data.subtitle_en = values.subtitle_en;
    if (values.subtitle_bg) data.subtitle_bg = values.subtitle_bg;
    if (values.description_en) data.description_en = values.description_en;
    if (values.description_bg) data.description_bg = values.description_bg;
    if (values.content_en) data.content_en = values.content_en;
    if (values.content_bg) data.content_bg = values.content_bg;
    if (values.cta_text_en) data.cta_text_en = values.cta_text_en;
    if (values.cta_text_bg) data.cta_text_bg = values.cta_text_bg;
    if (values.cta_link) data.cta_link = values.cta_link;
    if (values.image_url) data.image_url = values.image_url;
    if (values.video_url) data.video_url = values.video_url;

    switch (type) {
        case 'TEXT_IMAGE':
            if (values.layout) data.layout = values.layout;
            break;
        default:
            break;
    }

    return data;
};

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
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null);
    const [addBlockForm] = Form.useForm<{ type: BlockType }>();
    const [blockForm] = Form.useForm();
    const [seoForm] = Form.useForm<SeoFormValues>();
    const [seoSaving, setSeoSaving] = useState(false);
    const [seoGenerating, setSeoGenerating] = useState(false);
    const [heroOgId, setHeroOgId] = useState<number | null>(null);
    const [heroOgUrl, setHeroOgUrl] = useState<string | null>(null);
    const [mediaPickerConfig, setMediaPickerConfig] = useState<{
        title?: string;
        onSelect: (mediaId: number) => Promise<void> | void;
    } | null>(null);
    const [mediaCache, setMediaCache] = useState<Record<number, string>>({});
    const [textImageUrl, setTextImageUrl] = useState<string | null>(null);
    const [heroEnableCrop, setHeroEnableCrop] = useState(true);
    const [heroAspectRatio, setHeroAspectRatio] = useState<number | null>(null);
    const [heroCropVisible, setHeroCropVisible] = useState(false);
    const [heroImageToCrop, setHeroImageToCrop] = useState<string | null>(null);
    const [heroCroppedAreaPixels, setHeroCroppedAreaPixels] = useState<Area | null>(null);
    const [heroCrop, setHeroCrop] = useState({ x: 0, y: 0 });
    const [heroZoom, setHeroZoom] = useState(1);
    const [heroOriginalFile, setHeroOriginalFile] = useState<File | null>(null);
    const [heroUploadingImage, setHeroUploadingImage] = useState(false);
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

    const setHeroBackgroundImage = (mediaId: number, url: string, crop: CropMetadata | null) => {
        blockForm.setFieldsValue({
            background_image: { media_id: mediaId, crop },
        });
        setHeroOgId(mediaId);
        setHeroOgUrl(url);
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.crossOrigin = 'anonymous';
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2d context');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    };

    const handleHeroCropComplete = (_: Area, croppedAreaPixels: Area) => {
        setHeroCroppedAreaPixels(croppedAreaPixels);
    };

    const resetHeroCropState = () => {
        setHeroCropVisible(false);
        setHeroImageToCrop(null);
        setHeroOriginalFile(null);
        setHeroCroppedAreaPixels(null);
        setHeroCrop({ x: 0, y: 0 });
        setHeroZoom(1);
    };

    const uploadHeroFile = async (file: File) => {
        try {
            message.loading({ content: 'Uploading image...', key: 'upload' });
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/media', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.data && result.data.id) {
                setHeroBackgroundImage(result.data.id, result.data.url, null);
                message.success({ content: 'Image uploaded successfully', key: 'upload' });
            } else {
                message.error({ content: result.error || 'Failed to upload image', key: 'upload' });
            }
        } catch (error) {
            message.error({ content: 'Failed to upload image', key: 'upload' });
        }
    };

    const handleHeroUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;
            if (heroEnableCrop) {
                const reader = new FileReader();
                reader.onload = () => {
                    setHeroImageToCrop(reader.result as string);
                    setHeroOriginalFile(file);
                    setHeroCropVisible(true);
                };
                reader.readAsDataURL(file);
                return;
            }
            await uploadHeroFile(file);
        };
        input.click();
    };

    const handleHeroMediaSelect = async (mediaId: number) => {
        try {
            const url = await ensureMediaUrl(mediaId);
            if (heroEnableCrop) {
                const response = await fetch(url);
                const blob = await response.blob();
                const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
                const reader = new FileReader();
                reader.onload = () => {
                    setHeroImageToCrop(reader.result as string);
                    setHeroOriginalFile(file);
                    setHeroCropVisible(true);
                    setHeroCrop({ x: 0, y: 0 });
                    setHeroZoom(1);
                };
                reader.readAsDataURL(file);
            } else {
                setHeroBackgroundImage(mediaId, url, null);
                message.success('Image selected');
            }
        } catch (error) {
            message.error('Failed to prepare image');
        }
    };

    const handleHeroCropAndUpload = async () => {
        if (!heroImageToCrop || !heroCroppedAreaPixels || !heroOriginalFile) return;

        setHeroUploadingImage(true);
        try {
            message.loading({ content: 'Uploading cropped image...', key: 'upload' });
            const croppedBlob = await getCroppedImg(heroImageToCrop, heroCroppedAreaPixels);
            const croppedFile = new File([croppedBlob], heroOriginalFile.name, { type: heroOriginalFile.type });

            const formData = new FormData();
            formData.append('file', croppedFile);
            formData.append('derived', 'true');
            const response = await fetch('/api/media', { method: 'POST', body: formData });
            const result = await response.json();

            if (result.data && result.data.id) {
                const cropMeta: CropMetadata = {
                    x: heroCroppedAreaPixels.x,
                    y: heroCroppedAreaPixels.y,
                    width: heroCroppedAreaPixels.width,
                    height: heroCroppedAreaPixels.height,
                    ratio: heroAspectRatio,
                };
                setHeroBackgroundImage(result.data.id, result.data.url, cropMeta);
                message.success({ content: 'Image uploaded successfully', key: 'upload' });
                resetHeroCropState();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error: any) {
            message.error({ content: error.message || 'Failed to upload image', key: 'upload' });
        } finally {
            setHeroUploadingImage(false);
        }
    };

    const handleUploadImage = async (file: File) => {
        if (!editingBlock) return;
        const blockId = editingBlock.id;
        setImageUploading(prev => ({ ...prev, [blockId]: true }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('pageId', String(pageId));
            formData.append('blockId', String(blockId));

            const response = await fetch('/api/admin/collections/hero/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();

            const path = data.paths.full || data.paths.middle || data.paths.thumb;
            blockForm.setFieldValue('image_url', path);
            message.success('Image uploaded');
        } catch (error) {
            message.error('Upload failed');
        } finally {
            setImageUploading(prev => ({ ...prev, [blockId]: false }));
        }
    };

    const handleUploadVideo = async (file: File) => {
        if (!editingBlock) return;
        const blockId = editingBlock.id;
        setVideoUploading(prev => ({ ...prev, [blockId]: true }));
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/admin/collections/hero/upload-video', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Video upload failed');
            const data = await response.json();

            blockForm.setFieldValue('video_url', data.path);
            message.success('Video uploaded');
        } catch (error) {
            message.error('Video upload failed');
        } finally {
            setVideoUploading(prev => ({ ...prev, [blockId]: false }));
        }
    };

    const handleTextImageSelect = async (mediaId: number) => {
        blockForm.setFieldValue('image_id', mediaId);
        const url = await ensureMediaUrl(mediaId);
        setTextImageUrl(url);
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

    useEffect(() => {
        if (editingBlock?.type === 'TEXT_IMAGE') {
            const imageId = Number(editingBlock.data?.image_id);
            if (Number.isFinite(imageId)) {
                ensureMediaUrl(imageId).then(setTextImageUrl);
            } else {
                setTextImageUrl(null);
            }
        }
    }, [editingBlock]);

    useEffect(() => {
        const heroBlock = blocks.find((b) => b.type === 'HERO');
        const heroImage = heroBlock?.data?.background_image as any;
        const heroId = heroImage?.media_id ? Number(heroImage.media_id) : null;
        if (heroId) {
            ensureMediaUrl(heroId).then((url) => {
                setHeroOgId(heroId);
                setHeroOgUrl(url);
            });
        }
        setHeroAspectRatio(heroImage?.crop?.ratio ?? null);
    }, [blocks]);

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

    const openBlockEditModal = (block: PageBlock) => {
        setEditingBlock(block);
        blockForm.setFieldsValue({
            enabled: Boolean(block.enabled),
            ...(block.data || {})
        });
        setBlockModalOpen(true);
    };

    const handleBlockSave = async (values: Record<string, unknown>) => {
        if (!editingBlock) return;
        const payload = {
            enabled: values.enabled !== undefined ? values.enabled : editingBlock.enabled,
            data: buildBlockData(editingBlock.type, values)
        };
        try {
            const response = await fetch(`/api/pages-new/blocks/${editingBlock.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!result.ok) throw new Error(result.error || 'Failed to update block');
            setBlockModalOpen(false);
            loadBlocks();
            message.success('Block updated');
        } catch (error) {
            message.error('Failed to update block');
        }
    };

    const renderBlockFields = (type?: BlockType) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Enabled toggler */}
                <Form.Item name="enabled" valuePropName="checked" noStyle>
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>

                {/* Bilingual Title */}
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

                {/* Bilingual Subtitle */}
                <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue, setFieldValue }) => (
                        <BilingualInput
                            label="Subtitle"
                            enValue={getFieldValue('subtitle_en')}
                            bgValue={getFieldValue('subtitle_bg')}
                            onEnChange={(v) => setFieldValue('subtitle_en', v)}
                            onBgChange={(v) => setFieldValue('subtitle_bg', v)}
                            rows={2}
                        />
                    )}
                </Form.Item>

                {type === 'HERO' && (
                    <>
                        <Divider titlePlacement="left">Hero Media</Divider>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div>
                                <Typography.Text strong>Image (Bucket)</Typography.Text>
                                <Form.Item name="image_url" style={{ marginTop: 8 }}>
                                    <Input placeholder="Upload or enter path" />
                                </Form.Item>
                                <Space>
                                    <label style={{ display: 'inline-block' }}>
                                        <input
                                            type="file"
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUploadImage(file);
                                            }}
                                        />
                                        <Button
                                            icon={<UploadOutlined />}
                                            loading={imageUploading[editingBlock?.id ?? 0]}
                                            onClick={(e) => (e.currentTarget.previousSibling as HTMLInputElement).click()}
                                        >
                                            Upload Image
                                        </Button>
                                    </label>
                                </Space>
                            </div>
                            <div>
                                <Typography.Text strong>Video (YouTube or Bucket)</Typography.Text>
                                <Form.Item name="video_url" style={{ marginTop: 8 }}>
                                    <Input placeholder="YouTube URL or Bucket path" />
                                </Form.Item>
                                <Space>
                                    <label style={{ display: 'inline-block' }}>
                                        <input
                                            type="file"
                                            style={{ display: 'none' }}
                                            accept="video/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUploadVideo(file);
                                            }}
                                        />
                                        <Button
                                            icon={<UploadOutlined />}
                                            loading={videoUploading[editingBlock?.id ?? 0]}
                                            onClick={(e) => (e.currentTarget.previousSibling as HTMLInputElement).click()}
                                        >
                                            Upload Video
                                        </Button>
                                    </label>
                                </Space>
                            </div>
                        </div>

                        <Divider titlePlacement="left">Call to Action</Divider>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <Form.Item noStyle shouldUpdate>
                                {({ getFieldValue, setFieldValue }) => (
                                    <BilingualInput
                                        label="CTA Text"
                                        enValue={getFieldValue('cta_text_en')}
                                        bgValue={getFieldValue('cta_text_bg')}
                                        onEnChange={(v) => setFieldValue('cta_text_en', v)}
                                        onBgChange={(v) => setFieldValue('cta_text_bg', v)}
                                    />
                                )}
                            </Form.Item>
                            <Form.Item label="CTA Link (URL)" name="cta_link">
                                <Input placeholder="/shop or https://..." />
                            </Form.Item>
                        </div>
                    </>
                )}

                {(type === 'TEXT' || type === 'TEXT_IMAGE') && (
                    <>
                        <Divider titlePlacement="left">Content (English)</Divider>
                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue, setFieldValue }) => (
                                <SimpleEditor
                                    value={getFieldValue('content_en') || ''}
                                    onChange={(v) => setFieldValue('content_en', v)}
                                />
                            )}
                        </Form.Item>

                        <Divider titlePlacement="left">Content (Bulgarian)</Divider>
                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue, setFieldValue }) => (
                                <SimpleEditor
                                    value={getFieldValue('content_bg') || ''}
                                    onChange={(v) => setFieldValue('content_bg', v)}
                                />
                            )}
                        </Form.Item>
                    </>
                )}

                {type === 'TEXT_IMAGE' && (
                    <>
                        <Divider titlePlacement="left">Image & Layout</Divider>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div>
                                <Form.Item label="Image URL" name="image_url">
                                    <Input placeholder="Enter bucket path or full URL" />
                                </Form.Item>
                                <Space>
                                    <label style={{ display: 'inline-block' }}>
                                        <input
                                            type="file"
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUploadImage(file);
                                            }}
                                        />
                                        <Button
                                            icon={<UploadOutlined />}
                                            loading={imageUploading[editingBlock?.id ?? 0]}
                                            onClick={(e) => (e.currentTarget.previousSibling as HTMLInputElement).click()}
                                        >
                                            Upload Image
                                        </Button>
                                    </label>
                                </Space>
                            </div>
                            <Form.Item label="Layout" name="layout">
                                <Select options={[{ label: 'Image Left', value: 'left' }, { label: 'Image Right', value: 'right' }]} />
                            </Form.Item>
                        </div>
                    </>
                )}
            </div>
        );
    };


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
                            key: 'blocks', label: 'Content Blocks', children: (
                                <div>
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddBlockModalOpen(true)} style={{ marginBottom: 24 }}>Add Block</Button>
                                    {blocksLoading ? <Spin /> : (
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
                                                        <Button type="link" onClick={() => openBlockEditModal(block)}>Edit</Button>
                                                        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteBlock(block)} />
                                                    </Space>
                                                </div>
                                            ))}
                                        </Space>
                                    )}
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

            {/* Modals outside conditional rendering ensure Form instances are connected */}
            <Modal title="Add Content Block" open={addBlockModalOpen} onCancel={() => setAddBlockModalOpen(false)} onOk={() => addBlockForm.submit()} destroyOnHidden>
                <Form layout="vertical" form={addBlockForm} onFinish={handleAddBlock}>
                    <Form.Item label="Select Type" name="type" rules={[{ required: true }]}>
                        <Select options={blockTypeOptions.map(o => ({ ...o, disabled: o.value === 'HERO' && heroExists }))} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={`Edit ${editingBlock?.type}`} open={blockModalOpen} onCancel={() => setBlockModalOpen(false)} onOk={() => blockForm.submit()} width={700} destroyOnHidden>
                <Form layout="vertical" form={blockForm} onFinish={handleBlockSave}>
                    {renderBlockFields(editingBlock?.type)}
                </Form>
            </Modal>

            <MediaPicker open={Boolean(mediaPickerConfig)} title={mediaPickerConfig?.title} onCancel={() => setMediaPickerConfig(null)} onSelect={handleMediaPickerSelect} />

            <Modal title="Advanced Image Cropping" open={heroCropVisible} onCancel={resetHeroCropState} width={1000} centered footer={[
                <Button key="c" onClick={resetHeroCropState}>Cancel</Button>,
                <Button key="s" type="primary" loading={heroUploadingImage} onClick={handleHeroCropAndUpload}>Apply & Save</Button>
            ]}>
                {heroImageToCrop && (
                    <div style={{ height: 500, background: '#000', borderRadius: 8, overflow: 'hidden' }}>
                        <Cropper
                            image={heroImageToCrop}
                            crop={heroCrop}
                            zoom={heroZoom}
                            aspect={heroEnableCrop ? heroAspectRatio ?? undefined : undefined}
                            onCropChange={setHeroCrop}
                            onZoomChange={setHeroZoom}
                            onCropComplete={handleHeroCropComplete}
                        />
                    </div>
                )}
                <div style={{ marginTop: 20 }}>
                    <Slider min={1} max={3} step={0.1} value={heroZoom} onChange={v => setHeroZoom(Number(v))} />
                </div>
            </Modal>
        </div>
    );
}
