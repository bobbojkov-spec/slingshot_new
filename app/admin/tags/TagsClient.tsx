
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Table, Input, Button, message, Space, Card, Typography, Badge, Tooltip, Modal, Select } from 'antd';
import { SaveOutlined, SearchOutlined, DeleteOutlined, PlusOutlined, SettingOutlined, SyncOutlined, MergeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import TagProductSelector from '@/components/admin/TagProductSelector';
const { Option } = Select;

interface TagData {
    en: string;
    bg: string;
    count: number;
    slug: string;
    inMasterTable: boolean;
}

interface TagStats {
    totalCount: number;
    masterCount: number;
    productOnlyCount: number;
}

export default function TagsClient() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateUrl = (newParams: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newParams).forEach(([key, val]) => {
            if (val) params.set(key, val);
            else params.delete(key);
        });
        router.replace(`${pathname}?${params.toString()}`);
    };

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TagData[]>([]);
    const [stats, setStats] = useState<TagStats | null>(null);
    const [searchText, setSearchText] = useState(searchParams.get('q') || '');
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [manageTag, setManageTag] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [mergeModalVisible, setMergeModalVisible] = useState(false);
    const [sourceTagForMerge, setSourceTagForMerge] = useState<string>('');
    const [targetTagForMerge, setTargetTagForMerge] = useState<string>('');

    // Track local edits: map of OLD EN tag -> { en: newEn, bg: newBg }
    const [edits, setEdits] = useState<Record<string, { en?: string, bg?: string }>>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tags');
            const json = await res.json();
            if (json.tags) {
                setData(json.tags);
                setStats({
                    totalCount: json.totalCount,
                    masterCount: json.masterCount,
                    productOnlyCount: json.productOnlyCount
                });
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

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/admin/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync' }),
            });
            const json = await res.json();

            if (json.success) {
                message.success(json.message);
                fetchData();
            } else {
                message.error(json.error || 'Sync failed');
            }
        } catch (err) {
            message.error('Error syncing tags');
        } finally {
            setSyncing(false);
        }
    };

    const handleSave = async (record: TagData) => {
        const localEdit = edits[record.en];
        if (!localEdit) return;

        const newEn = localEdit.en !== undefined ? localEdit.en : record.en;
        const newBg = localEdit.bg !== undefined ? localEdit.bg : record.bg;

        if (newEn === record.en && newBg === record.bg) {
            return;
        }

        setSavingKey(record.en);
        try {
            const res = await fetch('/api/admin/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldTagEn: record.en,
                    newTagEn: newEn !== record.en ? newEn : undefined,
                    newTagBg: newBg
                }),
            });
            const json = await res.json();

            if (json.success) {
                message.success(`Updated ${json.updatedCount || 0} products`);
                setData(prev => prev.map(item => item.en === record.en ? { ...item, en: newEn, bg: newBg, inMasterTable: true } : item));
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

    const handleMerge = async () => {
        if (!sourceTagForMerge || !targetTagForMerge) {
            message.error('Please select both source and target tags');
            return;
        }
        if (sourceTagForMerge === targetTagForMerge) {
            message.error('Source and target cannot be the same');
            return;
        }

        try {
            const res = await fetch('/api/admin/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'merge',
                    sourceTag: sourceTagForMerge,
                    targetTag: targetTagForMerge
                }),
            });
            const json = await res.json();

            if (json.success) {
                message.success(json.message);
                setMergeModalVisible(false);
                setSourceTagForMerge('');
                setTargetTagForMerge('');
                fetchData();
            } else {
                message.error(json.error || 'Merge failed');
            }
        } catch (err) {
            message.error('Error merging tags');
        }
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
            title: 'Status',
            key: 'status',
            width: '10%',
            render: (_: any, record: TagData) => (
                record.inMasterTable ?
                    <Badge status="success" text="Synced" /> :
                    <Tooltip title="This tag exists in products but not in master table. Click Sync to add it.">
                        <Badge status="warning" text={<span style={{ color: '#fa8c16' }}>Unsynced <InfoCircleOutlined /></span>} />
                    </Tooltip>
            ),
            filters: [
                { text: 'Synced', value: true },
                { text: 'Unsynced', value: false },
            ],
            onFilter: (value: any, record: TagData) => record.inMasterTable === value,
        },
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
            render: (text: string, record: TagData) => {
                const value = edits[record.en]?.en !== undefined ? edits[record.en].en : text;
                const isModified = edits[record.en]?.en !== undefined && edits[record.en].en !== record.en;

                return (
                    <Input
                        value={value}
                        onChange={(e) => setEdits({ ...edits, [record.en]: { ...edits[record.en], en: e.target.value } })}
                        onPressEnter={() => handleSave(record)}
                        style={{ backgroundColor: isModified ? '#fffbe6' : undefined, fontWeight: isModified ? 'bold' : 'normal' }}
                    />
                );
            }
        },
        {
            title: 'Bulgarian Translation',
            dataIndex: 'bg',
            key: 'bg',
            width: '25%',
            render: (text: string, record: TagData) => {
                const value = edits[record.en]?.bg !== undefined ? edits[record.en].bg : text;
                const isModifiedEn = edits[record.en]?.en !== undefined && edits[record.en].en !== record.en;
                const isModifiedBg = edits[record.en]?.bg !== undefined && edits[record.en].bg !== record.bg;
                const isModified = isModifiedEn || isModifiedBg;

                return (
                    <Space.Compact style={{ width: '100%' }}>
                        <Input
                            value={value}
                            onChange={(e) => setEdits({ ...edits, [record.en]: { ...edits[record.en], bg: e.target.value } })}
                            onPressEnter={() => handleSave(record)}
                            style={{ backgroundColor: isModifiedBg ? '#fffbe6' : undefined }}
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
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            width: '15%',
            render: (slug: string) => (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {slug || '-'}
                </Typography.Text>
            )
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
            width: '15%',
            render: (_: any, record: TagData) => (
                <Space>
                    <Button
                        type="primary"
                        ghost
                        icon={<SettingOutlined />}
                        onClick={() => setManageTag(record.en)}
                        size="small"
                    >
                        Products
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.en)}
                        size="small"
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
                <div>
                    <Typography.Title level={2} style={{ margin: 0 }}>Tag Management</Typography.Title>
                    {stats && (
                        <Space size="large" style={{ marginTop: 8 }}>
                            <Typography.Text type="secondary">
                                Total: <strong>{stats.totalCount}</strong>
                            </Typography.Text>
                            <Typography.Text type="secondary">
                                Synced: <strong style={{ color: '#52c41a' }}>{stats.masterCount}</strong>
                            </Typography.Text>
                            {stats.productOnlyCount > 0 && (
                                <Typography.Text type="secondary">
                                    Unsynced: <strong style={{ color: '#fa8c16' }}>{stats.productOnlyCount}</strong>
                                </Typography.Text>
                            )}
                        </Space>
                    )}
                </div>
                <Space>
                    <Button
                        icon={<MergeOutlined />}
                        onClick={() => setMergeModalVisible(true)}
                    >
                        Merge Tags
                    </Button>
                    <Button
                        type="primary"
                        icon={<SyncOutlined spin={syncing} />}
                        onClick={handleSync}
                        loading={syncing}
                    >
                        Sync to Master Table
                    </Button>
                </Space>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Typography.Text type="secondary">
                        <InfoCircleOutlined /> Tags marked as "Unsynced" exist in products but are not yet in the master table.
                        Click "Sync to Master Table" to add them, or edit them to add Bulgarian translations.
                    </Typography.Text>
                </Space>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Input
                    placeholder="Search tags..."
                    prefix={<SearchOutlined />}
                    style={{ maxWidth: 400 }}
                    onChange={e => { setSearchText(e.target.value); updateUrl({ q: e.target.value || undefined }); }}
                />
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

            <Card>
                <Table
                    loading={loading}
                    dataSource={filteredData}
                    columns={columns}
                    rowKey="en"
                    pagination={{ pageSize: 50 }}
                    rowClassName={(record) => !record.inMasterTable ? 'unsynced-row' : ''}
                />
            </Card>

            {manageTag && (
                <TagProductSelector
                    tagEn={manageTag}
                    onClose={() => setManageTag(null)}
                    onSave={() => fetchData()}
                />
            )}

            {/* Merge Modal */}
            <Modal
                title="Merge Tags"
                open={mergeModalVisible}
                onOk={handleMerge}
                onCancel={() => {
                    setMergeModalVisible(false);
                    setSourceTagForMerge('');
                    setTargetTagForMerge('');
                }}
                okText="Merge"
                okButtonProps={{ danger: true }}
            >
                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Typography.Paragraph>
                        Merge one tag into another. All products with the source tag will have it replaced with the target tag.
                    </Typography.Paragraph>

                    <div>
                        <Typography.Text strong>Source Tag (will be removed):</Typography.Text>
                        <Select
                            style={{ width: '100%', marginTop: 8 }}
                            placeholder="Select tag to merge from..."
                            value={sourceTagForMerge || undefined}
                            onChange={setSourceTagForMerge}
                            showSearch
                            options={data.map(t => ({ value: t.en, label: `${t.en} (${t.count} products)` }))}
                        />
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <Typography.Text strong>Target Tag (will be kept):</Typography.Text>
                        <Select
                            style={{ width: '100%', marginTop: 8 }}
                            placeholder="Select tag to merge into..."
                            value={targetTagForMerge || undefined}
                            onChange={setTargetTagForMerge}
                            showSearch
                            options={data.map(t => ({ value: t.en, label: `${t.en} (${t.count} products)` }))}
                        />
                    </div>
                </Space>
            </Modal>

            <style jsx global>{`
                .unsynced-row {
                    background-color: #fff7e6;
                }
                .unsynced-row:hover > td {
                    background-color: #ffe7ba !important;
                }
            `}</style>
        </div>
    );
}
