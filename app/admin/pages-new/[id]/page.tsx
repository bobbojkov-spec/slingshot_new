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
} from 'antd';
import {
    PlusOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    UploadOutlined,
    FolderOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { calculateSEOScore } from '@/lib/seo/calculate-seo-score';
import SimpleEditor from '@/components/SimpleEditor';
import MediaPicker from '@/components/MediaPicker';
import GalleryMediaPicker, {
    GalleryMediaSelection,
} from '@/components/GalleryMediaPicker';
import { PLACEHOLDER_IMAGE } from '@/lib/utils/placeholder-image';
import type { PageRecord } from '../../../../types/page';

const { TextArea } = Input;

type BlockType = 'HERO' | 'TEXT' | 'TEXT_IMAGE' | 'GALLERY' | 'YOUTUBE' | 'FEATURED_PRODUCTS';

type GalleryRow = {
    galleryRowId: number | null;
    mediaId: number;
    url: string;
    filename: string | null;
    position: number;
};

type GalleryImageRecord = {
    media_id: number;
    url: string;
    position: number;
};

type PageBlock = {
    id: number;
    page_id: number;
    type: BlockType;
    position: number;
    data: Record<string, unknown> | null;
    enabled: boolean | null;
    gallery_images?: GalleryImageRecord[];
};

type ProductSummary = {
    id: number;
    name: string;
    price: number;
    currency: string;
    active: boolean;
    image: string | null;
};

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
    { label: 'Gallery', value: 'GALLERY' },
    { label: 'YouTube', value: 'YOUTUBE' },
    { label: 'Featured Products', value: 'FEATURED_PRODUCTS' },
];

const parseNumberArray = (value: string | number[] | undefined) => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.map((entry) => Number(entry));
    }

    return value
        .split(',')
        .map((entry) => Number(entry.trim()))
        .filter((entry) => !Number.isNaN(entry));
};

const buildBlockData = (type: BlockType, values: Record<string, unknown>) => {
    const data: Record<string, unknown> = {};

    switch (type) {
        case 'HERO': {
            if (values.title) data.title = values.title;
            if (values.subtitle) data.subtitle = values.subtitle;
            if (values.description) data.description = values.description;
            if (values.cta_text) data.cta_text = values.cta_text;
            if (values.cta_link) data.cta_link = values.cta_link;
            const backgroundImage = values.background_image as {
                media_id?: number;
                crop?: CropMetadata | null;
            } | null;
            if (backgroundImage?.media_id) {
                data.background_image = {
                    media_id: backgroundImage.media_id,
                    crop: backgroundImage.crop ?? null,
                };
            }
            break;
        }
        case 'TEXT':
            if (values.content) data.content = values.content;
            if (values.title) data.title = values.title;
            break;
        case 'TEXT_IMAGE':
            if (values.content) data.content = values.content;
            if (values.title) data.title = values.title;
            if (values.image_id) data.image_id = values.image_id;
            if (values.layout) data.layout = values.layout;
            break;
        case 'GALLERY':
            break;
        case 'YOUTUBE':
            if (values.title) data.title = values.title;
            if (values.youtube_url) data.youtube_url = values.youtube_url;
            break;
        case 'FEATURED_PRODUCTS':
            if (values.product_ids) {
                data.product_ids = Array.isArray(values.product_ids)
                    ? values.product_ids.map(Number)
                    : parseNumberArray(values.product_ids as string);
            }
            break;
        default:
            break;
    }

    return data;
};

