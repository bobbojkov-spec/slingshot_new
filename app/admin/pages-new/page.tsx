"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    message,
    Space,
    Tag,
    Checkbox,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { PageRecord } from '../../../types/page';

type EditFormValues = {
    title: string;
    title_bg?: string;
    slug: string;
    status: 'draft' | 'published';
    show_footer: boolean;
    footer_order?: number;
    order?: number;
};

const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
];

const footerOptions = [
    { label: 'None', value: '' },
    { label: 'Column 1', value: 1 },
    { label: 'Column 2', value: 2 },
    { label: 'Column 3', value: 3 },
];

const formatDisplayDate = (value: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

export default function PagesNewAdminPage() {
    const [pages, setPages] = useState<PageRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [selectedPage, setSelectedPage] = useState<PageRecord | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [createForm] = Form.useForm<{ title: string; slug: string; order?: number }>();
    const [editForm] = Form.useForm<EditFormValues>();

    const fetchPages = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/pages-new');
            const payload = await response.json();

            if (!payload.ok) {
                throw new Error(payload.error || 'Unable to load pages');
            }

            setPages(payload.data);
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to load pages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const openCreateModal = () => {
        createForm.resetFields();
        setShowCreate(true);
    };

    const handleCreate = async (values: { title: string; slug: string; order?: number }) => {
        setSubmitting(true);
        try {
            const response = await fetch('/api/pages-new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const payload = await response.json();

            if (!payload.ok) {
                throw new Error(payload.error || 'Failed to create page');
            }

            message.success('Page created');
            setShowCreate(false);
            fetchPages();
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to create page');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (page: PageRecord) => {
        setSelectedPage(page);
        editForm.setFieldsValue({
            title: page.title,
            title_bg: page.title_bg,
            slug: page.slug,
            status: (page.status || 'draft') as 'draft' | 'published',
            order: page.order ?? undefined,
            show_footer: Boolean(page.show_footer),
            footer_order: page.footer_order ?? undefined,
        });
        setShowEdit(true);
    };

    const handleEdit = async (values: EditFormValues) => {
        if (!selectedPage) return;

        setSubmitting(true);
        try {
            const showFooter = Boolean(values.show_footer);
            const payload = {
                title: values.title,
                title_bg: values.title_bg,
                slug: values.slug,
                status: values.status,
                order: values.order,
                show_footer: showFooter,
                footer_column: showFooter ? 2 : null, // Default to column 2 as previously requested
                footer_order: showFooter ? values.footer_order : null,
            };

            const response = await fetch(`/api/pages-new/${selectedPage.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.error || 'Failed to update page');
            }

            message.success('Page updated');
            setShowEdit(false);
            setSelectedPage(null);
            fetchPages();
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to update page');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (page: PageRecord) => {
        Modal.confirm({
            title: 'Delete page',
            content: `Are you sure you want to delete "${page.title}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pages-new/${page.id}`, {
                        method: 'DELETE',
                    });

                    const payload = await response.json();

                    if (!payload.ok) {
                        throw new Error(payload.error || 'Failed to delete page');
                    }

                    message.success('Page deleted');
                    fetchPages();
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'Failed to delete page');
                }
            },
        });
    };

    const columns: ColumnsType<PageRecord> = [
        {
            title: 'Order',
            dataIndex: 'order',
            key: 'order',
            width: 80,
            render: (value: number | null) => <span>{value ?? '—'}</span>,
        },
        {
            title: 'Name',
            dataIndex: 'title',
            key: 'title',
            render: (value: string, record: PageRecord) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Link
                        href={`/admin/pages-new/${record.id}`}
                        style={{ color: '#1890ff', textDecoration: 'underline' }}
                    >
                        {value}
                    </Link>
                    {record.title_bg ? (
                        <span style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.6)' }}>{record.title_bg}</span>
                    ) : null}
                </div>
            ),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string | null) => (
                <Tag color={status === 'published' ? 'green' : 'default'}>
                    {(status || 'draft').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Footer',
            dataIndex: 'show_footer',
            key: 'show_footer',
            render: (value: boolean | null) => <Checkbox checked={Boolean(value)} disabled />,
        },
        {
            title: 'Updated',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (value: string | null) => <span>{formatDisplayDate(value)}</span>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            align: 'center',
            render: (_: unknown, record: PageRecord) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Pages</h2>
                <Button icon={<PlusOutlined />} type="primary" onClick={openCreateModal}>
                    Add Page
                </Button>
            </div>

            <Table
                rowKey="id"
                dataSource={pages}
                columns={columns}
                loading={loading}
                pagination={false}
                bordered
            />

            <Modal
                title="Add Page"
                open={showCreate}
                confirmLoading={submitting}
                onCancel={() => setShowCreate(false)}
                onOk={() => createForm.submit()}
                forceRender
            >
                <Form
                    layout="vertical"
                    form={createForm}
                    onFinish={handleCreate}
                    initialValues={{ show_footer: true }}
                >
                    <Form.Item name="title" label="Title (EN)" rules={[{ required: true, message: 'Title is required' }]}>
                        <Input placeholder="Title" />
                    </Form.Item>
                    <Form.Item name="title_bg" label="Title (BG)">
                        <Input placeholder="Заглавие" />
                    </Form.Item>
                    <Form.Item name="slug" label="Slug" rules={[{ required: true, message: 'Slug is required' }]}>
                        <Input placeholder="slug-name" />
                    </Form.Item>
                    <Form.Item name="order" label="Order">
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="show_footer" valuePropName="checked">
                        <Checkbox>Show in Footer</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Edit Page"
                open={showEdit}
                confirmLoading={submitting}
                onCancel={() => {
                    setShowEdit(false);
                    setSelectedPage(null);
                }}
                onOk={() => editForm.submit()}
                width={600}
                forceRender
            >
                <Form
                    layout="vertical"
                    form={editForm}
                    onFinish={handleEdit}
                >
                    <Form.Item name="title" label="Title (EN)" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="title_bg" label="Title (BG)">
                        <Input />
                    </Form.Item>
                    <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select options={statusOptions} />
                    </Form.Item>
                    <Form.Item name="order" label="Order">
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <h3 style={{ marginTop: 24, marginBottom: 16 }}>Navigation Settings</h3>

                    <Form.Item name="show_footer" valuePropName="checked">
                        <Checkbox>Show in Footer</Checkbox>
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.show_footer !== curr.show_footer}
                    >
                        {({ getFieldValue }) => {
                            return getFieldValue('show_footer') ? (
                                <Form.Item
                                    name="footer_order"
                                    label="Footer Order"
                                    rules={[{ required: true }, { type: 'number', min: 1 }]}
                                >
                                    <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
