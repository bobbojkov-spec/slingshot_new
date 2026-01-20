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
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
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
import { PLACEHOLDER_IMAGE } from '@/lib/utils/placeholder-image';

const { TextArea } = Input;

interface HeroSlide {
    id: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    backgroundImage: string;
    ctaText: string | null;
    ctaLink: string | null;
    order: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function HeroSlidesPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
    const [screenWidth, setScreenWidth] = useState(0);
    const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);

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
        fetchSlides();
    }, []);

    // Set form values when modal opens (add mode only)
    useEffect(() => {
        if (editVisible && !editingSlide) {
            // Add mode - set default values after Form is mounted
            // Order will be auto-assigned as slides.length (next sequential number)
            // Use a longer timeout to ensure Form component is fully mounted
            const timer = setTimeout(() => {
                if (editVisible) {
                    try {
                        form.resetFields();
                        form.setFieldsValue({
                            active: true,
                        });
                    } catch (error) {
                        // Form might not be mounted yet, ignore
                        console.debug('Form not ready yet:', error);
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [editVisible, editingSlide]);

    const fetchSlides = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/hero-slides');
            const result = await response.json();
            if (result.data) {
                // Check if orders are sequential, if not, fix them
                const orders = result.data.map((slide: HeroSlide) => slide.order).sort((a: number, b: number) => a - b);
                const isSequential = orders.every((order: number, index: number) => order === index);

                if (!isSequential && result.data.length > 0) {
                    // Fix orders automatically
                    try {
                        await fetch('/api/hero-slides/fix-orders', { method: 'POST' });
                        // Refetch after fixing
                        const fixedResponse = await fetch('/api/hero-slides');
                        const fixedResult = await fixedResponse.json();
                        if (fixedResult.data) {
                            setSlides(fixedResult.data);
                        } else {
                            setSlides(result.data);
                        }
                    } catch (fixError) {
                        console.error('Error fixing orders:', fixError);
                        setSlides(result.data);
                    }
                } else {
                    setSlides(result.data);
                }
            }
        } catch (error) {
            message.error('Failed to fetch hero slides');
            console.error('Error fetching hero slides:', error);
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
                        form.setFieldsValue({ backgroundImage: result.data.url });
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
                    form.setFieldsValue({ backgroundImage: result.data.url });
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
        setEditingSlide(null);
        setEditVisible(true);
    };

    const handleEdit = async (id: string) => {
        try {
            console.log('📝 Fetching hero slide with ID:', id);
            const response = await fetch(`/api/hero-slides/${id}`);
            const result = await response.json();

            console.log('📝 API response status:', response.status);
            console.log('📝 API response:', result);

            if (!response.ok) {
                message.error(result.error || `Failed to load hero slide (${response.status})`);
                console.error('❌ API error:', result);
                return;
            }

            if (result.data) {
                const slide = result.data;
                console.log('📝 Loaded slide:', slide);
                setEditingSlide(slide);
                setEditVisible(true);
                // Set form values after Form is mounted
                setTimeout(() => {
                    form.setFieldsValue({
                        title: slide.title || '',
                        subtitle: slide.subtitle || '',
                        description: slide.description || '',
                        backgroundImage: slide.backgroundImage || '',
                        ctaText: slide.ctaText || '',
                        ctaLink: slide.ctaLink || '',
                        active: slide.active !== undefined ? slide.active : true,
                    });
                }, 0);
            } else {
                message.error(result.error || 'Hero slide not found');
                console.error('❌ No data in response:', result);
            }
        } catch (error) {
            message.error('Failed to load hero slide for editing');
            console.error('❌ Error fetching hero slide:', error);
        }
    };

    const handleSave = async () => {
        try {
            await form.validateFields(['title', 'backgroundImage']);
            setSaving(true);

            const values = form.getFieldsValue();

            // Auto-assign order: if creating new, use slides.length (next sequential number)
            // If editing, keep existing order
            const order = editingSlide ? editingSlide.order : slides.length;

            const slideData = {
                title: values.title,
                subtitle: values.subtitle || null,
                description: values.description || null,
                backgroundImage: values.backgroundImage,
                ctaText: values.ctaText || null,
                ctaLink: values.ctaLink || null,
                order: order,
                active: values.active !== undefined ? values.active : true,
            };

            if (editingSlide) {
                // Update
                const response = await fetch(`/api/hero-slides/${editingSlide.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(slideData),
                });

                if (response.ok) {
                    message.success('Hero slide updated successfully');
                    setEditVisible(false);
                    setEditingSlide(null);
                    fetchSlides();
                } else {
                    const error = await response.json();
                    message.error(error.error || 'Failed to update hero slide');
                }
            } else {
                // Create
                const response = await fetch('/api/hero-slides', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(slideData),
                });

                if (response.ok) {
                    message.success('Hero slide created successfully');
                    setEditVisible(false);
                    setEditingSlide(null);
                    fetchSlides();
                } else {
                    const error = await response.json();
                    message.error(error.error || 'Failed to create hero slide');
                }
            }
        } catch (error: any) {
            if (error.errorFields) {
                message.error('Please fix the form errors');
            } else {
                message.error('Failed to save hero slide');
                console.error('Error saving hero slide:', error);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/hero-slides/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                message.success('Hero slide deleted successfully');
                // After deletion, refetch and re-sequence orders
                const refetchResponse = await fetch('/api/hero-slides');
                const refetchResult = await refetchResponse.json();
                if (refetchResult.data && refetchResult.data.length > 0) {
                    // Re-sequence orders to be sequential (0, 1, 2, ...)
                    await updateSlideOrders(refetchResult.data);
                } else {
                    fetchSlides();
                }
            } else {
                const error = await response.json();
                message.error(error.error || 'Failed to delete hero slide');
            }
        } catch (error) {
            message.error('Failed to delete hero slide');
            console.error('Error deleting hero slide:', error);
        }
    };

    const updateSlideOrders = useCallback(async (newSlides: HeroSlide[]) => {
        try {
            // Update all slides with sequential orders (0, 1, 2, ...)
            await Promise.all(
                newSlides.map((slide, index) =>
                    fetch(`/api/hero-slides/${slide.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order: index }),
                    })
                )
            );

            message.success('Order updated successfully');
            fetchSlides();
        } catch (error) {
            message.error('Failed to update order');
            console.error('Error updating order:', error);
        }
    }, [fetchSlides]);

    const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
        const slideIndex = slides.findIndex(s => s.id === id);
        if (slideIndex === -1) return;

        const newIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1;
        if (newIndex < 0 || newIndex >= slides.length) return;

        // Create new array with swapped positions
        const newSlides = [...slides];
        [newSlides[slideIndex], newSlides[newIndex]] = [newSlides[newIndex], newSlides[slideIndex]];

        await updateSlideOrders(newSlides);
    };

    const columns: ColumnsType<HeroSlide> = useMemo(() => [
        {
            title: 'Order',
            dataIndex: 'order',
            key: 'order',
            width: 70,
            render: (order: number, record: HeroSlide) => {
                const slideIndex = slides.findIndex(s => s.id === record.id);
                return (
                    <div
                        draggable
                        onDragStart={() => setDraggedSlideIndex(slideIndex)}
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
                            if (draggedSlideIndex !== null && draggedSlideIndex !== slideIndex) {
                                const newSlides = [...slides];
                                const draggedSlide = newSlides[draggedSlideIndex];
                                newSlides.splice(draggedSlideIndex, 1);
                                newSlides.splice(slideIndex, 0, draggedSlide);
                                updateSlideOrders(newSlides);
                            }
                            setDraggedSlideIndex(null);
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
                                disabled={slideIndex === 0}
                                onClick={() => handleMoveOrder(record.id, 'up')}
                                title="Move up"
                            />
                            <span>{slideIndex + 1}</span>
                            <Button
                                type="text"
                                icon={<ArrowDownOutlined />}
                                size="small"
                                disabled={slideIndex === slides.length - 1}
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
            dataIndex: 'backgroundImage',
            key: 'image',
            width: 80,
            render: (image: string) => (
                <AntImage
                    src={image || PLACEHOLDER_IMAGE}
                    alt="Hero slide"
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
            title: 'Subtitle',
            dataIndex: 'subtitle',
            key: 'subtitle',
            width: 150,
            ellipsis: { showTitle: false },
            render: (text: string | null) => {
                const displayText = text || '-';
                const truncated = displayText.length > 30 ? displayText.substring(0, 30) + '...' : displayText;
                return (
                    <Tooltip title={displayText}>
                        <span>{truncated}</span>
                    </Tooltip>
                );
            },
        },
        {
            title: 'CTA',
            key: 'cta',
            width: 120,
            ellipsis: { showTitle: false },
            render: (_: any, record: HeroSlide) => {
                const ctaDisplay = record.ctaText || record.ctaLink || '-';
                const truncated = ctaDisplay.length > 20 ? ctaDisplay.substring(0, 20) + '...' : ctaDisplay;
                return (
                    <Tooltip title={ctaDisplay}>
                        <div>
                            {record.ctaText && (
                                <Tag color="blue" style={{ marginBottom: 4 }}>{record.ctaText}</Tag>
                            )}
                            {record.ctaLink && (
                                <div style={{ fontSize: 11, color: '#999' }}>{truncated}</div>
                            )}
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Status',
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
            width: 80,
            fixed: 'right',
            render: (_: any, record: HeroSlide) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record.id)}
                        size="small"
                        title="Edit"
                    />
                    {!record.active && (
                        <Popconfirm
                            title="Delete hero slide"
                            description="Are you sure you want to delete this hero slide?"
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
                    )}
                </Space>
            ),
        },
    ], [isMobile, slides, handleMoveOrder, handleEdit, handleDelete, updateSlideOrders]);

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
                            Add Hero Slide
                        </Button>
                    </Col>
                </Row>

                <div style={{ width: '100%' }}>
                    <Table
                        columns={columns}
                        dataSource={slides}
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

            {/* Edit/Create Modal */}
            <Modal
                title={editingSlide ? `Edit Hero Slide: ${editingSlide.title}` : 'Add Hero Slide'}
                open={editVisible}
                onCancel={() => {
                    form.resetFields();
                    setEditVisible(false);
                    setEditingSlide(null);
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            form.resetFields();
                            setEditVisible(false);
                            setEditingSlide(null);
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
                        {editingSlide ? 'Update' : 'Create'}
                    </Button>,
                ]}
                width={isMobile ? '95%' : isTablet ? '90%' : 800}
                zIndex={1001}
                style={{ top: isMobile ? 20 : undefined }}
                centered={!isMobile}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        active: true,
                    }}
                >
                    <Form.Item
                        label="Title"
                        name="title"
                        rules={[{ required: true, message: 'Please enter title' }]}
                    >
                        <Input placeholder="Hero slide title" />
                    </Form.Item>

                    <Form.Item
                        label="Subtitle"
                        name="subtitle"
                    >
                        <Input placeholder="Optional subtitle" />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                    >
                        <TextArea
                            rows={4}
                            placeholder="Optional description"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Background Image"
                        name="backgroundImage"
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
                                                // If crop is enabled, show crop modal first
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

                                                // Otherwise upload directly
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
                                                        form.setFieldsValue({ backgroundImage: result.data.url });
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
                                shouldUpdate={(prevValues, currentValues) => prevValues.backgroundImage !== currentValues.backgroundImage}
                                style={{ marginTop: 12, width: '100%' }}
                            >
                                {({ getFieldValue }) => {
                                    const backgroundImage = getFieldValue('backgroundImage');
                                    return backgroundImage ? (
                                        <AntImage
                                            src={backgroundImage}
                                            alt="Background preview"
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

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="CTA Text"
                                name="ctaText"
                            >
                                <Input placeholder="Button text (e.g., Learn More)" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="CTA Link"
                                name="ctaLink"
                            >
                                <Input placeholder="/shop or https://example.com" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Active"
                        name="active"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>

            {/* MediaPicker */}
            <MediaPicker
                open={mediaPickerVisible}
                onCancel={() => setMediaPickerVisible(false)}
                onSelect={handleMediaSelect}
                title="Select Background Image"
            />

            {/* Crop Modal */}
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
                        key="crop"
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
