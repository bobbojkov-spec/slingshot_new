'use client';

import { useState } from 'react';
import { Card, Button, Typography, Space, Table, Tag, message, Alert, Select } from 'antd';
import { TranslationOutlined, SyncOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ProductMissing {
    id: string;
    name: string;
    brand: string;
    missing: {
        specs_html: boolean;
        description_html: boolean;
        description_html2: boolean;
        package_includes: boolean;
    };
}

interface TranslationResult {
    id: string;
    name: string;
    translated: string[];
}

export default function TranslationsPage() {
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [products, setProducts] = useState<ProductMissing[]>([]);
    const [results, setResults] = useState<TranslationResult[]>([]);
    const [brandFilter, setBrandFilter] = useState<string>('all');

    const handleScan = async () => {
        setScanning(true);
        try {
            const res = await fetch(`/api/admin/translations/rideengine-specs?brand=${brandFilter}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setProducts(data.products || []);
            message.success(`Found ${data.count} products needing translation`);
        } catch (error: any) {
            message.error(error.message || 'Scan failed');
        } finally {
            setScanning(false);
        }
    };

    const handleTranslate = async (limit: number = 10) => {
        setLoading(true);
        setResults([]);
        try {
            const res = await fetch('/api/admin/translations/rideengine-specs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit, brand: brandFilter }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResults(data.results || []);
            message.success(`Translated ${data.processed} products`);
            // Refresh the scan
            handleScan();
        } catch (error: any) {
            message.error(error.message || 'Translation failed');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Product',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: ProductMissing) => (
                <a href={`/admin/products/${record.id}/edit`} target="_blank">{name}</a>
            ),
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
        },
        {
            title: 'Missing Translations',
            key: 'missing',
            render: (_: any, record: ProductMissing) => (
                <Space wrap>
                    {record.missing.specs_html && <Tag color="red">specs_html</Tag>}
                    {record.missing.description_html && <Tag color="orange">description_html</Tag>}
                    {record.missing.description_html2 && <Tag color="gold">description_html2</Tag>}
                    {record.missing.package_includes && <Tag color="purple">package_includes</Tag>}
                </Space>
            ),
        },
    ];

    const resultColumns = [
        {
            title: 'Product',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Translated Fields',
            dataIndex: 'translated',
            key: 'translated',
            render: (fields: string[]) => (
                <Space wrap>
                    {fields.map((field, idx) => (
                        <Tag key={idx} color="green" icon={<CheckCircleOutlined />}>{field}</Tag>
                    ))}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>
                <TranslationOutlined /> Bulk Translations
            </Title>
            <Text type="secondary">
                Automatically translate product content from English to Bulgarian using AI.
            </Text>

            <Card style={{ marginTop: 24 }}>
                <Title level={4}>Products - Missing Bulgarian Translations</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Find and translate specs, descriptions, and package includes for products.
                </Text>

                <Space style={{ marginBottom: 16 }} wrap>
                    <Select
                        value={brandFilter}
                        onChange={setBrandFilter}
                        style={{ width: 200 }}
                        options={[
                            { value: 'all', label: 'All Brands' },
                            { value: 'ride-engine', label: 'Ride Engine' },
                            { value: 'slingshot', label: 'Slingshot' },
                        ]}
                    />
                    <Button
                        type="default"
                        icon={<SyncOutlined spin={scanning} />}
                        onClick={handleScan}
                        loading={scanning}
                    >
                        Scan for Missing Translations
                    </Button>
                    <Button
                        type="primary"
                        icon={<TranslationOutlined />}
                        onClick={() => handleTranslate(10)}
                        loading={loading}
                        disabled={products.length === 0}
                    >
                        Translate Next 10
                    </Button>
                    <Button
                        type="primary"
                        ghost
                        onClick={() => handleTranslate(50)}
                        loading={loading}
                        disabled={products.length === 0}
                    >
                        Translate Next 50
                    </Button>
                </Space>

                {products.length > 0 && (
                    <Alert
                        message={`Found ${products.length} products with missing Bulgarian translations`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Table
                    dataSource={products}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                    size="small"
                />
            </Card>

            {results.length > 0 && (
                <Card style={{ marginTop: 24 }}>
                    <Title level={4}>Translation Results</Title>
                    <Table
                        dataSource={results}
                        columns={resultColumns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                    />
                </Card>
            )}
        </div>
    );
}