const extractYouTubeId = (value?: string) => {
    if (!value) {
        return null;
    }
    const match =
        value.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([A-Za-z0-9_-]{11})/) ||
        value.match(/(?:embed\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : null;
};

export default function PagesNewBuilderPage() {
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
    const [galleryImages, setGalleryImages] = useState<GalleryRow[]>([]);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [gallerySaving, setGallerySaving] = useState(false);
    const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [heroEnableCrop, setHeroEnableCrop] = useState(true);
    const [heroAspectRatio, setHeroAspectRatio] = useState<number | null>(null);
    const [heroCropVisible, setHeroCropVisible] = useState(false);
    const [heroImageToCrop, setHeroImageToCrop] = useState<string | null>(null);
    const [heroCroppedAreaPixels, setHeroCroppedAreaPixels] = useState<Area | null>(null);
    const [heroCrop, setHeroCrop] = useState({ x: 0, y: 0 });
    const [heroZoom, setHeroZoom] = useState(1);
    const [heroOriginalFile, setHeroOriginalFile] = useState<File | null>(null);
    const [heroUploadingImage, setHeroUploadingImage] = useState(false);

    const heroExists = useMemo(() => blocks.some((block) => block.type === 'HERO'), [blocks]);

    const ensureMediaUrl = async (id: number) => {
        if (mediaCache[id]) {
            return mediaCache[id];
        }
        try {
            const response = await fetch(`/api/media/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch media');
            }
            const payload = await response.json();
            const url = payload?.data?.url || PLACEHOLDER_IMAGE;
            setMediaCache((prev) => ({ ...prev, [id]: url }));
            return url;
        } catch (error) {
            console.error(error);
            return PLACEHOLDER_IMAGE;
        }
    };

    const saveGalleryImages = async () => {
        if (!editingBlock) {
            return;
        }

        setGallerySaving(true);
        try {
            const response = await fetch(
                `/api/pages-new/blocks/${editingBlock.id}/gallery`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        images: galleryImages.map((image) => ({ mediaId: image.mediaId })),
                    }),
                }
            );
            const result = await parseJsonResponse(response);

            if (!result.ok) {
                throw new Error(result.error || 'Failed to save gallery images');
            }

            const rows = Array.isArray(result.data) ? result.data : [];
            setGalleryImages(
                rows.map((row: any) => ({
                    galleryRowId: Number(row.galleryRowId),
                    mediaId: Number(row.media_id),
                    url: String(row.url ?? PLACEHOLDER_IMAGE),
                    filename: row.filename ?? null,
                    position: Number(row.position),
                }))
            );
        } catch (error) {
            console.error(error);
            message.error(
                error instanceof Error ? error.message : 'Failed to save gallery images'
            );
            throw error;
        } finally {
            setGallerySaving(false);
        }
    };

    const openMediaPicker = (config: {
        title?: string;
        onSelect: (mediaId: number) => Promise<void> | void;
    }) => {
        setMediaPickerConfig(config);
    };

    const handleMediaPickerSelect = async (mediaId: number) => {
        if (mediaPickerConfig?.onSelect) {
            await mediaPickerConfig.onSelect(mediaId);
        }
        setMediaPickerConfig(null);
    };

    const handleMediaPickerCancel = () => {
        setMediaPickerConfig(null);
    };

    const rebuildGalleryPositions = (items: GalleryRow[]) =>
        items.map((item, index) => ({
            ...item,
            position: index + 1,
        }));

    const parseJsonResponse = async (response: Response) => {
        const contentType = response.headers.get("content-type") ?? "";
        const text = await response.text();
        if (!response.ok) {
            throw new Error(
                text ||
                `Server error (${response.status}: ${response.statusText}) while accessing gallery`
            );
        }
        if (!contentType.includes("application/json")) {
            throw new Error(text || "Received unexpected response while loading gallery images.");
        }
        try {
            return JSON.parse(text);
        } catch {
            throw new Error(text || "Received invalid JSON from gallery service.");
        }
    };

    const loadGalleryImages = async (blockId: number) => {
        setGalleryLoading(true);
        try {
            const response = await fetch(`/api/pages-new/blocks/${blockId}/gallery`);
            const result = await parseJsonResponse(response);
            if (!result.ok) {
                throw new Error(result.error || 'Failed to load gallery images');
            }
            const rows = Array.isArray(result.data) ? result.data : [];
            setGalleryImages(
                rows.map((row: any) => ({
                    galleryRowId: Number(row.galleryRowId),
                    mediaId: Number(row.media_id),
                    url: String(row.url ?? PLACEHOLDER_IMAGE),
                    filename: row.filename ?? null,
                    position: Number(row.position),
                }))
            );
        } catch (error) {
            console.error(error);
            setGalleryImages([]);
            message.error(
                error instanceof Error ? error.message : 'Failed to load gallery images'
            );
        } finally {
            setGalleryLoading(false);
        }
    };

    const appendGalleryImages = (items: GalleryMediaSelection[]) => {
        if (!items.length) {
            return;
        }
        setGalleryImages((prev) => {
            const next = [...prev];
            items.forEach((item) => {
                if (next.some((image) => image.mediaId === item.mediaId)) {
                    return;
                }
                next.push({
                    galleryRowId: null,
                    mediaId: item.mediaId,
                    url: item.url,
                    filename: null,
                    position: next.length + 1,
                });
            });
            return rebuildGalleryPositions(next);
        });
    };

    const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
        const next = [...galleryImages];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= next.length) {
            return;
        }
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
        setGalleryImages(rebuildGalleryPositions(next));
    };

    const removeGalleryImage = async (index: number) => {
        const image = galleryImages[index];
        const next = rebuildGalleryPositions(
            galleryImages.filter((_, idx) => idx !== index)
        );
        setGalleryImages(next);

        if (image.galleryRowId && editingBlock) {
            try {
                const response = await fetch(
                    `/api/pages-new/blocks/${editingBlock.id}/gallery?galleryRowId=${image.galleryRowId}`,
                    { method: 'DELETE' }
                );
                const result = await parseJsonResponse(response);
                if (!result.ok) {
                    throw new Error(result.error || 'Failed to delete gallery image');
                }
                message.success('Image removed');
            } catch (error) {
                console.error(error);
                message.error(
                    error instanceof Error ? error.message : 'Failed to delete gallery image'
                );
                if (editingBlock) {
                    loadGalleryImages(editingBlock.id);
                }
            }
        }
    };

    const setHeroBackgroundImage = (mediaId: number, url: string, crop: CropMetadata | null) => {
        blockForm.setFieldsValue({
            background_image: {
                media_id: mediaId,
                crop,
            },
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

        if (!ctx) {
            throw new Error('No 2d context');
        }

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
            const response = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (result.data && result.data.id) {
                setHeroBackgroundImage(result.data.id, result.data.url, null);
                message.success({ content: 'Image uploaded successfully', key: 'upload' });
            } else {
                message.error({ content: result.error || 'Failed to upload image', key: 'upload' });
            }
        } catch (error) {
            message.error({ content: 'Failed to upload image', key: 'upload' });
            console.error('Upload error:', error);
        }
    };

    const handleHeroUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                return;
            }
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
                try {
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
                } catch (error) {
                    console.error('Error preparing image for crop:', error);
                    setHeroBackgroundImage(mediaId, url, null);
                    message.success('Image selected');
                }
            } else {
                setHeroBackgroundImage(mediaId, url, null);
                message.success('Image selected');
            }
        } catch (error) {
            console.error('Error fetching media for hero crop:', error);
            message.error('Failed to load media file');
        }
    };

    const handleHeroCropAndUpload = async () => {
        if (!heroImageToCrop || !heroCroppedAreaPixels || !heroOriginalFile) {
            message.error('Missing crop data');
            return;
        }

        setHeroUploadingImage(true);
        try {
            message.loading({ content: 'Uploading cropped image...', key: 'upload' });
            const croppedBlob = await getCroppedImg(heroImageToCrop, heroCroppedAreaPixels);
            const croppedFile = new File([croppedBlob], heroOriginalFile.name, {
                type: heroOriginalFile.type,
            });

            const formData = new FormData();
            formData.append('file', croppedFile);
            formData.append('derived', 'true');
            const response = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.data && result.data.id) {
                const ratioValue = heroAspectRatio;
                const cropMeta: CropMetadata = {
                    x: heroCroppedAreaPixels.x,
                    y: heroCroppedAreaPixels.y,
                    width: heroCroppedAreaPixels.width,
                    height: heroCroppedAreaPixels.height,
                    ratio: ratioValue,
                };
                setHeroBackgroundImage(result.data.id, result.data.url, cropMeta);
                message.success({ content: 'Image uploaded successfully', key: 'upload' });
                resetHeroCropState();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error: any) {
            message.error({ content: error.message || 'Failed to upload image', key: 'upload' });
            console.error('Hero crop upload error:', error);
        } finally {
            setHeroUploadingImage(false);
        }
    };

    const handleTextImageSelect = async (mediaId: number) => {
        blockForm.setFieldValue('image_id', mediaId);
        const url = await ensureMediaUrl(mediaId);
        setTextImageUrl(url);
    };

    const handleSeoSave = async (values: SeoFormValues) => {
        if (!hasValidPageId) {
            return;
        }

        setSeoSaving(true);

        try {
            const payload = {
                ...values,
                og_image_id: heroOgId ?? null,
            };

            const response = await fetch(`/api/pages-new/${pageId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.error || 'Failed to update SEO data');
            }

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
            console.error('Failed to save SEO data', error);
            message.error(error instanceof Error ? error.message : 'Failed to save SEO data');
        } finally {
            setSeoSaving(false);
        }
    };

    const handleSeoGenerate = async () => {
        if (!hasValidPageId) {
            return;
        }

        setSeoGenerating(true);

        try {
            const response = await fetch(`/api/pages-new/${pageId}/seo/auto-generate`, {
                method: 'POST',
            });

            const result = await response.json();

            if (!result.ok) {
                message.error({ content: result.error || 'Failed to generate SEO data', key: 'seo-generate' });
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
            message.success({ content: 'SEO data generated successfully!', key: 'seo-generate' });
        } catch (error) {
            console.error('Error generating SEO data', error);
            message.error({
                content: `Failed to generate SEO data: ${error instanceof Error ? error.message : String(error)}`,
                key: 'seo-generate',
                duration: 5,
            });
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

            if (!payload.ok) {
                throw new Error(payload.error || 'Unable to load page');
            }

            setPage(payload.data);
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to load page');
            setPage(null);
        } finally {
            setLoading(false);
        }
    };

    const loadBlocks = async () => {
        if (!hasValidPageId) {
            return;
        }

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
        if (!hasValidPageId) {
            return;
        }

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
                ensureMediaUrl(imageId).then((url) => {
                    setTextImageUrl(url);
                });
            } else {
                setTextImageUrl(null);
            }
        } else {
            setTextImageUrl(null);
        }
    }, [editingBlock]);

    useEffect(() => {
        if (editingBlock?.type === 'GALLERY' && editingBlock.id) {
            loadGalleryImages(editingBlock.id);
        } else {
            setGalleryImages([]);
        }
    }, [editingBlock]);

    useEffect(() => {
        const heroBlock = blocks.find((block) => block.type === 'HERO');
        const heroImage = heroBlock?.data?.background_image as { media_id?: number; crop?: CropMetadata | null } | null;
        const heroId = heroImage?.media_id ? Number(heroImage.media_id) : null;
        const heroCropRatio = heroImage?.crop?.ratio ?? null;

        if (heroId && Number.isFinite(heroId)) {
            ensureMediaUrl(heroId).then((url) => {
                setHeroOgId(heroId);
                setHeroOgUrl(url);
            });
        } else {
            setHeroOgId(null);
            setHeroOgUrl(null);
        }

        setHeroAspectRatio(heroCropRatio);
    }, [blocks]);

    useEffect(() => {
        if (editingBlock?.type === 'FEATURED_PRODUCTS') {
            const ids =
                Array.isArray(editingBlock.data?.product_ids)
                    ? (editingBlock.data?.product_ids as number[])
                    : [];
            setSelectedProductIds(ids);
            blockForm.setFieldValue('product_ids', ids);
        } else {
            setSelectedProductIds([]);
        }
    }, [editingBlock, blockForm]);

    useEffect(() => {
        let cancelled = false;
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                const response = await fetch('/api/products?page=1&pageSize=100');
                const result = await response.json();
                if (!cancelled) {
                    const payload = Array.isArray(result.data) ? result.data : [];
                    setProducts(
                        payload.map((product: any) => ({
                            id: Number(product.id),
                            name: String(product.name),
                            price: Number(product.price) || 0,
                            currency: String(product.currency || 'EUR'),
                            active: Boolean(product.active),
                            image:
                                Array.isArray(product.images) && product.images.length
                                    ? String(product.images[0])
                                    : null,
                        }))
                    );
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) {
                    setLoadingProducts(false);
                }
            }
        };

        fetchProducts();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleAddBlock = async (values: { type: BlockType }) => {
        if (!hasValidPageId) {
            return;
        }

        try {
            const response = await fetch(`/api/pages-new/${pageId}/blocks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type: values.type, data: {} }),
            });

            const payload = await response.json();

            if (!payload.ok) {
                throw new Error(payload.error || 'Failed to create block');
            }

            setAddBlockModalOpen(false);
            addBlockForm.resetFields();
            loadBlocks();
            message.success('Block added');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to add block');
        }
    };

    const openAddBlockModal = () => {
        setAddBlockModalOpen(true);
        addBlockForm.setFieldsValue({
            type: heroExists ? 'TEXT' : 'HERO',
        });
    };

    const openBlockEditModal = (block: PageBlock) => {
        setEditingBlock(block);
        const values: Record<string, unknown> = {
            enabled: Boolean(block.enabled),
        };

        if (block.data) {
            Object.assign(values, block.data);
        }

        blockForm.setFieldsValue(values);
        setBlockModalOpen(true);
    };

    const handleBlockSave = async (values: Record<string, unknown>) => {
        if (!editingBlock) {
            return;
        }

        const payload: Record<string, unknown> = {
            enabled: editingBlock.enabled,
            data: buildBlockData(editingBlock.type, values),
        };

        try {
            if (editingBlock.type === 'GALLERY') {
                await saveGalleryImages();
            }
            const response = await fetch(`/api/pages-new/blocks/${editingBlock.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.error || 'Failed to update block');
            }

            setBlockModalOpen(false);
            setEditingBlock(null);
            blockForm.resetFields();
            loadBlocks();
            message.success('Block updated');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to update block');
        }
    };

    const renderBlockFields = (type?: BlockType) => {
        switch (type) {
            case 'HERO':
                return (
                    <>
                        <Form.Item
                            label="Title"
                            name="title"
                            rules={[{ required: true, message: 'Title is required' }]}
                        >
                            <Input placeholder="Hero title" />
                        </Form.Item>
                        <Form.Item label="Subtitle" name="subtitle">
                            <Input placeholder="Subtitle (optional)" />
                        </Form.Item>
                        <Form.Item label="Description" name="description">
                            <TextArea rows={3} placeholder="Optional description" />
                        </Form.Item>
                        <Form.Item label="Background Image">
                            <Form.Item name={['background_image', 'media_id']} noStyle>
                                <Input type="hidden" />
                            </Form.Item>
                            <Form.Item name={['background_image', 'crop']} noStyle>
                                <Input type="hidden" />
                            </Form.Item>
                            <Space style={{ marginBottom: 12 }}>
                                <Switch
                                    checked={heroEnableCrop}
                                    onChange={setHeroEnableCrop}
                                    checkedChildren="Crop"
                                    unCheckedChildren="No Crop"
                                />
                                {heroEnableCrop && (
                                    <Select<number | null>
                                        style={{ width: 190 }}
                                        value={heroAspectRatio}
                                        onChange={(value) => setHeroAspectRatio(value)}
                                        placeholder="Aspect Ratio (Auto)"
                                        allowClear
                                    >
                                        <Select.Option value={null}>Auto (Free)</Select.Option>
                                        <Select.Option value={1}>1:1 (Square)</Select.Option>
                                        <Select.Option value={4 / 3}>4:3</Select.Option>
                                        <Select.Option value={16 / 9}>16:9</Select.Option>
                                        <Select.Option value={21 / 9}>21:9</Select.Option>
                                        <Select.Option value={3 / 4}>3:4 (Portrait)</Select.Option>
                                        <Select.Option value={9 / 16}>9:16 (Vertical)</Select.Option>
                                    </Select>
                                )}
                            </Space>
                            <Space>
                                <Button type="primary" icon={<UploadOutlined />} onClick={handleHeroUploadClick}>
                                    Upload
                                </Button>
                                <Button
                                    icon={<FolderOutlined />}
                                    onClick={() =>
                                        openMediaPicker({
                                            title: 'Select Hero Background',
                                            onSelect: handleHeroMediaSelect,
                                        })
                                    }
                                >
                                    Select Media
                                </Button>
                            </Space>
                            <Form.Item
                                noStyle
                                style={{ marginTop: 16 }}
                                shouldUpdate={(prev, current) => prev.background_image?.media_id !== current.background_image?.media_id}
                            >
                                {() => (
                                    <div
                                        style={{
                                            width: 320,
                                            height: 180,
                                            borderRadius: 6,
                                            border: '1px solid #d9d9d9',
                                            overflow: 'hidden',
                                            backgroundColor: '#f5f5f5',
                                            marginTop: 8,
                                        }}
                                    >
                                        <img
                                            src={heroOgUrl || PLACEHOLDER_IMAGE}
                                            alt="Hero background preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                            </Form.Item>
                            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                                The hero block image is used for OG previews automatically.
                            </div>
                        </Form.Item>
                        <Form.Item label="CTA Text" name="cta_text">
                            <Input placeholder="Optional CTA text" />
                        </Form.Item>
                        <Form.Item label="CTA Link" name="cta_link">
                            <Input placeholder="Optional CTA link" />
                        </Form.Item>
                    </>
                );
            case 'TEXT':
                return (
                    <Space orientation="vertical" style={{ width: '100%' }}>
                        <Form.Item
                            label="Title"
                            name="title"
                            rules={[{ required: true, message: 'Title is required' }]}
                        >
                            <Input placeholder="Heading (H1/H2 etc.)" />
                        </Form.Item>
                        <Form.Item
                            label="Content"
                            name="content"
                            rules={[{ required: true, message: 'Text content is required' }]}
                        >
                            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.content !== currentValues.content}>
                                {({ getFieldValue, setFieldValue }) => (
                                    <SimpleEditor
                                        value={getFieldValue('content') ?? ''}
                                        onChange={(value) => setFieldValue('content', value)}
                                        rows={6}
                                        placeholder="Write the text block content"
                                    />
                                )}
                            </Form.Item>
                        </Form.Item>
                    </Space>
                );
            case 'TEXT_IMAGE':
                return (
                    <>
                        <Form.Item
                            label="Title"
                            name="title"
                            rules={[{ required: true, message: 'Title is required' }]}
                        >
                            <Input placeholder="Heading (H1/H2 etc.)" />
                        </Form.Item>
                        <Form.Item label="Content" name="content">
                            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.content !== currentValues.content}>
                                {({ getFieldValue, setFieldValue }) => (
                                    <SimpleEditor
                                        value={getFieldValue('content') ?? ''}
                                        onChange={(value) => setFieldValue('content', value)}
                                        rows={5}
                                        placeholder="Write text and align an image"
                                    />
                                )}
                            </Form.Item>
                        </Form.Item>
                        <Form.Item label="Image">
                            <Space orientation="vertical">
                                <div
                                    style={{
                                        width: 220,
                                        height: 120,
                                        borderRadius: 6,
                                        border: '1px solid #d9d9d9',
                                        overflow: 'hidden',
                                        backgroundColor: '#f5f5f5',
                                    }}
                                >
                                    <img
                                        src={textImageUrl || PLACEHOLDER_IMAGE}
                                        alt="Text block visual"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <Space>
                                    <Button
                                        type="default"
                                        onClick={() =>
                                            openMediaPicker({
                                                title: 'Select block image',
                                                onSelect: handleTextImageSelect,
                                            })
                                        }
                                    >
                                        Pick image
                                    </Button>
                                    {blockForm.getFieldValue('image_id') && (
                                        <Button
                                            type="link"
                                            onClick={() => {
                                                blockForm.setFieldValue('image_id', undefined);
                                                setTextImageUrl(null);
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </Space>
                            </Space>
                        </Form.Item>
                        <Form.Item label="Layout" name="layout">
                            <Select
                                options={[
                                    { label: 'Image left / text right', value: 'image_left' },
                                    { label: 'Text left / image right', value: 'image_right' },
                                ]}
                            />
                        </Form.Item>
                    </>
                );
            case 'GALLERY':
                return (
                    <Form.Item label="Gallery images">
                        <Space orientation="vertical" style={{ width: '100%' }}>
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={() => setGalleryPickerOpen(true)}
                            >
                                Add images
                            </Button>
                            {galleryLoading ? (
                                <div style={{ textAlign: 'center', padding: 40 }}>
                                    <Spin />
                                </div>
                            ) : galleryImages.length === 0 ? (
                                <Empty description="No images yet" />
                            ) : (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: 12,
                                    }}
                                >
                                    {galleryImages.map((image, index) => (
                                        <div
                                            key={`${image.galleryRowId ?? 'new'}-${image.mediaId}-${index}`}
                                            style={{
                                                border: '1px solid #d9d9d9',
                                                borderRadius: 6,
                                                padding: 8,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: 110,
                                                    borderRadius: 4,
                                                    overflow: 'hidden',
                                                    backgroundColor: '#f5f5f5',
                                                }}
                                            >
                                                <img
                                                    src={image.url || PLACEHOLDER_IMAGE}
                                                    alt={`Gallery ${index + 1}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <Space size="small">
                                                <Button
                                                    size="small"
                                                    onClick={() => moveGalleryImage(index, 'up')}
                                                    disabled={index === 0 || gallerySaving}
                                                >
                                                    ↑
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() => moveGalleryImage(index, 'down')}
                                                    disabled={index === galleryImages.length - 1 || gallerySaving}
                                                >
                                                    ↓
                                                </Button>
                                                <Button
                                                    size="small"
                                                    danger
                                                    onClick={() => removeGalleryImage(index)}
                                                    disabled={gallerySaving}
                                                >
                                                    Remove
                                                </Button>
                                            </Space>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Space>
                    </Form.Item>
                );
            case 'YOUTUBE':
                return (
                    <>
                        <Form.Item label="Title" name="title">
                            <Input placeholder="Optional title" />
                        </Form.Item>
                        <Form.Item label="YouTube URL" name="youtube_url">
                            <Input placeholder="https://www.youtube.com/watch?v=..." />
                        </Form.Item>
                        <Form.Item shouldUpdate={(prev, curr) => prev.youtube_url !== curr.youtube_url} noStyle>
                            {({ getFieldValue }) => {
                                const url = getFieldValue('youtube_url');
                                const embedId = extractYouTubeId(url);
                                if (!embedId) {
                                    return null;
                                }
                                return (
                                    <div style={{ width: '100%', marginTop: 12 }}>
                                        <div
                                            style={{
                                                position: 'relative',
                                                paddingBottom: '56.25%',
                                                height: 0,
                                                overflow: 'hidden',
                                                borderRadius: 8,
                                                border: '1px solid #d9d9d9',
                                            }}
                                        >
                                            <iframe
                                                src={`https://www.youtube.com/embed/${embedId}`}
                                                title="YouTube preview"
                                                allowFullScreen
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none',
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            }}
                        </Form.Item>
                    </>
                );
            case 'FEATURED_PRODUCTS':
                return (
                    <>
                        <Form.Item label="Products" name="product_ids">
                            <Select
                                mode="multiple"
                                placeholder="Select featured products"
                                loading={loadingProducts}
                                options={products.map((product) => ({
                                    label: `${product.name} ${product.active ? '' : '(inactive)'}`,
                                    value: product.id,
                                }))}
                                optionFilterProp="label"
                                onChange={(values) => setSelectedProductIds(values)}
                                value={selectedProductIds}
                            />
                        </Form.Item>
                        {selectedProductIds.length > 0 && (
                            <Space wrap>
                                {selectedProductIds.map((productId) => {
                                    const product = products.find((item) => item.id === productId);
                                    if (!product) {
                                        return null;
                                    }
                                    return (
                                        <div
                                            key={product.id}
                                            style={{
                                                border: '1px solid #f0f0f0',
                                                borderRadius: 8,
                                                padding: 12,
                                                minWidth: 180,
                                                display: 'flex',
                                                gap: 12,
                                                alignItems: 'center',
                                            }}
                                        >
                                            {product.image ? (
                                                <div
                                                    style={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: 4,
                                                        overflow: 'hidden',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: 4,
                                                        border: '1px dashed #d9d9d9',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            )}
                                            <div>
                                                <strong>{product.name}</strong>
                                                <div style={{ fontSize: 12, color: '#555' }}>
                                                    {product.currency} {product.price.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </Space>
                        )}
                    </>
                );
            default:
                return null;
        }
    };

    const reorderBlocks = async (orderedIds: number[]) => {
        if (!hasValidPageId) {
            return;
        }

        try {
            const response = await fetch(`/api/pages-new/${pageId}/blocks/reorder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderedBlockIds: orderedIds }),
            });

            const payload = await response.json();

            if (!payload.ok) {
                throw new Error(payload.error || 'Failed to reorder blocks');
            }

            loadBlocks();
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to reorder blocks');
        }
    };

    const handleMoveBlock = (block: PageBlock, direction: 'up' | 'down') => {
        const orderedIds = blocks.map((item) => item.id);
        const index = orderedIds.indexOf(block.id);
        if (index === -1) {
            return;
        }

        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= orderedIds.length) {
            return;
        }

        if (block.type === 'HERO' && direction === 'down') {
            return;
        }

        const reordered = [...orderedIds];
        [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
        reorderBlocks(reordered);
    };

    const handleToggleBlockEnabled = async (block: PageBlock, value: boolean) => {
        try {
            const response = await fetch(`/api/pages-new/blocks/${block.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled: value }),
            });

            const payload = await response.json();

            if (!payload.ok) {
                throw new Error(payload.error || 'Failed to update block');
            }

            loadBlocks();
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to update block');
        }
    };

    const handleDeleteBlock = (block: PageBlock) => {
        Modal.confirm({
            title: 'Delete block',
            content: `Remove the ${block.type} block?`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pages-new/blocks/${block.id}`, {
                        method: 'DELETE',
                    });

                    const payload = await response.json();

                    if (!payload.ok) {
                        throw new Error(payload.error || 'Failed to delete block');
                    }

                    loadBlocks();
                    message.success('Block deleted');
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'Failed to delete block');
                }
            },
        });
    };

    const renderBlockList = () => {
        if (blocksLoading) {
            return <Spin />;
        }

        if (!blocks.length) {
            return <Empty description="No blocks yet" />;
        }

        return (
            <Space orientation="vertical" style={{ width: '100%' }}>
                {blocks.map((block) => (
                    <div
                        key={block.id}
                        style={{
                            padding: 12,
                            border: '1px solid #f0f0f0',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                        }}
                    >
                        <Space align="center">
                            <strong>{block.position}.</strong>
                            <Tag color={block.type === 'HERO' ? 'blue' : 'default'}>{block.type}</Tag>
                            <Switch
                                checked={Boolean(block.enabled)}
                                onChange={(value) => handleToggleBlockEnabled(block, value)}
                                checkedChildren="Visible"
                                unCheckedChildren="Hidden"
                            />
                        </Space>
                        <Space>
                            <Button
                                icon={<ArrowUpOutlined />}
                                onClick={() => handleMoveBlock(block, 'up')}
                                disabled={block.position === 1 || (heroExists && block.position === 2)}
                                type="text"
                            />
                            <Button
                                icon={<ArrowDownOutlined />}
                                onClick={() => handleMoveBlock(block, 'down')}
                                disabled={block.type === 'HERO'}
                                type="text"
                            />
                            <Button type="link" onClick={() => openBlockEditModal(block)}>
                                Edit
                            </Button>
                            <Button danger type="link" onClick={() => handleDeleteBlock(block)}>
                                Delete
                            </Button>
                        </Space>
                    </div>
                ))}
            </Space>
        );
    };

    const breadcrumbItems = [
        { title: <Link href="/admin">Admin</Link> },
        { title: <Link href="/admin/pages-new">Pages New</Link> },
        { title: <span>{page?.title || 'Loading...'}</span> },
    ];

    if (!hasValidPageId) {
        return (
            <div style={{ padding: 24 }}>
                <Breadcrumb items={breadcrumbItems} />
                <div style={{ marginTop: 24 }}>
                    <p>Invalid page ID.</p>
                    <Link href="/admin/pages-new">Back to list</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <Breadcrumb items={breadcrumbItems} />

            {loading && !page ? (
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <Spin />
                </div>
            ) : !page ? (
                <div style={{ marginTop: 24 }}>
                    <p>Page not found.</p>
                    <Link href="/admin/pages-new">Back to list</Link>
                </div>
            ) : (
                <>
                    <div style={{ marginTop: 24, marginBottom: 24 }}>
                        <h1 style={{ margin: 0 }}>{page.title}</h1>
                        <p style={{ margin: '4px 0 0', color: '#666' }}>Slug: {page.slug}</p>
                    </div>

                    <Tabs
                        items={[
                            {
                                key: 'blocks',
                                label: 'Blocks',
                                children: (
                                    <Space orientation="vertical" style={{ width: '100%' }}>
                                        <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={openAddBlockModal}
                                        >
                                            Add Block
                                        </Button>
                                        {renderBlockList()}
                                    </Space>
                                ),
                            },
                            {
                                key: 'seo',
                                label: 'SEO',
                                forceRender: true,
                                children: (
                                    <Form
                                        form={seoForm}
                                        layout="vertical"
                                        onFinish={handleSeoSave}
                                    >
                                        <Space orientation="vertical" size="small" style={{ marginBottom: 16 }}>
                                            <Button
                                                type="primary"
                                                loading={seoGenerating}
                                                onClick={handleSeoGenerate}
                                            >
                                                Generate SEO Data
                                            </Button>
                                            <span style={{ color: '#999', fontSize: 12 }}>
                                                Auto-fill SEO fields based on page information
                                            </span>
                                        </Space>
                                        <Form.Item label="Meta Title" name="seo_title">
                                            <Input placeholder="Meta title for SEO" />
                                        </Form.Item>
                                        <Form.Item label="Meta Description" name="seo_description">
                                            <TextArea rows={3} placeholder="Meta description for SEO" />
                                        </Form.Item>
                                        <Form.Item label="Meta Keywords" name="seo_keywords">
                                            <Input placeholder="keyword1, keyword2, keyword3" />
                                        </Form.Item>
                                        <Form.Item label="OG Title" name="og_title">
                                            <Input placeholder="Open Graph title" />
                                        </Form.Item>
                                        <Form.Item label="OG Description" name="og_description">
                                            <TextArea rows={3} placeholder="Open Graph description" />
                                        </Form.Item>
                                        <Form.Item label="Canonical URL" name="canonical_url">
                                            <Input placeholder="https://example.com/page" />
                                        </Form.Item>
                                        <Form.Item
                                            label="SEO Score"
                                            shouldUpdate={(prevValues, currentValues) => {
                                                const fields = [
                                                    'seo_title',
                                                    'seo_description',
                                                    'seo_keywords',
                                                    'og_title',
                                                    'og_description',
                                                    'canonical_url',
                                                ];
                                                return fields.some((field) => {
                                                    const prev = prevValues?.[field] ?? '';
                                                    const curr = currentValues?.[field] ?? '';
                                                    return prev !== curr;
                                                });
                                            }}
                                        >
                                            {() => {
                                                const values = seoForm.getFieldsValue();
                                                const scoreResult = calculateSEOScore({
                                                    metaTitle: values.seo_title,
                                                    metaDescription: values.seo_description,
                                                    seoKeywords: values.seo_keywords,
                                                    ogTitle: values.og_title,
                                                    ogDescription: values.og_description,
                                                    canonicalUrl: values.canonical_url,
                                                });

                                                const getScoreColor = (score: number) => {
                                                    if (score >= 80) return '#52c41a';
                                                    if (score >= 60) return '#faad14';
                                                    return '#ff4d4f';
                                                };

                                                return (
                                                    <Card size="small" style={{ background: '#fafafa' }}>
                                                        <div style={{ marginBottom: 16 }}>
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    marginBottom: 8,
                                                                }}
                                                            >
                                                                <span style={{ fontSize: 14, fontWeight: 500 }}>Overall SEO Score</span>
                                                                <span
                                                                    style={{
                                                                        fontSize: 20,
                                                                        fontWeight: 'bold',
                                                                        color: getScoreColor(scoreResult.score),
                                                                    }}
                                                                >
                                                                    {scoreResult.score}%
                                                                </span>
                                                            </div>
                                                            <Progress
                                                                percent={scoreResult.score}
                                                                strokeColor={getScoreColor(scoreResult.score)}
                                                                showInfo={false}
                                                            />
                                                        </div>
                                                        <div style={{ fontSize: 12 }}>
                                                            {Object.entries(scoreResult.checks).map(([key, check]) => (
                                                                <div key={key} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <Tooltip title={check.message}>
                                                                        <span
                                                                            style={{
                                                                                display: 'inline-block',
                                                                                width: 8,
                                                                                height: 8,
                                                                                borderRadius: '50%',
                                                                                backgroundColor: check.passed ? '#52c41a' : '#ff4d4f',
                                                                            }}
                                                                        />
                                                                    </Tooltip>
                                                                    <span style={{ color: check.passed ? '#52c41a' : '#999' }}>
                                                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Card>
                                                );
                                            }}
                                        </Form.Item>
                                        <Form.Item>
                                            <Button type="primary" htmlType="submit" loading={seoSaving}>
                                                Save SEO Data
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                ),
                            },
                            {
                                key: 'preview',
                                label: 'Preview',
                                children: <p>Coming soon.</p>,
                            },
                        ]}
                    />
                </>
            )}

            <Modal
                title="Add Block"
                open={addBlockModalOpen}
                onCancel={() => {
                    setAddBlockModalOpen(false);
                    addBlockForm.resetFields();
                }}
                onOk={() => addBlockForm.submit()}
                destroyOnHidden
                forceRender
            >
                <Form layout="vertical" form={addBlockForm} onFinish={handleAddBlock}>
                    <Form.Item
                        label="Block Type"
                        name="type"
                        rules={[{ required: true, message: 'Select a block type' }]}
                    >
                        <Select
                            options={blockTypeOptions.map((option) => ({
                                ...option,
                                disabled: option.value === 'HERO' && heroExists,
                            }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={editingBlock ? `Edit ${editingBlock.type} Block` : 'Edit Block'}
                open={blockModalOpen}
                onCancel={() => {
                    setBlockModalOpen(false);
                    setEditingBlock(null);
                    blockForm.resetFields();
                }}
                onOk={() => blockForm.submit()}
                destroyOnHidden
                forceRender
            >
                <Form layout="vertical" form={blockForm} onFinish={handleBlockSave}>
                    {renderBlockFields(editingBlock?.type)}
                </Form>
            </Modal>
            <GalleryMediaPicker
                open={galleryPickerOpen}
                existingMediaIds={galleryImages.map((image) => image.mediaId)}
                onClose={() => setGalleryPickerOpen(false)}
                onConfirmSelection={appendGalleryImages}
            />
            <MediaPicker
                open={Boolean(mediaPickerConfig)}
                title={mediaPickerConfig?.title}
                onCancel={handleMediaPickerCancel}
                onSelect={handleMediaPickerSelect}
            />
            <Modal
                title="Crop Hero Background"
                open={heroCropVisible}
                onCancel={resetHeroCropState}
                footer={[
                    <Button key="cancel" onClick={resetHeroCropState}>
                        Cancel
                    </Button>,
                    <Button
                        key="crop"
                        type="primary"
                        loading={heroUploadingImage}
                        onClick={handleHeroCropAndUpload}
                    >
                        Crop & Upload
                    </Button>,
                ]}
                width="90%"
                centered
            >
                {heroImageToCrop && (
                    <div style={{ position: 'relative', width: '100%', height: 400, background: '#000' }}>
                        <Cropper
                            image={heroImageToCrop}
                            crop={heroCrop}
                            zoom={heroZoom}
                            aspect={heroEnableCrop ? heroAspectRatio ?? undefined : undefined}
                            onCropChange={setHeroCrop}
                            onZoomChange={setHeroZoom}
                            onCropComplete={handleHeroCropComplete}
                            style={{
                                containerStyle: {
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                },
                            }}
                        />
                    </div>
                )}
                <div style={{ marginTop: 16 }}>
                    <label>Zoom: </label>
                    <Slider
                        min={1}
                        max={3}
                        step={0.1}
                        value={heroZoom}
                        onChange={(value) => setHeroZoom(value as number)}
                        style={{ width: '100%', marginTop: 8 }}
                    />
                </div>
            </Modal>
        </div>
    );
}
