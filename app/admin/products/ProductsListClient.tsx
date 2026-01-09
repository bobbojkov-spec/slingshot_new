'use client';

import {
  Button,
  Image as AntImage,
  Input,
  Select,
  Space,
  Table,
  Typography,
  Card,
  Divider,
} from 'antd';
import { EditOutlined, PictureOutlined } from '@ant-design/icons';
import { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSignedImages } from '@/hooks/useSignedImages';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type ProductImage = {
  id?: string;
  url?: string;
  thumb_url?: string;
  medium_url?: string;
  position?: number;
};

type Product = {
  id: string;
  title?: string;
  name?: string;
  handle?: string;
  tags?: string[];
  images?: ProductImage[];
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

const normalizeUrl = (value: string | null | undefined) => {
  if (!value) return null;
  // If we already have a full URL (e.g. from a previous legacy logic), use it
  if (value.startsWith('http')) return value;

  try {
    const parsed = JSON.parse(value);
    // If parsed object has publicUrl which is a full URL
    if (parsed?.publicUrl?.startsWith('http')) return parsed.publicUrl;
    // Otherwise return the path (which might be in publicUrl, url, or the value itself)
    return parsed?.publicUrl || parsed?.url || value;
  } catch {
    return value;
  }
};

const resolveImagePath = (image?: ProductImage | null) => {
  if (!image) return null;
  const thumb = normalizeUrl(image.thumb_url);
  if (thumb) return thumb;
  return normalizeUrl(image.url) || image.url || null;
};

// Component to render signed image
const SignedProductImage = ({ path, name }: { path: string; name: string }) => {
  const { getUrl, loading } = useSignedImages([path]);
  const url = getUrl(path);

  if (loading) {
    return (
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
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
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
        src={url || ''}
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
  );
};

export default function ProductsListClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Prepare paths for bulk signing (optional optimization, but we can do per-row for simplicity as hook batches effectively or we can hoist)
  // Since pagination is small (10), per-component hook usage is acceptable, but let's do hoisting for best perf if easy.
  // Actually, the hook useSignedImages takes an array. If we use it inside a Row component, it'll fire 10 requests. 
  // Better to use it at the top level for the visible rows.

  const [rows, setRows] = useState<Product[]>(products);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [availability, setAvailability] = useState<string | undefined>(undefined);
  const [productType, setProductType] = useState<string | undefined>(undefined);

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

  const textStyle = { fontSize: 12 };
  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 10,
    padding: '2px 6px',
    background: '#f0f2f5',
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
    marginTop: 4,
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

  // Filter logic...
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

  // NOTE: Simple pagination is handled by Table but we only have "filtered" as the full list.
  // Ideally, we'd sign images for the current page only.
  // The Table component handles pagination internally, so we don't easily know which rows are visible without controlling pagination state.
  // However, `useSignedImages` with all ~100 product images might be heavy if list is huge. 
  // But for now, let's inject a wrapper component into the columns that handles signing for itself.
  // This is slightly less efficient network-wise (N requests instead of 1 batch) but much simpler to integrate with Antd Table.
  // Actually, wait, `useSignedImages` inside `render` of a Table column is tricky because `render` function isn't a component/hook context.
  // We MUST wrap the image in a component that calls the hook.

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

  const goToEditImages = (id: string) => {
    router.push(`/admin/product-images/${id}/edit${queryString}`);
  };

  const columns = [
    {
      title: <span style={{ fontSize: 11 }}>Img</span>,
      dataIndex: 'images',
      width: 100,
      render: (_: any, record: Product) => {
        const name = record.title || record.name || 'Untitled';
        const firstImage = record.images?.[0];
        const imgPath = resolveImagePath(firstImage);

        return imgPath ? (
          <SignedProductImage path={imgPath} name={name} />
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
              goToEditImages(record.id);
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
          scroll={{ x: 1200 }}
        />
      </Card>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Entries found: {filtered.length}
      </Typography.Text>
    </Space>
  );
}

