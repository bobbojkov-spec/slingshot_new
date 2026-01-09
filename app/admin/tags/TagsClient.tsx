
'use client';

import React, { useEffect, useState } from 'react';
import { Table, Input, Button, message, Space, Card, Typography } from 'antd';
import { SaveOutlined, SearchOutlined } from '@ant-design/icons';

interface TagData {
    en: string;
    bg: string;
    count: number;
}

export default function TagsClient() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TagData[]>([]);
    const [searchText, setSearchText] = useState('');
    const [savingKey, setSavingKey] = useState<string | null>(null);

    // Track local edits: map of EN tag -> new BG value
    const [edits, setEdits] = useState<Record<string, string>>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tags');
            const json = await res.json();
            if (json.tags) {
                setData(json.tags);
            }
        } catch (error) {
            message.error('Failed to load tags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (record: TagData) => {
        const newVal = edits[record.en];
        if (newVal === undefined || newVal === record.bg) {
            // no change
            return;
        }

        setSavingKey(record.en);
        try {
            const res = await fetch('/api/admin/tags/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldTagEn: record.en, newTagBg: newVal }),
            });
            const json = await res.json();

            if (json.success) {
                message.success(`Updated ${json.updatedCount} products`);
                // Refresh local data to confirm or just update state
                // Let's update state to remove pending edit status
                setData(prev => prev.map(item => item.en === record.en ? { ...item, bg: newVal } : item));
                const newEdits = { ...edits };
                delete newEdits[record.en];
                setEdits(newEdits);
            } else {
                message.error(json.error || 'Update failed');
            }
        } catch (err) {
            message.error('Error saving tag');
        } finally {
            setSavingKey(null);
        }
    };

    const columns = [
        {
            title: 'English Tag',
            dataIndex: 'en',
            key: 'en',
            width: '30%',
            sorter: (a: TagData, b: TagData) => a.en.localeCompare(b.en),
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Search EN tag"
                        value={selectedKeys[0]}
                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                </div>
            ),
            onFilter: (value: any, record: TagData) =>
                record.en.toLowerCase().includes(value.toLowerCase()),
        },
        {
            title: 'Bulgarian Translation',
            dataIndex: 'bg',
            key: 'bg',
            width: '40%',
            render: (text: string, record: TagData) => {
                const value = edits[record.en] !== undefined ? edits[record.en] : text;
                const isModified = edits[record.en] !== undefined && edits[record.en] !== record.bg;

                return (
                    <Space.Compact style={{ width: '100%' }}>
                        <Input
                            value={value}
                            onChange={(e) => setEdits({ ...edits, [record.en]: e.target.value })}
                            onPressEnter={() => handleSave(record)}
                            style={{ backgroundColor: isModified ? '#fffbe6' : undefined }}
                        />
                        <Button
                            type={isModified ? 'primary' : 'default'}
                            icon={<SaveOutlined />}
                            loading={savingKey === record.en}
                            onClick={() => handleSave(record)}
                            disabled={!isModified}
                        />
                    </Space.Compact>
                );
            }
        },
        {
            title: 'Usage Count',
            dataIndex: 'count',
            key: 'count',
            width: '15%',
            sorter: (a: TagData, b: TagData) => a.count - b.count,
        }
    ];

    const filteredData = data.filter(d =>
        d.en.toLowerCase().includes(searchText.toLowerCase()) ||
        (d.bg && d.bg.toLowerCase().includes(searchText.toLowerCase()))
    );

    return (
        <div style={{ padding: 24 }}>
            <Typography.Title level={2}>Tag Translations</Typography.Title>
            <Input
                placeholder="Search tags..."
                prefix={<SearchOutlined />}
                style={{ marginBottom: 16, maxWidth: 400 }}
                onChange={e => setSearchText(e.target.value)}
            />
            <Card>
                <Table
                    loading={loading}
                    dataSource={filteredData}
                    columns={columns}
                    rowKey="en"
                    pagination={{ pageSize: 50 }}
                />
            </Card>
        </div>
    );
}
