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
    slug: string;
    status: 'draft' | 'published';
    show_header: boolean;
    header_order?: number;
    show_dropdown: boolean;
    dropdown_order?: number;
    footer_column: '' | 1 | 2 | 3;
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
    if (!value) {
        return '-';
    }

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
    const [createForm] = Form.useForm<{ title: string; slug: string }>();
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

    const handleCreate = async (values: { title: string; slug: string }) => {
        setSubmitting(true);

        try {
            const response = await fetch('/api/pages-new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            slug: page.slug,
            status: (page.status || 'draft') as 'draft' | 'published',
            order: page.order ?? undefined,
            show_header: Boolean(page.show_header),
            header_order: page.header_order ?? undefined,
            show_dropdown: Boolean(page.show_dropdown),
            dropdown_order: page.dropdown_order ?? undefined,
            footer_column: (page.footer_column ?? '') as '' | 1 | 2 | 3,
            footer_order: page.footer_order ?? undefined,
        });
        setShowEdit(true);
    };

    const handleEdit = async (values: EditFormValues) => {
        if (!selectedPage) {
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                title: values.title,
                slug: values.slug,
                status: values.status,
                order: values.order,
                show_header: values.show_header,
                header_order: values.header_order,
                show_dropdown: values.show_dropdown,
                dropdown_order: values.dropdown_order,
                footer_column: values.footer_column === '' ? null : values.footer_column,
                footer_order: values.footer_order,
            };

            const response = await fetch(`/api/pages-new/${selectedPage.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            render: (value: number | null, record: PageRecord) => <span>{value ?? '—'}</span>,
        },
        {
            title: 'Name',
            dataIndex: 'title',
            key: 'title',
            render: (value: string, record: PageRecord) => (
                <Link
                    href={`/admin/pages-new/${record.id}`}
                    style={{ color: '#1890ff', textDecoration: 'underline' }}
                >
                    {value}
                </Link>
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
            render: (status: string | null, record: PageRecord) => (
                <Tag color={status === 'published' ? 'green' : 'default'}>
                    {(status || 'draft').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Header',
            dataIndex: 'show_header',
            key: 'show_header',
            render: (value: boolean | null, record: PageRecord) => <Checkbox checked={Boolean(value)} disabled />,
        },
        {
            title: 'Dropdown',
            dataIndex: 'show_dropdown',
            key: 'show_dropdown',
            render: (value: boolean | null, record: PageRecord) => <Checkbox checked={Boolean(value)} disabled />,
        },
        {
            title: 'Footer',
            dataIndex: 'footer_column',
            key: 'footer_column',
            render: (value: number | null, record: PageRecord) => <span>{value ?? '—'}</span>,
        },
        {
            title: 'Updated',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (value: string | null, record: PageRecord) => <span>{formatDisplayDate(value)}</span>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_: unknown, record: PageRecord) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                        style={{ color: '#1890ff' }}
                    >
                        Edit
                    </Button>
                    {record.status === 'draft' && (
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                            aria-label={`Delete ${record.title}`}
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
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
                destroyOnHidden
                forceRender
            >
                <Form
                    layout="vertical"
                    form={createForm}
                    onFinish={handleCreate}
                    requiredMark="optional"
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Title is required' }]}
                    >
                        <Input placeholder="Title" />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[{ required: true, message: 'Slug is required' }]}
                    >
                        <Input placeholder="Slug" />
                    </Form.Item>
                    <Form.Item
                        name="order"
                        label="Order"
                        rules={[{ type: 'number', min: 1, message: 'Order must be at least 1' }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} />
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
                destroyOnHidden
                forceRender
            >
                <Form layout="vertical" form={editForm} onFinish={handleEdit} requiredMark="optional">
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Title is required' }]}
                    >
                        <Input placeholder="Title" />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[{ required: true, message: 'Slug is required' }]}
                    >
                        <Input placeholder="Slug" />
                    </Form.Item>
                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true, message: 'Status is required' }]}
                    >
                        <Select options={statusOptions} />
                    </Form.Item>

                    <section style={{ marginTop: 24 }}>
                        <h3 style={{ marginBottom: 16 }}>Page Settings</h3>

                        <Form.Item name="show_header" valuePropName="checked">
                            <Checkbox>Show in Header</Checkbox>
                        </Form.Item>
                        <Form.Item
                            shouldUpdate={(prev, curr) => prev.show_header !== curr.show_header}
                            noStyle
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('show_header') ? (
                                    <Form.Item
                                        name="header_order"
                                        label="Header Order"
                                        rules={[
                                            { required: true, message: 'Header order is required' },
                                            { type: 'number', min: 1, message: 'Must be at least 1' },
                                        ]}
                                    >
                                        <InputNumber min={1} style={{ width: '100%' }} />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>

                        <Form.Item name="show_dropdown" valuePropName="checked">
                            <Checkbox>Show in Dropdown</Checkbox>
                        </Form.Item>
                        <Form.Item
                            shouldUpdate={(prev, curr) => prev.show_dropdown !== curr.show_dropdown}
                            noStyle
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('show_dropdown') ? (
                                    <Form.Item
                                        name="dropdown_order"
                                        label="Dropdown Order"
                                        rules={[
                                            { required: true, message: 'Dropdown order is required' },
                                            { type: 'number', min: 1, message: 'Must be at least 1' },
                                        ]}
                                    >
                                        <InputNumber min={1} style={{ width: '100%' }} />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>

                        <Form.Item name="footer_column" label="Footer Column">
                            <Select<number | ''> options={footerOptions} />
                        </Form.Item>
                        <Form.Item
                            shouldUpdate={(prev, curr) => prev.footer_column !== curr.footer_column}
                            noStyle
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('footer_column') ? (
                                    <Form.Item
                                        name="footer_order"
                                        label="Footer Order"
                                        rules={[
                                            { required: true, message: 'Footer order is required' },
                                            { type: 'number', min: 1, message: 'Must be at least 1' },
                                        ]}
                                    >
                                        <InputNumber min={1} style={{ width: '100%' }} />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>
                    </section>
                </Form>
            </Modal>
            <style jsx>{`
        .page-link {
          color: #1890ff;
          text-decoration: underline;
          transition: color 0.2s ease, text-decoration 0.2s ease;
        }

        .page-link:hover {
          color: #40a9ff;
        }
      `}</style>
        </div>
    );
}
