"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Table,
    Button,
    Space,
    Image as AntImage,
    Tag,
    Modal,
    Popconfirm,
    message,
    Input,
    Card,
    Row,
    Col,
    Form,
    Switch,
    Select,
    Slider,
    Tooltip,
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    UploadOutlined,
    FolderOutlined,
    DragOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import MediaPicker from '@/components/admin/MediaPicker';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import SimpleEditor from '@/components/SimpleEditor';
import { PLACEHOLDER_IMAGE } from '@/lib/utils/placeholder-image';

const { TextArea } = Input;

interface NewsArticle {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    featuredImage: string;
    excerpt: string | null;
    content: string | null;
    ctaText: string | null;
    ctaLink: string | null;
    order: number;
    active: boolean;
    publishStatus: string;
    publishDate: string | null;
    author: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function NewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
    const [screenWidth, setScreenWidth] = useState(0);
    const [draggedArticleIndex, setDraggedArticleIndex] = useState<number | null>(null);

    // Crop state
    const [cropVisible, setCropVisible] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
    const [enableCrop, setEnableCrop] = useState(true);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        const updateScreenWidth = () => {
            setScreenWidth(window.innerWidth);
        };

        updateScreenWidth();
        window.addEventListener('resize', updateScreenWidth);
        return () => window.removeEventListener('resize', updateScreenWidth);
    }, []);

    const isMobile = screenWidth > 0 && screenWidth < 768;
    const isTablet = screenWidth > 0 && screenWidth < 1024;

    useEffect(() => {
        fetchArticles();
    }, []);

    // Set form values when modal opens (add mode only)
    useEffect(() => {
        if (editVisible && !editingArticle) {
            // Add mode - set default values after Form is mounted
            // Order will be auto-assigned as articles.length (next sequential number)
            // Use a longer timeout to ensure Form component is fully mounted
            const timer = setTimeout(() => {
                if (editVisible) {
                    try {
                        form.resetFields();
                        form.setFieldsValue({
                            active: true,
                            publishStatus: 'draft',
                        });
                    } catch (error) {
                        // Form might not be mounted yet, ignore
                        console.debug('Form not ready yet:', error);
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [editVisible, editingArticle]);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/news?pageSize=100');
            const result = await response.json();
            console.log('📰 News API response:', result);
            if (result.data && Array.isArray(result.data)) {
                console.log('📰 Setting articles:', result.data.length);
                setArticles(result.data);
            } else {
                console.warn('📰 No data or invalid format:', result);
                setArticles([]);
            }
        } catch (error) {
            message.error('Failed to fetch news articles');
            console.error('Error fetching news articles:', error);
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle media selection from MediaPicker
    const handleMediaSelect = async (mediaId: number) => {
        try {
            const response = await fetch(`/api/media/${mediaId}`);
            const result = await response.json();
            if (result.data && result.data.url) {
                if (enableCrop && editVisible) {
                    const imageResponse = await fetch(result.data.url);
                    const imageBlob = await imageResponse.blob();
                    const imageFile = new File([imageBlob], result.data.filename || 'image.jpg', {
                        type: imageBlob.type,
                    });

                    const reader = new FileReader();
                    reader.onload = () => {
                        setImageToCrop(reader.result as string);
                        setOriginalFile(imageFile);
                        setCropVisible(true);
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                        setMediaPickerVisible(false);
                    };
                    reader.readAsDataURL(imageFile);
                } else {
                    if (editVisible) {
                        form.setFieldsValue({ featuredImage: result.data.url });
                    }
                    message.success('Image selected');
                }
            } else {
                message.error('Failed to load media file');
            }
        } catch (error) {
            message.error('Failed to load media file');
            console.error('Error fetching media:', error);
        }
    };

    // Crop helper functions
    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
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

    const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropAndUpload = async () => {
        if (!imageToCrop || !croppedAreaPixels || !originalFile) {
            message.error('Missing crop data');
            return;
        }

        setUploadingImage(true);
        try {
            message.loading({ content: 'Uploading cropped image...', key: 'upload' });
            const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], originalFile.name, {
                type: originalFile.type,
            });

            const formData = new FormData();
            formData.append('file', croppedFile);
            formData.append('derived', 'true');

            const response = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.data && result.data.url) {
                if (editVisible) {
                    form.setFieldsValue({ featuredImage: result.data.url });
                }
                message.success({ content: 'Image cropped and uploaded successfully', key: 'upload' });
                setCropVisible(false);
                setImageToCrop(null);
                setOriginalFile(null);
                setCroppedAreaPixels(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error: any) {
            message.error({ content: error.message || 'Failed to upload cropped image', key: 'upload' });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAdd = () => {
        setEditingArticle(null);
        setEditVisible(true);
    };

    const handleEdit = async (id: string) => {
        try {
            const response = await fetch(`/api/news/${id}`);
            const result = await response.json();

            if (result.data) {
                const article = result.data;
                setEditingArticle(article);
                setEditVisible(true);
                // Set form values after Form is mounted
                setTimeout(() => {
                    form.setFieldsValue({
                        title: article.title || '',
                        slug: article.slug || '',
                        subtitle: article.subtitle || '',
                        featuredImage: article.featuredImage || '',
                        excerpt: article.excerpt || '',
                        content: article.content || '',
                        ctaText: article.ctaText || '',
                        ctaLink: article.ctaLink || '',
                        active: article.active !== undefined ? article.active : true,
                        publishStatus: article.publishStatus || 'draft',
                        author: article.author || '',
                    });
                }, 0);
            } else {
                message.error('News article not found');
            }
        } catch (error) {
            message.error('Failed to load news article for editing');
            console.error('Error fetching news article:', error);
        }
    };

    const handleSave = async () => {
        try {
            await form.validateFields(['title', 'slug', 'featuredImage']);
            setSaving(true);

            const values = form.getFieldsValue();

            // Generate slug from title if not provided
            const slug = values.slug || values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            // Auto-assign order: if creating new, use articles.length (next sequential number)
            // If editing, keep existing order
            const order = editingArticle ? editingArticle.order : articles.length;

            const articleData = {
                title: values.title,
                slug: slug,
                subtitle: values.subtitle || null,
                featuredImage: values.featuredImage,
                excerpt: values.excerpt || null,
                content: values.content || null,
                ctaText: values.ctaText || null,
                ctaLink: values.ctaLink || null,
                order: order,
                active: values.active !== undefined ? values.active : true,
                publishStatus: values.publishStatus || 'draft',
                author: values.author || null,
            };

            if (editingArticle) {
                // Update
                const response = await fetch(`/api/news/${editingArticle.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(articleData),
                });

                if (response.ok) {
                    message.success('News article updated successfully');
                    setEditVisible(false);
                    setEditingArticle(null);
                    fetchArticles();
                } else {
                    const error = await response.json();
                    message.error(error.error || 'Failed to update news article');
                }
            } else {
                // Create
                const response = await fetch('/api/news', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(articleData),
                });

                if (response.ok) {
                    message.success('News article created successfully');
                    setEditVisible(false);
                    setEditingArticle(null);
                    fetchArticles();
                } else {
                    const error = await response.json();
                    message.error(error.error || 'Failed to create news article');
                }
            }
        } catch (error: any) {
            if (error.errorFields) {
                message.error('Please fix the form errors');
            } else {
                message.error('Failed to save news article');
                console.error('Error saving news article:', error);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/news/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                message.success('News article deleted successfully');
                // After deletion, refetch and re-sequence orders
                const refetchResponse = await fetch('/api/news?pageSize=100');
                const refetchResult = await refetchResponse.json();
                if (refetchResult.data && Array.isArray(refetchResult.data) && refetchResult.data.length > 0) {
                    // Re-sequence orders to be sequential (0, 1, 2, ...)
                    await updateArticleOrders(refetchResult.data);
                } else {
                    fetchArticles();
                }
            } else {
                const error = await response.json();
                message.error(error.error || 'Failed to delete news article');
            }
        } catch (error) {
            message.error('Failed to delete news article');
            console.error('Error deleting news article:', error);
        }
    };

    const updateArticleOrders = useCallback(async (newArticles: NewsArticle[]) => {
        try {
            // Update all articles with sequential orders (0, 1, 2, ...)
            await Promise.all(
                newArticles.map((article, index) =>
                    fetch(`/api/news/${article.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order: index }),
                    })
                )
            );

            message.success('Order updated successfully');
            // Refetch articles to get updated order
            const response = await fetch('/api/news?pageSize=100');
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
                setArticles(result.data);
            }
        } catch (error) {
            message.error('Failed to update order');
            console.error('Error updating order:', error);
        }
    }, []);

    const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
        const articleIndex = articles.findIndex(a => a.id === id);
        if (articleIndex === -1) return;

        const newIndex = direction === 'up' ? articleIndex - 1 : articleIndex + 1;
        if (newIndex < 0 || newIndex >= articles.length) return;

        // Create new array with swapped positions
        const newArticles = [...articles];
        [newArticles[articleIndex], newArticles[newIndex]] = [newArticles[newIndex], newArticles[articleIndex]];

        await updateArticleOrders(newArticles);
    };

    // COLUMNS_AND_RENDER_HERE
}
