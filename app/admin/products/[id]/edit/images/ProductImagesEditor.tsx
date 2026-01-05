'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Image,
  Modal,
  Row,
  Select,
  Slider,
  Space,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import Link from 'next/link';
import { getImageVariantUrl } from '@/lib/utils/imagePaths';

type ProductImage = {
  id?: string;
  url?: string;
  thumb_url?: string;
  medium_url?: string;
  position?: number;
};

interface CustomUploadRequest {
  file: File;
  onSuccess?: (response: any) => void;
  onError?: (error: Error | string) => void;
}

const ratioOptions = [
  { label: '1:1', value: '1:1', aspect: 1 },
  { label: '3:1', value: '3:1', aspect: 3 },
  { label: '4:3', value: '4:3', aspect: 4 / 3 },
  { label: '16:9', value: '16:9', aspect: 16 / 9 },
];

const normalizeUrl = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed?.publicUrl || parsed?.url || value;
  } catch {
    return value;
  }
};

const resolveImageUrl = (image: ProductImage | null | undefined) => {
  if (!image) return null;
  const thumb = normalizeUrl(image.thumb_url);
  if (thumb) return thumb;
  return normalizeUrl(image.url) || image.url || null;
};

const normalizeImages = (imgs: ProductImage[]) =>
  imgs.map((img, idx) => ({ ...img, position: idx + 1 }));

