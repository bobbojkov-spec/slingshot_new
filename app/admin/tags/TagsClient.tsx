
'use client';

import React, { useEffect, useState } from 'react';
import { Table, Input, Button, message, Space, Card, Typography } from 'antd';
import { SaveOutlined, SearchOutlined, DeleteOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import TagProductSelector from '@/components/admin/TagProductSelector';
const { Modal } = require('antd'); // Using require to avoid potential import issues with some antd setups if they arise, or just standard import

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
    const [manageTag, setManageTag] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState('');

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

    const handleDelete = (tagEn: string) => {
        Modal.confirm({
            title: 'Delete Tag',
            content: `Are you sure you want to delete the tag "${tagEn}"? This will remove it from the master list and ALL products.`,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    // Updated to use the single route with action
                    const res = await fetch('/api/admin/tags', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete', name_en: tagEn }),
                    });
                    if (res.ok) {
                        message.success('Tag deleted successfully');
                        fetchData();
                    } else {
                        message.error('Failed to delete tag');
                    }
                } catch (err) {
                    message.error('Error deleting tag');
                }
            }
        });
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;
        const exists = data.find(d => d.en.toLowerCase() === newTagName.trim().toLowerCase());
        if (exists) {
            message.warning('Tag already exists');
            return;
        }

        try {
            const res = await fetch('/api/admin/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    name_en: newTagName.trim(),
                    name_bg: ''
                }),
            });

            if (res.ok) {
                message.success('Tag created successfully');
                setNewTagName('');
                fetchData();
            } else {
                message.error('Failed to create tag');
            }
        } catch (e) {
            message.error('Error creating tag');
        }
    };

    const columns = [
        {
            title: 'English Tag',
            dataIndex: 'en',
            key: 'en',
            width: '25%',
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
            width: '35%',
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
            title: 'Usage',
            dataIndex: 'count',
            key: 'count',
            width: '10%',
            sorter: (a: TagData, b: TagData) => a.count - b.count,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '30%',
            render: (_: any, record: TagData) => (
                <Space>
                    <Button
                        type="primary"
                        ghost
                        icon={<SettingOutlined />}
                        onClick={() => setManageTag(record.en)}
                    >
                        Manage Products
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.en)}
                    />
                </Space>
            )
        }
    ];

    const filteredData = data.filter(d =>
        d.en.toLowerCase().includes(searchText.toLowerCase()) ||
        (d.bg && d.bg.toLowerCase().includes(searchText.toLowerCase()))
    );

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Typography.Title level={2} style={{ margin: 0 }}>Tag Management</Typography.Title>
                <Space>
                    <Input
                        placeholder="New tag name..."
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        onPressEnter={handleAddTag}
                        style={{ width: 200 }}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag}>Add Tag</Button>
                </Space>
            </div>

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

            {manageTag && (
                <TagProductSelector
                    tagEn={manageTag}
                    onClose={() => setManageTag(null)}
                    onSave={() => fetchData()}
                />
            )}
        </div>
    );
}
