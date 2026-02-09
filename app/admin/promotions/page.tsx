"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Breadcrumb,
    Button,
    Card,
    Space,
    Table,
    Tag,
    Modal,
    message,
    Typography,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    BulbOutlined,
} from '@ant-design/icons';
import { Promotion } from '@/lib/db/models';

const { Title, Text } = Typography;

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/promotions');
            const data = await res.json();
            if (data.promotions) {
                setPromotions(data.promotions);
            }
        } catch (error) {
            message.error('Failed to fetch promotions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Delete Promotion',
            content: 'Are you sure you want to delete this promotion? This action cannot be undone.',
            onOk: async () => {
                try {
                    const res = await fetch(`/api/admin/promotions/${id}`, {
                        method: 'DELETE',
                    });
                    if (res.ok) {
                        message.success('Promotion deleted');
                        fetchPromotions();
                    } else {
                        message.error('Failed to delete promotion');
                    }
                } catch (error) {
                    message.error('Error deleting promotion');
                }
            },
        });
    };

    const getStatusTag = (record: Promotion) => {
        const now = new Date();
        const from = record.valid_from ? new Date(record.valid_from) : null;
        const to = record.valid_to ? new Date(record.valid_to) : null;

        if (!record.is_active) {
            return <Tag color="default">Inactive</Tag>;
        }

        if (from && from > now) {
            return <Tag color="blue">Future</Tag>;
        }

        if (to && to < now) {
            return <Tag color="orange">Past</Tag>;
        }

        return <Tag color="green">Currently Active</Tag>;
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: Promotion) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.placement}</Text>
                </Space>
            ),
        },
        {
            title: 'Display',
            dataIndex: 'display_type',
            key: 'display_type',
            render: (type: string) => (
                <Tag color={type === 'big' ? 'purple' : 'cyan'}>
                    {type.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Validity',
            key: 'validity',
            render: (_: any, record: Promotion) => {
                const from = record.valid_from ? new Date(record.valid_from).toLocaleDateString() : 'Always';
                const to = record.valid_to ? new Date(record.valid_to).toLocaleDateString() : 'Always';
                return (
                    <Text style={{ fontSize: '12px' }}>
                        {from} - {to}
                    </Text>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: Promotion) => getStatusTag(record),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Promotion) => (
                <Space>
                    <Link href={`/admin/promotions/${record.id}`}>
                        <Button icon={<EditOutlined />} size="small">Edit</Button>
                    </Link>
                    <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => handleDelete(record.id)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Breadcrumb items={[
                { title: <Link href="/admin">Dashboard</Link> },
                { title: 'Promotions' },
            ]} />

            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Promotions & Notifications</Title>
                        <Text type="secondary">Manage popups and site-wide notifications</Text>
                    </div>
                    <Link href="/admin/promotions/new">
                        <Button type="primary" icon={<PlusOutlined />}>
                            Add Promotion
                        </Button>
                    </Link>
                </div>

                <Table
                    columns={columns}
                    dataSource={promotions}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </Space>
    );
}