export default function ProductImagesEditor({
  productId,
  productTitle,
  initialImages,
  backLink,
}: {
  productId: string;
  productTitle: string;
  initialImages: ProductImage[];
  backLink: string;
}) {
  const [images, setImages] = useState<ProductImage[]>(normalizeImages(initialImages));
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [ratio, setRatio] = useState('1:1');
  const [uploading, setUploading] = useState(false);
  const [originalDimensions, setOriginalDimensions] =
    useState<{ width: number; height: number } | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const selectedRatio = useMemo(() => {
    const option = ratioOptions.find((item) => item.value === ratio);
    return option?.aspect ?? 1;
  }, [ratio]);

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImage = async (
    imageSrc: string,
    pixelCrop: { width: number; height: number; x: number; y: number }
  ) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to get canvas context');
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
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create cropped image'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const enrichImages = (rows: any[]): ProductImage[] =>
    rows.map((row: any) => ({
      ...row,
      thumb_url: getImageVariantUrl(row.url, 'thumb') || row.thumb_url || row.url,
      medium_url: getImageVariantUrl(row.url, 'medium') || row.medium_url || row.url,
    }));

  const loadImages = async () => {
    const res = await fetch(`/api/admin/products/${productId}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to load product images');
    }
    const payload = await res.json();
    const fetched = payload?.product?.images ?? [];
    const normalized = normalizeImages(enrichImages(fetched));
    setImages(normalized);
    return normalized;
  };

  useEffect(() => {
    loadImages().catch(() => {
      // keep initial images if load fails
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadProductImage = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('productId', productId);
    form.append('position', String(images.length + 1));
    const res = await fetch('/api/admin/products/images', {
      method: 'POST',
      body: form,
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error || 'Upload failed');
    }
    return body.image as ProductImage;
  };

  const saveImages = async (imagesPayload: ProductImage[], deleteIds: string[] = []) => {
    const payload = {
      productId,
      images: normalizeImages(imagesPayload).map((img) => ({ id: img.id, position: img.position })),
      deleteIds,
    };
    const res = await fetch('/api/admin/products/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body?.error || 'Failed to save images');
    }
  };

  const handleHiddenInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setCropImageSrc(src);
      setCropModalOpen(true);
      createImage(src)
        .then((image) => {
          setOriginalDimensions({ width: image.naturalWidth, height: image.naturalHeight });
        })
        .catch(() => {
          setOriginalDimensions(null);
        });
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
    event.target.value = '';
  };

  const closeCropModal = () => {
    setCropModalOpen(false);
    setCropImageSrc(null);
    setSelectedFile(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setRatio('1:1');
    setOriginalDimensions(null);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !cropImageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedImage(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], selectedFile.name, { type: 'image/jpeg' });
      const newImg = await uploadProductImage(file);
      const next = normalizeImages([...images, newImg]);
      setImages(next);
      await saveImages(next);
      await loadImages();
      setDeletedImageIds([]);
      message.success('Image uploaded and saved');
      closeCropModal();
    } catch (err: any) {
      message.error(err?.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDragUpload = async ({ file, onError, onSuccess }: CustomUploadRequest) => {
    try {
      const newImg = await uploadProductImage(file);
      const next = normalizeImages([...images, newImg]);
      setImages(next);
      await saveImages(next);
      await loadImages();
      setDeletedImageIds([]);
      message.success('Image uploaded and saved');
      onSuccess?.(newImg);
    } catch (err: any) {
      onError?.(err);
      message.error(err?.message || 'Drag upload failed');
    }
  };

  const handleReorder = async (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;
    const next = [...images];
    [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
    const normalized = normalizeImages(next);
    setImages(normalized);
    try {
      await saveImages(normalized);
      await loadImages();
      setDeletedImageIds([]);
    } catch (err: any) {
      message.error(err?.message || 'Reorder failed');
    }
  };

  const handleDelete = async (index: number) => {
    const removed = images[index];
    const remaining = images.filter((_, idx) => idx !== index);
    const normalized = normalizeImages(remaining);
    const updatedDeleteIds = removed?.id ? [...deletedImageIds, removed.id] : deletedImageIds;
    setImages(normalized);
    try {
      await saveImages(normalized, updatedDeleteIds);
      await loadImages();
      setDeletedImageIds([]);
      message.success('Image deleted');
    } catch (err: any) {
      message.error(err?.message || 'Delete failed');
    }
  };

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link href={backLink}>Products</Link> },
          {
            title: (
              <Link
                href={`/admin/products/${productId}/edit${
                  backLink.includes('?') ? `?${backLink.split('?')[1]}` : ''
                }`}
              >
                {productTitle}
              </Link>
            ),
          },
          { title: 'Images' },
        ]}
      />
      <Typography.Title level={4} style={{ margin: 0 }}>
        Images for {productTitle}
      </Typography.Title>
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => hiddenInputRef.current?.click()}>
            Upload with Crop Ratio
          </Button>
          <input
            ref={hiddenInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleHiddenInputChange}
          />
          <Upload.Dragger
            accept="image/*"
            multiple
            customRequest={handleDragUpload}
            showUploadList={false}
            style={{ borderRadius: 8 }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Drag images here (no crop)</p>
          </Upload.Dragger>
        </Space>
      </Card>
      <Divider />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {images.map((img, idx) => (
          <Card
            key={img.id || `${idx}-${img.url ?? Math.random()}`}
            styles={{ body: { padding: 0 }, border: '1px solid #d9d9d9', borderRadius: 8 }}
            variant="outlined"
            style={{ borderRadius: 8 }}
          >
            <div
              style={{
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa',
              }}
            >
              <Image
                src={resolveImageUrl(img) || undefined}
                alt={`Image ${idx + 1}`}
                height={180}
                width="auto"
                preview
                style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
              />
            </div>
            <div
              style={{
                padding: 8,
                fontSize: 12,
                color: '#444',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Position: {img.position ?? idx + 1}</span>
              <Space size={4}>
                <Button
                  size="small"
                  icon={<ArrowUpOutlined />}
                  onClick={() => handleReorder(idx, Math.max(0, idx - 1))}
                  disabled={idx === 0}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  onClick={() => handleReorder(idx, Math.min(images.length - 1, idx + 1))}
                  disabled={idx === images.length - 1}
                />
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(idx)} />
              </Space>
            </div>
          </Card>
        ))}
      </div>
      <Modal
        open={cropModalOpen}
        onCancel={closeCropModal}
        title="Crop Image"
        okText="Save"
        confirmLoading={uploading}
        onOk={handleUploadSubmit}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Typography.Text>Select ratio</Typography.Text>
              <Select
                style={{ width: '100%' }}
                value={ratio}
                onChange={(value) => setRatio(value)}
                options={ratioOptions.map((opt) => ({ label: opt.label, value: opt.value }))}
              />
            </Col>
            <Col span={12}>
              <Typography.Text>Zoom</Typography.Text>
              <Slider min={1} max={3} step={0.1} value={zoom} onChange={(value) => setZoom(value)} />
            </Col>
          </Row>
          {originalDimensions && (
            <Typography.Text type="secondary">
              Original size: {originalDimensions.width} × {originalDimensions.height} px
            </Typography.Text>
          )}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 400,
              backgroundColor: '#333',
            }}
          >
            {cropImageSrc && (
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={selectedRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              />
            )}
          </div>
        </Space>
      </Modal>
    </Space>
  );
}

