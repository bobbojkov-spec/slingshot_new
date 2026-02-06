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
import TiptapEditor from '@/components/TiptapEditor';
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

    const columns: ColumnsType<NewsArticle> = useMemo(() => [
        {
            title: 'Order',
            dataIndex: 'order',
            key: 'order',
            width: 70,
            render: (_: number, record: NewsArticle) => {
                const articleIndex = articles.findIndex(a => a.id === record.id);
                return (
                    <div
                        draggable
                        onDragStart={() => setDraggedArticleIndex(articleIndex)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.opacity = '1';
                            if (draggedArticleIndex !== null && draggedArticleIndex !== articleIndex) {
                                const newArticles = [...articles];
                                const dragged = newArticles[draggedArticleIndex];
                                newArticles.splice(draggedArticleIndex, 1);
                                newArticles.splice(articleIndex, 0, dragged);
                                updateArticleOrders(newArticles);
                            }
                            setDraggedArticleIndex(null);
                        }}
                        style={{
                            cursor: 'move',
                            padding: '4px 8px',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <DragOutlined style={{ color: '#999' }} />
                        <Space size="small">
                            <Button
                                type="text"
                                icon={<ArrowUpOutlined />}
                                size="small"
                                disabled={articleIndex === 0}
                                onClick={() => handleMoveOrder(record.id, 'up')}
                                title="Move up"
                            />
                            <span>{articleIndex + 1}</span>
                            <Button
                                type="text"
                                icon={<ArrowDownOutlined />}
                                size="small"
                                disabled={articleIndex === articles.length - 1}
                                onClick={() => handleMoveOrder(record.id, 'down')}
                                title="Move down"
                            />
                        </Space>
                    </div>
                );
            },
        },
        {
            title: 'Image',
            dataIndex: 'featuredImage',
            key: 'image',
            width: 80,
            render: (image: string) => (
                <AntImage
                    src={image || PLACEHOLDER_IMAGE}
                    alt="News"
                    width={60}
                    height={40}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback={PLACEHOLDER_IMAGE}
                />
            ),
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: { showTitle: false },
            render: (text: string) => (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'publishStatus',
            key: 'publishStatus',
            width: 120,
            render: (status: string) => (
                <Tag color={status === 'published' ? 'green' : 'default'}>
                    {(status || 'draft').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Active',
            dataIndex: 'active',
            key: 'active',
            width: 80,
            align: 'center',
            render: (active: boolean) => (
                <Tag color={active ? 'green' : 'red'}>
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_: any, record: NewsArticle) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record.id)}
                        size="small"
                        title="Edit"
                    />
                    <Popconfirm
                        title="Delete article"
                        description="Are you sure you want to delete this article?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                        okType="danger"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            title="Delete"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ], [articles, draggedArticleIndex, handleEdit, handleDelete, handleMoveOrder, updateArticleOrders]);

    return (
        <div>
            <Card>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                        >
                            Add Article
                        </Button>
                    </Col>
                </Row>

                <div style={{ width: '100%' }}>
                    <Table
                        columns={columns}
                        dataSource={articles}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        scroll={{
                            y: isMobile ? 400 : undefined,
                        }}
                        size={isMobile ? 'small' : 'middle'}
                    />
                </div>
            </Card>

            <Modal
                title={editingArticle ? `Edit Article: ${editingArticle.title}` : 'Add Article'}
                open={editVisible}
                onCancel={() => {
                    form.resetFields();
                    setEditVisible(false);
                    setEditingArticle(null);
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            form.resetFields();
                            setEditVisible(false);
                            setEditingArticle(null);
                        }}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        loading={saving}
                        onClick={handleSave}
                    >
                        {editingArticle ? 'Update' : 'Create'}
                    </Button>,
                ]}
                width={isMobile ? '95%' : isTablet ? '90%' : 900}
                zIndex={1001}
                style={{ top: isMobile ? 20 : undefined }}
                centered={!isMobile}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        active: true,
                        publishStatus: 'draft',
                    }}
                >
                    <Form.Item
                        label="Title"
                        name="title"
                        rules={[{ required: true, message: 'Please enter title' }]}
                    >
                        <Input placeholder="Article title" />
                    </Form.Item>

                    <Form.Item label="Slug" name="slug">
                        <Input placeholder="auto-generated if empty" />
                    </Form.Item>

                    <Form.Item label="Subtitle" name="subtitle">
                        <Input placeholder="Optional subtitle" />
                    </Form.Item>

                    <Form.Item
                        label="Featured Image"
                        name="featuredImage"
                        rules={[{ required: true, message: 'Please upload an image' }]}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Space style={{ marginBottom: 16 }}>
                                <Switch
                                    checked={enableCrop}
                                    onChange={setEnableCrop}
                                    checkedChildren="Crop"
                                    unCheckedChildren="No Crop"
                                />
                                {enableCrop && (
                                    <Select
                                        value={aspectRatio}
                                        onChange={(value) => setAspectRatio(value)}
                                        placeholder="Aspect Ratio (Free if empty)"
                                        style={{ width: 150 }}
                                        allowClear
                                    >
                                        <Select.Option value={1}>1:1 (Square)</Select.Option>
                                        <Select.Option value={4 / 3}>4:3</Select.Option>
                                        <Select.Option value={16 / 9}>16:9</Select.Option>
                                        <Select.Option value={3 / 4}>3:4 (Portrait)</Select.Option>
                                        <Select.Option value={9 / 16}>9:16 (Vertical)</Select.Option>
                                    </Select>
                                )}
                                <Button
                                    type="primary"
                                    icon={<UploadOutlined />}
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = async (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if (file) {
                                                if (enableCrop) {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        setImageToCrop(reader.result as string);
                                                        setOriginalFile(file);
                                                        setCropVisible(true);
                                                    };
                                                    reader.readAsDataURL(file);
                                                    return;
                                                }

                                                try {
                                                    message.loading({ content: 'Uploading image...', key: 'upload' });
                                                    const formData = new FormData();
                                                    formData.append('file', file);
                                                    const response = await fetch('/api/media', {
                                                        method: 'POST',
                                                        body: formData,
                                                    });
                                                    const result = await response.json();
                                                    if (result.data && result.data.url) {
                                                        form.setFieldsValue({ featuredImage: result.data.url });
                                                        message.success({ content: 'Image uploaded successfully', key: 'upload' });
                                                    } else {
                                                        message.error({ content: result.error || 'Failed to upload image', key: 'upload' });
                                                    }
                                                } catch (error) {
                                                    message.error({ content: 'Failed to upload image', key: 'upload' });
                                                    console.error('Upload error:', error);
                                                }
                                            }
                                        };
                                        input.click();
                                    }}
                                >
                                    Upload
                                </Button>
                                <Button
                                    icon={<FolderOutlined />}
                                    onClick={() => setMediaPickerVisible(true)}
                                >
                                    Select Media
                                </Button>
                            </Space>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, currentValues) => prevValues.featuredImage !== currentValues.featuredImage}
                                style={{ marginTop: 12, width: '100%' }}
                            >
                                {({ getFieldValue }) => {
                                    const featuredImage = getFieldValue('featuredImage');
                                    return featuredImage ? (
                                        <AntImage
                                            src={featuredImage}
                                            alt="Featured preview"
                                            width={300}
                                            height={200}
                                            style={{ objectFit: 'cover', borderRadius: 4, marginTop: 8 }}
                                            fallback={PLACEHOLDER_IMAGE}
                                        />
                                    ) : null;
                                }}
                            </Form.Item>
                        </div>
                    </Form.Item>

                    <Form.Item label="Excerpt" name="excerpt">
                        <TextArea rows={3} placeholder="Short excerpt" />
                    </Form.Item>

                    <Form.Item label="Content" name="content">
                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.content !== currentValues.content}>
                            {({ getFieldValue, setFieldValue }) => (
                                <TiptapEditor
                                    value={getFieldValue('content') || ''}
                                    onChange={(val) => setFieldValue('content', val)}
                                />
                            )}
                        </Form.Item>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="CTA Text" name="ctaText">
                                <Input placeholder="Button text" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="CTA Link" name="ctaLink">
                                <Input placeholder="https://..." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Active" name="active" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Author" name="author">
                                <Input placeholder="Author name" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Publish Status" name="publishStatus">
                        <Select
                            options={[
                                { label: 'Draft', value: 'draft' },
                                { label: 'Published', value: 'published' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <MediaPicker
                open={mediaPickerVisible}
                onCancel={() => setMediaPickerVisible(false)}
                onSelect={handleMediaSelect}
                title="Select Featured Image"
            />

            <Modal
                title="Crop Image"
                open={cropVisible}
                onCancel={() => {
                    setCropVisible(false);
                    setImageToCrop(null);
                    setOriginalFile(null);
                    setCroppedAreaPixels(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setCropVisible(false);
                            setImageToCrop(null);
                            setOriginalFile(null);
                            setCroppedAreaPixels(null);
                            setCrop({ x: 0, y: 0 });
                            setZoom(1);
                        }}
                    >
                        Cancel
                    </Button>,
                    <Button
                        type="primary"
                        loading={uploadingImage}
                        onClick={handleCropAndUpload}
                    >
                        Crop & Upload
                    </Button>,
                ]}
                width={isMobile ? '95%' : isTablet ? '90%' : 800}
                zIndex={1002}
                style={{ top: isMobile ? 20 : undefined }}
                centered={!isMobile}
            >
                {imageToCrop && (
                    <div style={{ position: 'relative', width: '100%', height: 400, background: '#000' }}>
                        <Cropper
                            image={imageToCrop}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
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
                        value={zoom}
                        onChange={setZoom}
                        style={{ width: '100%', marginTop: 8 }}
                    />
                </div>
            </Modal>
        </div>
    );
}
