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
  Tag,
  message,
} from 'antd';
import { EditOutlined, PictureOutlined, SearchOutlined } from '@ant-design/icons';
import { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
  brand?: string;
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
  collections?: Array<{ id: string; title: string }>;
  info?: {
    tags?: string[] | string;
  };
  product_colors?: Array<{ id: string; url: string; name?: string; image_path?: string }>;
  [key: string]: any;
};

const normalizeUrl = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed?.publicUrl || parsed?.url || value;
  } catch {
    return value;
  }
};

const resolveImageUrl = (image?: ProductImage | null) => {
  if (!image) return null;
  const thumb = normalizeUrl(image.thumb_url);
  if (thumb) return thumb;
  return normalizeUrl(image.url) || image.url || null;
};

export default function ProductsListClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<Product[]>(products);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [brand, setBrand] = useState<string | undefined>(searchParams.get('brand') || undefined);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>(searchParams.get('collection') || undefined);
  const [collectionsList, setCollectionsList] = useState<{ id: string, title: string }[]>([]);

  useEffect(() => {
    setRows(products);
  }, [products]);

  useEffect(() => {
    // Fetch collections for autocomplete
    fetch('/api/admin/collections/search')
      .then(r => r.json())
      .then(data => {
        setCollectionsList(data.collections || []);
      })
      .catch(console.error);
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
  };

  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set(rows.map(p => p.brand).filter(Boolean))) as string[];
    return [{ label: 'All Brands', value: '__all__' }].concat(
      brands.sort().map(b => ({ label: b, value: b }))
    );
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      // Search in name, title, and tags
      const searchLower = search.toLowerCase();
      const name = (p.title || p.name || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags : [];
      const matchesSearch = !search ||
        name.includes(searchLower) ||
        tags.some(t => t.toLowerCase().includes(searchLower));

      // Filter by Brand
      const matchesBrand = !brand || p.brand === brand;

      // Filter by Collection
      const matchesCollection = !selectedCollectionId ||
        (p.collections || []).some(c => c.id === selectedCollectionId);

      return matchesSearch && matchesBrand && matchesCollection;
    });
  }, [rows, search, brand, selectedCollectionId]);

  const goToEditPage = (id: string) => {
    const qs = searchParams.toString();
    router.push(`/admin/products/${id}/edit${qs ? `?${qs}` : ''}`);
  };

  const goToEditImages = (id: string) => {
    const qs = searchParams.toString();
    router.push(`/admin/product-images/${id}/edit${qs ? `?${qs}` : ''}`);
  };

  const columns = [
    {
      title: <span style={{ fontSize: 11 }}>Img</span>,
      dataIndex: 'images',
      width: 100,
      render: (_: any, record: Product) => {
        const name = record.title || record.name || 'Untitled';
        const firstImage = record.images?.[0];
        const imgUrl = resolveImageUrl(firstImage);
        return imgUrl ? (
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
        <Typography.Link style={{ fontSize: 13, fontWeight: 500 }} onClick={() => goToEditPage(record.id)}>
          {record.title || record.name || 'Untitled'}
          {record.brand && (
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{record.brand}</div>
          )}
        </Typography.Link>
      ),
    },
    {
      title: <span style={{ fontSize: 11, fontWeight: 600 }}>Brand</span>,
      dataIndex: 'brand',
      width: 140,
      render: (_: any, record: Product) => (
        <Select
          defaultValue={record.brand}
          style={{ width: '100%', fontSize: 12 }}
          size="small"
          variant="borderless"
          className="hover:border hover:border-gray-300 rounded"
          onChange={async (newBrand) => {
            try {
              // Optimistic UI update
              const updated = rows.map(p => p.id === record.id ? { ...p, brand: newBrand } : p);
              setRows(updated);

              // API Update (Updating via full update endpoint might be heavy, but it's what we have)
              // Ideally patch, but we reuse update endpoint logic
              // We need to construct a partial 'product' object that the backend accepts
              // The backend /api/admin/products/update expects { product: ... }
              // And usually uses ID to find it.

              const res = await fetch('/api/admin/products/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  product: {
                    id: record.id,
                    info: { brand: newBrand }
                  }
                }),
              });

              if (!res.ok) throw new Error('Failed to update brand');
              message.success('Brand updated');
            } catch (err) {
              message.error('Failed to update brand');
              // Revert
              setRows(rows);
            }
          }}
          options={[
            { label: 'Slingshot', value: 'Slingshot' },
            { label: 'Ride Engine', value: 'Ride Engine' },
            { label: 'Other', value: 'Other' }
          ]}
        />
      ),
    },
    {
      title: <span style={{ fontSize: 11 }}>Collections</span>,
      dataIndex: 'collections',
      render: (_: any, record: Product) => {
        const collections = record.collections || [];
        if (!collections.length) return <Typography.Text style={textStyle}>—</Typography.Text>;

        // Show up to 2 collections
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {collections.slice(0, 2).map(c => (
              <Typography.Text key={c.id} style={{ fontSize: 11, color: '#666' }}>
                • {c.title}
              </Typography.Text>
            ))}
            {collections.length > 2 && (
              <Typography.Text style={{ fontSize: 10, color: '#999' }}>+{collections.length - 2} more</Typography.Text>
            )}
          </div>
        );
      },
    },
    {
      title: <span style={{ fontSize: 11 }}>Price</span>,
      dataIndex: 'variants',
      render: (_: any, record: Product) => {
        const variants = Array.isArray(record.variants) ? record.variants : [];
        const prices: number[] = [];
        variants.forEach((v) => {
          const maybe = [
            Number(v.price),
            Number(v.price_eur),
            v.price_eur_cents ? Number(v.price_eur_cents) / 100 : undefined,
            v.price_cents ? Number(v.price_cents) / 100 : undefined,
          ].find((n) => typeof n === 'number' && !Number.isNaN(n) && n > 0);
          if (typeof maybe === 'number') prices.push(maybe);
        });
        if (!prices.length) return '—';
        const min = Math.min(...prices);
        return <Typography.Text style={{ fontWeight: 600, fontSize: 12 }}>€{Math.round(min)}</Typography.Text>;
      },
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
      title: <span style={{ fontSize: 11 }}>Colors</span>,
      dataIndex: 'product_colors',
      render: (_: any, record: Product) => {
        const colors = record.product_colors || [];
        if (!colors.length) return <Typography.Text style={textStyle}>—</Typography.Text>;

        return (
          <div style={{ display: 'flex', gap: 4 }}>
            {colors.slice(0, 3).map((c: any) => (
              <div key={c.id} style={{ width: 44, height: 44, border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }} title={c.name}>
                <img src={c.url || '/placeholder.png'} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ))}
            {colors.length > 3 && (
              <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 6, fontSize: 11, color: '#999' }}>
                +{colors.length - 3}
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: <span style={{ fontSize: 11 }}>Tags</span>,
      dataIndex: 'tags',
      render: (_: any, record: Product) => {
        const tags = Array.isArray(record.tags) ? record.tags : [];
        if (!tags.length) return <Typography.Text style={textStyle}>—</Typography.Text>;
        // Show up to 3 tags
        return (
          <div style={{ maxWidth: 200 }}>
            {tags.slice(0, 3).map((t: string, idx: number) => (
              <span key={idx} style={tagStyle}>
                {t}
              </span>
            ))}
            {tags.length > 3 && <span style={{ fontSize: 10, color: '#999' }}>...</span>}
          </div>
        );
      },
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

  const updateUrl = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Products Manager
      </Typography.Title>

      <Card styles={{ body: { padding: 16 } }}>
        <Space wrap size={[16, 16]}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Search</span>
            <Input
              allowClear
              placeholder="Name or tag..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: 240 }}
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                updateUrl({ q: val });
              }}
              size="middle"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Brand</span>
            <Select
              allowClear
              placeholder="All Brands"
              options={brandOptions}
              style={{ width: 180 }}
              value={brand}
              onChange={(val) => {
                const newVal = val === '__all__' ? undefined : val || undefined;
                setBrand(newVal);
                updateUrl({ brand: newVal });
              }}
              size="middle"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>Collection</span>
            <Select
              allowClear
              showSearch
              placeholder="Search collections..."
              optionFilterProp="label"
              options={collectionsList.map(c => ({ label: c.title, value: c.id }))}
              style={{ width: 220 }}
              value={selectedCollectionId}
              onChange={(val) => {
                setSelectedCollectionId(val);
                updateUrl({ collection: val });
              }}
              size="middle"
            />
          </div>
        </Space>
      </Card>

      <Table<Product>
        rowKey={(row) => row.id}
        dataSource={filtered}
        columns={columns}
        pagination={{ pageSize: 15, size: 'default' }}
        size="middle"
        onRow={(record) => ({
          onClick: () => goToEditPage(record.id),
        })}
        scroll={{ x: 1200 }}
        style={{ background: 'white', borderRadius: 8, overflow: 'hidden' }}
      />

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Showing {filtered.length} of {rows.length} products
      </Typography.Text>
    </Space>
  );
}
