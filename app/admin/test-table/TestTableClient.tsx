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
  Upload,
  message,
} from 'antd';
import { EditOutlined, PictureOutlined, InboxOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Product = {
  id: string;
  title?: string;
  name?: string;
  images?: { url: string; position?: number; id?: string }[];
  imageCount?: number;
  product_type?: string;
  productType?: string;
  variants?: any[];
  status?: string;
  availability?: string;
  updated_at?: string;
  created_at?: string;
  category?: { name?: string } | string;
};

export default function TestTableClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<Product[]>(products);
  const totalProducts = products.length;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [availability, setAvailability] = useState<string | undefined>(undefined);
  const [productType, setProductType] = useState<string | undefined>(undefined);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [aspect, setAspect] = useState<string>('original');

  useEffect(() => {
    setRows(products);
  }, [products]);

  // Sync initial state from URL on mount to avoid SSR/client mismatch
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

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (category) params.set('category', category);
    if (availability) params.set('availability', availability);
    if (productType) params.set('type', productType);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [search, category, availability, productType, pathname, router]);

  const noProducts = !rows || rows.length === 0;

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
    [products]
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

  const computeCropBox = async (file: File, targetAspect: string) => {
    return new Promise<{ cropX: number; cropY: number; cropW: number; cropH: number } | null>((resolve) => {
      const ImgCtor = typeof window !== 'undefined' ? window.Image : undefined;
      if (!ImgCtor) {
        resolve(null);
        return;
      }
      const img = new ImgCtor();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h || targetAspect === 'original') {
          resolve(null);
          return;
        }
        const [aW, aH] = targetAspect.split(':').map((n) => Number(n));
        if (!aW || !aH) {
          resolve(null);
          return;
        }
        const desired = aW / aH;
        let cropW = w;
        let cropH = Math.round(w / desired);
        if (cropH > h) {
          cropH = h;
          cropW = Math.round(h * desired);
        }
        const cropX = Math.floor((w - cropW) / 2);
        const cropY = Math.floor((h - cropH) / 2);
        resolve({ cropX, cropY, cropW, cropH });
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
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
    // sync back to rows
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
      render: (_v: any, record: Product) => {
        const name = record.title || record.name || 'Untitled';
        const url = record.images?.[0]?.url;
        return url ? (
          <AntImage
            src={url}
            alt={name}
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='10'%3ENo image%3C/text%3E%3C/svg%3E"
          />
        ) : (
          <div style={{ width: 80, height: 80, background: '#f5f5f5', borderRadius: 4 }} />
        );
      },
    },
    {
      title: <span style={{ fontSize: 11, fontWeight: 600 }}>Name</span>,
      dataIndex: 'title',
      render: (_v: any, record: Product) => (
        <Typography.Link style={{ fontSize: 13 }} onClick={() => goToEditPage(record.id)}>
          {record.title || record.name || 'Untitled'}
        </Typography.Link>
      ),
    },
    {
      title: <span style={{ fontSize: 11 }}>Type</span>,
      dataIndex: 'product_type',
      render: (_v: any, record: Product) => (
        <Typography.Text style={textStyle}>{record.product_type || record.productType || '—'}</Typography.Text>
      ),
    },
    {
      title: <span style={{ fontSize: 11 }}>Price</span>,
      dataIndex: 'variants',
      render: (_v: any, record: Product) => {
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
        if (!prices.length) return <Typography.Text style={textStyle}>—</Typography.Text>;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return (
          <Typography.Text style={textStyle}>
            {min === max ? `€${Math.round(min)}` : `€${Math.round(min)} / €${Math.round(max)}`}
          </Typography.Text>
        );
      },
    },
    {
      title: <span style={{ fontSize: 11 }}>Variants</span>,
      dataIndex: 'variants',
      render: (_v: any, record: Product) => {
        const variants = Array.isArray(record.variants) ? record.variants : [];
        return <Typography.Text style={textStyle}>{variants.length}</Typography.Text>;
      },
    },
    {
      title: <span style={{ fontSize: 11 }}>Available</span>,
      dataIndex: 'availability',
      render: (_v: any, record: Product) => {
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
      render: (_v: any, record: Product) => (
        <Typography.Text style={textStyle}>{record.imageCount ?? (record.images?.length || 0)}</Typography.Text>
      ),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: (_v: any, record: Product) => {
        const tags = Array.isArray((record as any).tags) ? (record as any).tags : [];
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
      render: (_v: any, record: Product) => <Typography.Text style={textStyle}>{record.status || '—'}</Typography.Text>,
    },
    {
      title: <span style={{ fontSize: 11 }}>Updated</span>,
      dataIndex: 'updated_at',
      render: (_v: any, record: Product) => {
        const val = record.updated_at || record.created_at;
        if (!val) return '—';
        const d = new Date(val);
        if (isNaN(d.getTime())) return '—';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return <Typography.Text style={textStyle}>{`${dd}-${mm}-${yy}`}</Typography.Text>;
      },
    },
    {
      title: '',
      dataIndex: 'edit',
      width: 90,
      fixed: 'right' as const,
      render: (_v: any, record: Product) => (
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
        Entries found: {totalProducts}
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
                <div key={img.id || idx} style={{ border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
                  <AntImage
                    src={img.url}
                    alt={`${activeProduct.title || 'Image'} ${idx + 1}`}
                    width="100%"
                    height={140}
                    style={{ objectFit: 'cover' }}
                    preview
                  />
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
              <Select
                size="small"
                value={aspect}
                style={{ width: 160 }}
                onChange={(val) => setAspect(val)}
                options={[
                  { label: 'Aspect: Original', value: 'original' },
                  { label: 'Aspect: 1:1', value: '1:1' },
                  { label: 'Aspect: 4:3', value: '4:3' },
                  { label: 'Aspect: 3:4', value: '3:4' },
                  { label: 'Aspect: 16:9', value: '16:9' },
                  { label: 'Aspect: 9:16', value: '9:16' },
                ]}
              />
              <Upload
                multiple
                showUploadList={false}
                customRequest={async ({ file, onSuccess, onError }) => {
                  if (!activeProduct?.id) {
                    onError?.(new Error('No product'));
                    return;
                  }
                  try {
                    const crop = await computeCropBox(file as File, aspect);
                    const form = new FormData();
                    form.append('file', file as Blob);
                    form.append('productId', activeProduct.id);
                    form.append('position', String((activeProduct.images?.length || 0) + 1));
                    if (crop) {
                      form.append('cropX', String(crop.cropX));
                      form.append('cropY', String(crop.cropY));
                      form.append('cropW', String(crop.cropW));
                      form.append('cropH', String(crop.cropH));
                    }
                    const res = await fetch('/api/admin/products/images', {
                      method: 'POST',
                      body: form,
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body?.error || 'Upload failed');
                    const newImg = body.image;
                    const next = normalizeImages([...(activeProduct.images || []), newImg]);
                    setActiveProduct({ ...activeProduct, images: next });
                    await saveImages(next, deletedImageIds);
                    message.success('Image uploaded and saved');
                    onSuccess?.(body, file as any);
                  } catch (err: any) {
                    onError?.(err);
                    message.error(err?.message || 'Upload failed');
                  }
                }}
              >
                <Button icon={<InboxOutlined />}>Upload image</Button>
              </Upload>
            </Space>
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}

