'use client';

import {
  Alert,
  Button,
  Image as AntImage,
  Input,
  Select,
  Space,
  Table,
  Typography,
  Card,
  Divider,
  Modal,
  Row,
  Col,
  Slider,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useMemo, useState, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Product = {
  id: string;
  title?: string;
  name?: string;
  handle?: string;
  tags?: string[];
  images?: { id?: string; url?: string; position?: number; thumb_url?: string; medium_url?: string }[];
  imageCount?: number;
  product_type?: string;
  productType?: string;
  variants?: any[];
  status?: string;
  availability?: string;
  updated_at?: string;
  created_at?: string;
  category?: { name?: string } | string;
  info?: {
    tags?: string[] | string;
  };
  [key: string]: any;
};

const ratioOptions = [
  { label: '1:1', value: '1:1', aspect: 1 },
  { label: '3:1', value: '3:1', aspect: 3 },
  { label: '4:3', value: '4:3', aspect: 4 / 3 },
  { label: '16:9', value: '16:9', aspect: 16 / 9 },
];

export default function ProductsListClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<Product[]>(products);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [availability, setAvailability] = useState<string | undefined>(undefined);
  const [productType, setProductType] = useState<string | undefined>(undefined);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  useEffect(() => {
    setRows(products);
  }, [products]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const c = searchParams.get('category');
    const a = searchParams.get('availability');
    const t = searchParams.get('type');
    setSearch(q);
    setCategory(c ? c.toLowerCase() : undefined);
    setAvailability(a ? a.toLowerCase() : undefined);
    setProductType(t ? t.toLowerCase() : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const uploadProductImage = async (file: File) => {
    if (!activeProduct?.id) throw new Error('No active product');
    const form = new FormData();
    form.append('file', file);
    form.append('productId', activeProduct.id);
    form.append('position', String((activeProduct.images?.length || 0) + 1));
    const res = await fetch('/api/admin/products/images', {
      method: 'POST',
      body: form,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error || 'Upload failed');
    return body.image;
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !cropImageSrc || !croppedAreaPixels || !activeProduct) return;
    setUploading(true);
    try {
      const blob = await getCroppedImage(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], selectedFile.name, { type: 'image/jpeg' });
      const newImg = await uploadProductImage(file);
      const next = normalizeImages([...(activeProduct.images || []), newImg]);
      setActiveProduct({ ...activeProduct, images: next });
      await saveImages(next, deletedImageIds);
      message.success('Image uploaded and saved');
      closeCropModal();
    } catch (err: any) {
      message.error(err?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (category) params.set('category', category);
    if (availability) params.set('availability', availability);
    if (productType) params.set('type', productType);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [search, category, availability, productType, pathname, router]);

  const textStyle = { fontSize: 12 };
  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 10,
    padding: '2px 6px',
    background: '#f0f2f5',
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  };

  const categoryOptions = useMemo(
    () =>
      [{ label: 'All categories', value: '__all__' }].concat(
        Array.from(
          new Set(
            rows
              .map((p) => (p.category && typeof p.category === 'object' ? (p.category as any).name : p.category))
              .filter(Boolean) as string[]
          )
        ).map((value) => ({ label: value, value: value.toString().toLowerCase() }))
      ),
    [rows]
  );

  const availabilityOptions = useMemo(
    () => [
      { label: 'All', value: '__all__' },
      { label: 'active', value: 'active' },
      { label: 'not active', value: 'draft' },
    ],
    []
  );

  const productTypeOptions = useMemo(
    () =>
      [{ label: 'All types', value: '__all__' }].concat(
        Array.from(
          new Set(
            rows
              .map((p) => p.product_type || p.productType)
              .filter(Boolean) as string[]
          )
        ).map((value) => ({ label: value, value: value.toString().toLowerCase() }))
      ),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      const name = (p.title || p.name || '').toLowerCase();
      const matchesSearch = !search || name.includes(search.toLowerCase());
      const categoryName = p.category && typeof p.category === 'object' ? (p.category as any).name : p.category;
      const categoryVal = categoryName ? categoryName.toString().toLowerCase() : '';
      const matchesCategory = !category || categoryVal === category;
      const availVal = (p.availability || p.status || '').toString().toLowerCase();
      const matchesAvail = !availability || availVal === availability;
      const typeVal = (p.product_type || p.productType || '').toString().toLowerCase();
      const matchesType = !productType || typeVal === productType;
      return matchesSearch && matchesCategory && matchesAvail && matchesType;
    });
  }, [rows, search, category, availability, productType]);

  const priceRangeText = (record: Product) => {
    const variants = Array.isArray(record.variants) ? record.variants : [];
    const prices: number[] = [];
    variants.forEach((v) => {
      const maybe = [
        v.price,
        v.price_eur,
        v.price_eur_cents ? v.price_eur_cents / 100 : undefined,
        v.price_cents ? v.price_cents / 100 : undefined,
      ].find((n) => typeof n === 'number' && !Number.isNaN(n));
      if (typeof maybe === 'number') prices.push(maybe);
    });
    if (!prices.length) return '—';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `€${Math.round(min)}` : `€${Math.round(min)} / €${Math.round(max)}`;
  };

  const queryString = useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `?${qs}` : '';
  }, [searchParams]);

  const goToEditPage = (id: string) => {
    router.push(`/admin/products/${id}/edit${queryString}`);
  };

  const openModal = (record: Product) => {
    setActiveProduct(record);
    setModalOpen(true);
    setDeletedImageIds([]);
  };

  const normalizeImages = (imgs: any[]) =>
    imgs.map((img, idx) => ({
      ...img,
      position: idx + 1,
    }));

  const saveImages = async (imagesPayload: any[], deleteIds: string[]) => {
    if (!activeProduct?.id) return;
    const payload = {
      productId: activeProduct.id,
      images: normalizeImages(imagesPayload).map((img: any, idx: number) => ({ id: img.id, position: idx + 1 })),
      deleteIds,
    };
    const res = await fetch('/api/admin/products/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error || 'Save failed');
    setRows((prev) =>
      prev.map((p) =>
        p.id === activeProduct.id
          ? { ...p, images: imagesPayload, imageCount: imagesPayload.length }
          : p
      )
    );
    setActiveProduct((prev) => (prev ? { ...prev, images: imagesPayload } : prev));
  };

  const columns = [
        {
          title: <span style={{ fontSize: 11 }}>Img</span>,
          dataIndex: 'images',
          width: 100,
          render: (_: any, record: Product) => {
            const name = record.title || record.name || 'Untitled';
            const firstImage = record.images?.[0];
            const imgUrl = firstImage?.thumb_url || firstImage?.url;
            return imgUrl ? (
              <div
                style={{
                  width: '100%',
                  height: 80,
                  minHeight: 80,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <AntImage
                  src={imgUrl}
                  alt={name}
                  height={80}
                  width="auto"
                  preview
                  style={{
                    objectFit: 'contain',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    borderRadius: 4,
                  }}
                  fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='10'%3ENo image%3C/text%3E%3C/svg%3E"
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 80,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            );
          },
        },
    {
      title: <span style={{ fontSize: 11, fontWeight: 600 }}>Name</span>,
      dataIndex: 'title',
      render: (_: any, record: Product) => (
        <Typography.Link style={{ fontSize: 13 }} onClick={() => goToEditPage(record.id)}>
          {record.title || record.name || 'Untitled'}
        </Typography.Link>
      ),
    },
    {
      title: <span style={{ fontSize: 11 }}>Type</span>,
      dataIndex: 'product_type',
      render: (_: any, record: Product) => (
        <Typography.Text style={textStyle}>{record.product_type || record.productType || '—'}</Typography.Text>
      ),
    },
    {
      title: <span style={{ fontSize: 11 }}>Price</span>,
      dataIndex: 'variants',
      render: (_: any, record: Product) => (
        <Typography.Text style={textStyle}>{priceRangeText(record)}</Typography.Text>
      ),
    },
    {
      title: <span style={{ fontSize: 11 }}>Variants</span>,
      dataIndex: 'variants',
      render: (_: any, record: Product) => {
        const variants = Array.isArray(record.variants) ? record.variants : [];
        return <Typography.Text style={textStyle}>{variants.length}</Typography.Text>;
      },
    },
    {
      title: <span style={{ fontSize: 11 }}>Available</span>,
      dataIndex: 'availability',
      render: (_: any, record: Product) => {
        const variants = Array.isArray(record.variants) ? record.variants : [];
        const inStock = variants.some((v) => {
          if (v.available === true) return true;
          const avail = (v.availability || v.status || '').toString().toLowerCase();
          return avail.includes('stock');
        });
        if (inStock) return <Typography.Text style={textStyle}>In stock</Typography.Text>;
        const fallback = (record.availability || record.status || '').toString().toLowerCase();
        return <Typography.Text style={textStyle}>{fallback || '—'}</Typography.Text>;
      },
    },
    {
      title: <span style={{ fontSize: 11 }}>Images</span>,
      dataIndex: 'imageCount',
      width: 120,
      render: (_: any, record: Product) => (
        <Typography.Text style={textStyle}>{record.imageCount ?? (record.images?.length || 0)}</Typography.Text>
      ),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: (_: any, record: Product) => {
        const tags = Array.isArray(record.tags) ? record.tags : [];
        if (!tags.length) return <Typography.Text style={textStyle}>—</Typography.Text>;
        return (
          <div>
            {tags.map((t: string, idx: number) => (
              <span key={idx} style={tagStyle}>
                {t}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: <span style={{ fontSize: 11 }}>Status</span>,
      dataIndex: 'status',
      render: (_: any, record: Product) => (
        <Typography.Text style={textStyle}>{record.status || '—'}</Typography.Text>
      ),
    },
    {
      title: <span style={{ fontSize: 11 }}>Updated</span>,
      dataIndex: 'updated_at',
      render: (_: any, record: Product) => {
        const val = record.updated_at || record.created_at;
        if (!val) return '—';
        const d = new Date(val);
        if (Number.isNaN(d.getTime())) return '—';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return (
          <Typography.Text style={textStyle}>{`${dd}-${mm}-${yy}`}</Typography.Text>
        );
      },
    },
    {
      title: '',
      dataIndex: 'edit',
      width: 90,
      fixed: 'right' as const,
      render: (_: any, record: Product) => (
        <Space size={4}>
          <Button
            type="link"
            icon={<PictureOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              openModal(record);
            }}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              goToEditPage(record.id);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Products
      </Typography.Title>
      <Divider style={{ margin: '8px 0' }} />
      <Card styles={{ body: { padding: 12 } }}>
        <Space wrap size={[12, 12]}>
          <Input.Search
            allowClear
            placeholder="Search products"
            style={{ width: 240 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
          />
          <Select
            allowClear
            placeholder="Filter by category"
            options={categoryOptions}
            style={{ width: 200 }}
            value={category}
            onChange={(val) => setCategory(val === '__all__' ? undefined : val || undefined)}
            size="small"
          />
          <Select
            allowClear
            placeholder="Filter by availability"
            options={availabilityOptions}
            style={{ width: 200 }}
            value={availability}
            onChange={(val) => setAvailability(val === '__all__' ? undefined : val || undefined)}
            size="small"
          />
          <Select
            allowClear
            placeholder="Filter by type"
            options={productTypeOptions}
            style={{ width: 200 }}
            value={productType}
            onChange={(val) => setProductType(val === '__all__' ? undefined : val || undefined)}
            size="small"
          />
        </Space>
      </Card>
      <Card title="Product list" styles={{ body: { padding: 12 } }}>
        <Table<Product>
          rowKey={(row) => row.id}
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 10, size: 'small' }}
          size="small"
          onRow={(record) => ({
            onClick: () => goToEditPage(record.id),
          })}
          scroll={{ x: true }}
        />
      </Card>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Entries found: {filtered.length}
      </Typography.Text>
      <Modal
        title={activeProduct?.title || activeProduct?.name || 'Product'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setActiveProduct(null);
        }}
        footer={null}
        width={900}
      >
        {activeProduct ? (
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {(activeProduct.images || []).map((img, idx) => (
              <div
                key={img.id || idx}
                style={{ border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}
              >
                <div
                  style={{
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fafafa',
                  }}
                >
                  <AntImage
                    src={img.thumb_url || img.url}
                    alt={`${activeProduct.title || 'Image'} ${idx + 1}`}
                    height={140}
                    width="auto"
                    preview
                    style={{
                      objectFit: 'contain',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  />
                </div>
                  <div style={{ padding: 6, fontSize: 12, color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Position: {img.position ?? idx + 1}</span>
                    <Space size={4}>
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        onClick={async () => {
                          const next = [...(activeProduct.images || [])];
                          if (idx === 0) return;
                          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                          const normalized = normalizeImages(next);
                          setActiveProduct({ ...activeProduct, images: normalized });
                          try {
                            await saveImages(normalized, deletedImageIds);
                            message.success('Images saved');
                          } catch (err: any) {
                            message.error(err?.message || 'Save failed');
                          }
                        }}
                      />
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        onClick={async () => {
                          const next = [...(activeProduct.images || [])];
                          if (idx === next.length - 1) return;
                          [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                          const normalized = normalizeImages(next);
                          setActiveProduct({ ...activeProduct, images: normalized });
                          try {
                            await saveImages(normalized, deletedImageIds);
                            message.success('Images saved');
                          } catch (err: any) {
                            message.error(err?.message || 'Save failed');
                          }
                        }}
                      />
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={async () => {
                          const remaining = (activeProduct.images || []).filter((_, i) => i !== idx);
                          const normalized = normalizeImages(remaining);
                          const delIds = img.id ? [...deletedImageIds, img.id] : deletedImageIds;
                          setDeletedImageIds(delIds);
                          setActiveProduct({ ...activeProduct, images: normalized });
                          try {
                            await saveImages(normalized, delIds);
                            message.success('Images saved');
                          } catch (err: any) {
                            message.error(err?.message || 'Save failed');
                          }
                        }}
                      />
                    </Space>
                  </div>
                </div>
              ))}
              {(!activeProduct.images || activeProduct.images.length === 0) && <Alert type="info" message="No images" showIcon />}
            </div>
            <Space size={8}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => hiddenInputRef.current?.click()}
              >
                Upload with Crop Ratio
              </Button>
              <input
                ref={hiddenInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleHiddenInputChange}
              />
            </Space>
          </Space>
        ) : null}
      </Modal>
      <Modal
        open={cropModalOpen}
        onCancel={closeCropModal}
        title="Crop Image"
        okText="Save"
        confirmLoading={uploading}
        onOk={handleUploadSubmit}
        width={800}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
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


