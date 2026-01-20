"use client";

import { useState, useEffect, useRef } from 'react';
import {
    Modal,
    Tabs,
    Button,
    Upload,
    message,
    Space,
    Slider,
    Card,
    Image as AntImage,
} from 'antd';
import {
    UploadOutlined,
    FolderOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import type { UploadFile } from 'antd/es/upload/interface';
import { PLACEHOLDER_IMAGE } from '@/lib/utils/placeholder-image';

// Media pool should only track deliberate uploads (big originals). Loaded/cropped images may be used temporarily but are not persisted here.

interface MediaFile {
    id: number;
    filename: string;
    url: string;
    url_large: string | null;
    url_medium: string | null;
    url_thumb: string | null;
    width: number | null;
    height: number | null;
    mime_type: string | null;
}

interface MediaPickerProps {
    open: boolean;
    onCancel: () => void;
    onSelect: (mediaId: number) => void;
    title?: string;
}

export default function MediaPicker({
    open,
    onCancel,
    onSelect,
    title = 'Select Media',
}: MediaPickerProps) {
    const [activeTab, setActiveTab] = useState('library');
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [uploading, setUploading] = useState(false);
    // Default filter: 400px - 3000px (all images >= 400px short side)
    const [sizeFilter, setSizeFilter] = useState<[number, number]>([400, 3000]);

    // Crop state
    const [cropVisible, setCropVisible] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [screenWidth, setScreenWidth] = useState(0);

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
        if (open && activeTab === 'library') {
            fetchMediaFiles();
        }
    }, [open, activeTab]);

    // Calculate short side of an image
    const getShortSide = (file: MediaFile): number => {
        if (!file.width || !file.height) return 0;
        return Math.min(file.width, file.height);
    };

    // Calculate min/max short sides for slider from files
    const getSizeRangeFromFiles = (files: MediaFile[]): [number, number] => {
        if (files.length === 0) return [400, 3000];

        const shortSides = files
            .map(file => {
                if (!file.width || !file.height) return null;
                return Math.min(file.width, file.height);
            })
            .filter((side): side is number => side !== null && side >= 400); // Only count images >= 400px

        if (shortSides.length === 0) return [400, 3000];

        const min = Math.min(...shortSides);
        const max = Math.max(...shortSides);

        // Return actual range (min from data, max up to 3000 or actual max)
        return [min, Math.max(3000, max)];
    };

    // Filter files by short side dimension
    useEffect(() => {
        if (mediaFiles.length === 0) {
            setFilteredFiles([]);
            return;
        }

        const filtered = mediaFiles.filter((file) => {
            const shortSide = getShortSide(file);
            return shortSide >= sizeFilter[0] && shortSide <= sizeFilter[1];
        });

        setFilteredFiles(filtered);
    }, [mediaFiles, sizeFilter]);

    const parseJsonResponse = async (response: Response) => {
        const text = await response.text();
        if (!response.ok) {
            const errorMessage = text || `Server error (${response.status}) while loading media`;
            throw new Error(errorMessage);
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
            throw new Error(text || 'Received unexpected response from /api/media');
        }
        try {
            return JSON.parse(text);
        } catch {
            throw new Error(text || 'Failed to parse JSON from /api/media');
        }
    };

    const fetchMediaFiles = async () => {
        setLoadingMedia(true);
        try {
            const response = await fetch('/api/media?pageSize=1000');
            const result = await parseJsonResponse(response);
            if (result.data) {
                // Filter only images with short side >= 400px
                const imageFiles = result.data.filter((file: any) => {
                    if (!file.mime_type?.startsWith('image/')) return false;
                    if (!file.width || !file.height) return false;
                    const shortSide = Math.min(file.width, file.height);
                    return shortSide >= 400; // Only show images with short side >= 400px
                });
                setMediaFiles(imageFiles);

                // Set initial filter range to show ALL images by default
                // Admin can then use slider to filter for specific size ranges
                const [min, max] = getSizeRangeFromFiles(imageFiles);
                // Default: show all images (from min to max)
                setSizeFilter([min, max]);
            }
        } catch (error) {
            message.error('Failed to load media library');
            console.error('Error fetching media:', error);
        } finally {
            setLoadingMedia(false);
        }
    };

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob> => {
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

    const createImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.src = url;
        });
    };

    const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            message.error('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setImageToCrop(e.target?.result as string);
            setOriginalFile(file);
            setCropVisible(true);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        };
        reader.readAsDataURL(file);
    };

    const handleCropAndUpload = async () => {
        if (!imageToCrop || !croppedAreaPixels || !originalFile) {
            message.error('Missing crop data');
            return;
        }

        setUploading(true);
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

            if (result.data && result.data.id) {
                message.success({ content: 'Image uploaded successfully', key: 'upload' });
                setCropVisible(false);
                setImageToCrop(null);
                setOriginalFile(null);
                setCroppedAreaPixels(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                // Refresh media library and select the new image
                await fetchMediaFiles();
                onSelect(result.data.id);
                onCancel();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error: any) {
            message.error({ content: error.message || 'Failed to upload image', key: 'upload' });
        } finally {
            setUploading(false);
        }
    };

    const handleSelectFromLibrary = (mediaId: number) => {
        onSelect(mediaId);
        onCancel();
    };

    const tabItems = [
        {
            key: 'library',
            label: 'Select from Library',
            children: (
                <div>
                    {loadingMedia ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            Loading media library...
                        </div>
                    ) : (
                        <>
                            {/* Size Filter Slider */}
                            {mediaFiles.length > 0 && (() => {
                                const [minSize, maxSize] = getSizeRangeFromFiles(mediaFiles);
                                // Slider range: 400px to max available (or 3000px, whichever is larger)
                                const sliderMin = 400;
                                const sliderMax = Math.max(3000, maxSize);

                                // Ensure filter values are within slider range
                                const currentFilter = [
                                    Math.max(sliderMin, Math.min(sliderMax, sizeFilter[0])),
                                    Math.max(sliderMin, Math.min(sliderMax, sizeFilter[1]))
                                ];

                                return (
                                    <div style={{ marginBottom: 24, padding: '16px 0' }}>
                                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                                            Filter by Short Side: {currentFilter[0]}px - {currentFilter[1]}px
                                        </div>
                                        <Slider
                                            range
                                            min={sliderMin}
                                            max={sliderMax}
                                            value={currentFilter}
                                            onChange={(value) => setSizeFilter([value[0], value[1]])}
                                            step={10}
                                            marks={{
                                                [sliderMin]: `${sliderMin}px`,
                                                ...(sliderMax <= 3000 ? { [sliderMax]: `${sliderMax}px` } : { [3000]: '3000px' }),
                                            }}
                                        />
                                        <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                                            Showing {filteredFiles.length} of {mediaFiles.length} images (all have short side ≥ 400px)
                                        </div>
                                    </div>
                                );
                            })()}

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                    gap: 16,
                                    maxHeight: 500,
                                    overflowY: 'auto',
                                }}
                            >
                                {filteredFiles.length > 0 ? (
                                    filteredFiles.map((file) => {
                                        const shortSide = getShortSide(file);
                                        const dimensions = file.width && file.height
                                            ? `${file.width} × ${file.height}px`
                                            : 'Unknown size';

                                        return (
                                            <div
                                                key={file.id}
                                                style={{
                                                    border: '1px solid #d9d9d9',
                                                    borderRadius: 8,
                                                    padding: 8,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    position: 'relative',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = '#1890ff';
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = '#d9d9d9';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                onClick={() => handleSelectFromLibrary(file.id)}
                                            >
                                                <AntImage
                                                    src={file.url} // Show original image only
                                                    alt={file.filename}
                                                    width={150}
                                                    height={150}
                                                    style={{
                                                        objectFit: 'contain',
                                                        borderRadius: 4,
                                                        display: 'block',
                                                        width: '100%',
                                                        height: 150,
                                                        backgroundColor: '#f5f5f5',
                                                    }}
                                                    fallback={PLACEHOLDER_IMAGE}
                                                />
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: '#666',
                                                        marginTop: 8,
                                                        textAlign: 'center',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {dimensions}
                                                </div>
                                                {shortSide > 0 && (
                                                    <div
                                                        style={{
                                                            fontSize: 10,
                                                            color: '#999',
                                                            marginTop: 4,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        Short: {shortSide}px
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : mediaFiles.length > 0 ? (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#999' }}>
                                        No images match the selected size filter. Adjust the slider above.
                                    </div>
                                ) : (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#999' }}>
                                        No media files found. Upload images first.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            ),
        },
        {
            key: 'upload',
            label: 'Upload New',
            children: (
                <div>
                    <Space orientation="vertical" style={{ width: '100%' }} size="large">
                        <Card>
                            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                                <Button
                                    icon={<UploadOutlined />}
                                    onClick={() => fileInputRef.current?.click()}
                                    size="large"
                                    type="primary"
                                >
                                    Choose Image
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleFileSelect(file);
                                        }
                                    }}
                                />
                                <div style={{ fontSize: 12, color: '#999' }}>
                                    Select an image file to upload and crop
                                </div>
                            </Space>
                        </Card>
                    </Space>
                </div>
            ),
        },
    ];

    return (
        <>
            <Modal
                title={title}
                open={open}
                onCancel={onCancel}
                footer={null}
                width={isMobile ? '95%' : isTablet ? '90%' : 800}
                destroyOnHidden
                zIndex={1001}
                style={{ top: isMobile ? 20 : undefined }}
                centered={!isMobile}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                />
            </Modal>

            {/* Crop Modal */}
            <Modal
                title="Crop Image"
                open={cropVisible}
                onCancel={() => {
                    setCropVisible(false);
                    setImageToCrop(null);
                    setOriginalFile(null);
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setCropVisible(false);
                        setImageToCrop(null);
                        setOriginalFile(null);
                    }}>
                        Cancel
                    </Button>,
                    <Button
                        key="upload"
                        type="primary"
                        loading={uploading}
                        onClick={handleCropAndUpload}
                    >
                        Upload Cropped Image
                    </Button>,
                ]}
                width={800}
                destroyOnHidden
                zIndex={1002}
                mask={true}
                maskClosable={false}
            >
                {imageToCrop && (
                    <div style={{ position: 'relative', height: 400, background: '#000', zIndex: 1 }}>
                        <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={undefined}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                    </div>
                )}
                <div style={{ marginTop: 16 }}>
                    <Space orientation="vertical" style={{ width: '100%' }} size="small">
                        <div>
                            <span>Zoom: </span>
                            <Slider
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                onChange={setZoom}
                                style={{ width: 200, display: 'inline-block', marginLeft: 16 }}
                            />
                        </div>
                    </Space>
                </div>
            </Modal>
        </>
    );
}
