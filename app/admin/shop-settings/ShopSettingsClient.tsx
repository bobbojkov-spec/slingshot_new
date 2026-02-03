'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Input, Row, Space, Typography, Upload } from 'antd';
import HomepageCategoriesClient from '@/app/admin/homepage-categories/HomepageCategoriesClient';
import HomepageKeywordsClient from '@/app/admin/homepage-keywords/HomepageKeywordsClient';

type Collection = {
    id: string;
    title: string;
    slug: string;
    source: string;
    subtitle?: string;
};

type Tag = {
    name_en: string;
    name_bg: string | null;
    slug: string;
    count: number;
};

type Brand = {
    id?: number;
    name: string;
    slug: string;
    logo_url: string | null;
    logo_url_signed?: string | null;
    sort_order?: number;
};

type FeaturedProduct = {
    id: string;
    name: string;
    slug: string;
    thumbnail_url: string | null;
};

type Props = {
    allCollections: Collection[];
    initialSelectedCollectionIds: string[];
    allTags: Tag[];
    initialSelectedTagNames: string[];
    initialBrands: Brand[];
    featuredProducts: FeaturedProduct[];
    featuredCollectionId: string | null;
};

const DEFAULT_BRANDS: Brand[] = [
    { name: 'Slingshot', slug: 'slingshot', logo_url: null },
    { name: 'Ride Engine', slug: 'ride-engine', logo_url: null },
];

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

export default function ShopSettingsClient({
    allCollections,
    initialSelectedCollectionIds,
    allTags,
    initialSelectedTagNames,
    initialBrands,
    featuredProducts,
    featuredCollectionId,
}: Props) {
    const router = useRouter();
    const [brands, setBrands] = useState<Brand[]>(
        initialBrands.length ? initialBrands : DEFAULT_BRANDS
    );
    const [savingBrands, setSavingBrands] = useState(false);

    const featuredUrl = featuredCollectionId
        ? `/admin/collections-homepage/featured-products`
        : '/admin/collections-homepage';

    const refreshSignedUrls = async (items: Brand[]) => {
        return Promise.all(
            items.map(async (brand) => {
                if (!brand.logo_url) return { ...brand, logo_url_signed: null };
                try {
                    const res = await fetch(`/api/admin/sign-url?path=${encodeURIComponent(brand.logo_url)}`);
                    if (!res.ok) return { ...brand, logo_url_signed: null };
                    const data = await res.json();
                    return { ...brand, logo_url_signed: data.url || null };
                } catch (error) {
                    return { ...brand, logo_url_signed: null };
                }
            })
        );
    };

    const handleBrandChange = (index: number, updates: Partial<Brand>) => {
        setBrands((prev) =>
            prev.map((brand, idx) =>
                idx === index
                    ? {
                        ...brand,
                        ...updates,
                        slug: updates.name ? slugify(updates.name) : brand.slug,
                    }
                    : brand
            )
        );
    };

    const handleUploadLogo = async (index: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'shop-brands');

        const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        let signedUrl: string | null = null;
        try {
            const signRes = await fetch(`/api/admin/sign-url?path=${encodeURIComponent(data.url)}`);
            if (signRes.ok) {
                const signData = await signRes.json();
                signedUrl = signData.url || null;
            }
        } catch (error) {
            signedUrl = null;
        }

        handleBrandChange(index, { logo_url: data.url, logo_url_signed: signedUrl });
    };

    const saveBrands = async () => {
        setSavingBrands(true);
        try {
            const res = await fetch('/api/admin/shop-brands', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brands: brands.map((brand, idx) => ({
                        name: brand.name,
                        slug: brand.slug || slugify(brand.name),
                        logo_url: brand.logo_url,
                        sort_order: idx,
                    })),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save brands');
            }
            const updated = await refreshSignedUrls(brands);
            setBrands(updated);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Failed to save brands');
        } finally {
            setSavingBrands(false);
        }
    };

    const brandCards = useMemo(() => {
        return brands.map((brand, index) => (
            <Card key={brand.slug || index} size="small" style={{ height: '100%' }}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Input
                        value={brand.name}
                        placeholder="Brand name"
                        onChange={(e) => handleBrandChange(index, { name: e.target.value })}
                    />
                    <Input
                        value={brand.slug}
                        placeholder="brand-slug"
                        onChange={(e) => handleBrandChange(index, { slug: e.target.value })}
                    />
                    <div>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                            Logo
                        </Typography.Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {brand.logo_url_signed || brand.logo_url ? (
                                <img
                                    src={brand.logo_url_signed || brand.logo_url || ''}
                                    alt={`${brand.name} logo`}
                                    style={{ width: 120, height: 80, objectFit: 'contain', border: '1px solid #eee', borderRadius: 8 }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: 120,
                                        height: 80,
                                        border: '1px dashed #ccc',
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#999',
                                        fontSize: 12,
                                    }}
                                >
                                    No logo
                                </div>
                            )}
                            <Upload
                                showUploadList={false}
                                accept="image/*"
                                beforeUpload={(file) => {
                                    handleUploadLogo(index, file as File).catch((err) =>
                                        alert(err.message || 'Upload failed')
                                    );
                                    return false;
                                }}
                            >
                                <Button icon={<UploadOutlined />}>Upload</Button>
                            </Upload>
                        </div>
                    </div>
                </Space>
            </Card>
        ));
    }, [brands]);

    return (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
                <Typography.Title level={2} style={{ marginBottom: 4 }}>
                    Shop Settings
                </Typography.Title>
                <Typography.Text type="secondary">
                    Manage brand logos, top collections, top keywords, and featured products for the Shop overview.
                </Typography.Text>
            </div>

            <Card
                title="Brands"
                extra={
                    <Button type="primary" loading={savingBrands} onClick={saveBrands}>
                        Save Brands
                    </Button>
                }
            >
                <Row gutter={[16, 16]}>
                    {brandCards.map((card, index) => (
                        <Col xs={24} md={12} key={index}>
                            {card}
                        </Col>
                    ))}
                </Row>
            </Card>

            <Divider />

            <Card title="Filter Top Collections">
                <HomepageCategoriesClient
                    allCollections={allCollections}
                    initialSelectedIds={initialSelectedCollectionIds}
                />
            </Card>

            <Divider />

            <Card title="Filter Top Keywords">
                <HomepageKeywordsClient
                    allTags={allTags}
                    initialSelectedNames={initialSelectedTagNames}
                />
            </Card>

            <Divider />

            <Card
                title="Featured Products"
                extra={
                    <Link href={featuredUrl} style={{ fontSize: 13 }}>
                        Manage featured products
                    </Link>
                }
            >
                {featuredProducts.length === 0 ? (
                    <Typography.Text type="secondary">
                        No products found in featured-products collection.
                    </Typography.Text>
                ) : (
                    <Row gutter={[16, 16]}>
                        {featuredProducts.map((product) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                <Card size="small">
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        {product.thumbnail_url ? (
                                            <img
                                                src={product.thumbnail_url}
                                                alt={product.name}
                                                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: 64,
                                                    height: 64,
                                                    borderRadius: 8,
                                                    background: '#f5f5f5',
                                                }}
                                            />
                                        )}
                                        <div>
                                            <Typography.Text strong>{product.name}</Typography.Text>
                                            <div>
                                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                    {product.slug}
                                                </Typography.Text>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Card>
        </Space>
    );
}