
"use client";

import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, message, Space, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BilingualInput from '../components/BilingualInput';
import TiptapBilingualRichText from '../components/TiptapBilingualRichText';

interface FaqItem {
    id: number;
    question_en: string;
    question_bg?: string;
    answer_en: string;
    answer_bg?: string;
    sort_order: number;
    is_active: boolean;
}

const { TextArea } = Input;

// Draggable Row Component
const Row = (props: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props['data-row-key'],
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        cursor: 'move',
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
};

export default function FaqAdminPage() {
    const [items, setItems] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
    const [form] = Form.useForm();

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/faq');
            const data = await res.json();
            if (data.ok) {
                setItems(data.data);
            } else {
                message.error(data.error);
            }
        } catch (e) {
            message.error('Failed to load FAQs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSave = async (values: any) => {
        const payload = { ...values, is_active: values.is_active ?? true };
        const method = editingItem ? 'PATCH' : 'POST';
        const body = editingItem ? { id: editingItem.id, ...payload } : payload;

        try {
            const res = await fetch('/api/admin/faq', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.ok) {
                message.success('Saved successfully');
                setModalVisible(false);
                fetchItems();
            } else {
                message.error(data.error);
            }
        } catch (e) {
            message.error('Operation failed');
        }
    };

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: 'Delete FAQ?',
            onOk: async () => {
                await fetch(`/api/admin/faq?id=${id}`, { method: 'DELETE' });
                fetchItems();
                message.success('Deleted');
            }
        });
    };

    const onDragEnd = async ({ active, over }: any) => {
        if (active.id !== over?.id) {
            setItems((prev) => {
                const activeIndex = prev.findIndex((i) => i.id === active.id);
                const overIndex = prev.findIndex((i) => i.id === over?.id);
                const newItems = arrayMove(prev, activeIndex, overIndex);

                // Persist order
                const updates = newItems.map((item, index) => ({ id: item.id, sort_order: index }));
                fetch('/api/admin/faq', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'reorder', updates }),
                });

                return newItems;
            });
        }
    };

    const columns = [
        {
            key: 'sort',
            width: 30,
            render: () => <DragOutlined style={{ cursor: 'grab', color: '#999' }} />,
        },
        {
            title: 'Question (EN)',
            dataIndex: 'question_en',
            key: 'question_en',
            ellipsis: true,
        },
        {
            title: 'Active',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 80,
            render: (active: boolean) => <Switch checked={active} disabled size="small" />,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_: any, record: FaqItem) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => {
                        setEditingItem(record);
                        form.setFieldsValue(record);
                        setModalVisible(true);
                    }} />
                    <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)} />
                </Space>
            ),
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2>FAQ Module</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    setEditingItem(null);
                    form.resetFields();
                    setModalVisible(true);
                }}>Add FAQ</Button>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <Table
                        rowKey="id"
                        components={{ body: { row: Row } }}
                        dataSource={items}
                        columns={columns}
                        loading={loading}
                        pagination={false}
                    />
                </SortableContext>
            </DndContext>

            <Modal
                title={editingItem ? 'Edit FAQ' : 'New FAQ'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={form.submit}
                width={800}
                forceRender
            >
                <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ is_active: true, sort_order: 0 }}>
                    <Card size="small" className="mb-4">
                        <BilingualInput
                            label="Question"
                            enValue={form.getFieldValue('question_en')}
                            bgValue={form.getFieldValue('question_bg')}
                            onEnChange={(val) => form.setFieldValue('question_en', val)}
                            onBgChange={(val) => form.setFieldValue('question_bg', val)}
                        />
                    </Card>

                    <Card size="small" className="mb-4">
                        <Form.Item name="answer_en" hidden><Input /></Form.Item>
                        <Form.Item name="answer_bg" hidden><Input /></Form.Item>
                        <TiptapBilingualRichText
                            label="Answer"
                            enValue={form.getFieldValue('answer_en')}
                            bgValue={form.getFieldValue('answer_bg')}
                            onEnChange={(val) => form.setFieldValue('answer_en', val)}
                            onBgChange={(val) => form.setFieldValue('answer_bg', val)}
                        />
                    </Card>

                    <Space>
                        <Form.Item name="is_active" valuePropName="checked" label="Active">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="sort_order" label="Order">
                            <InputNumber min={0} />
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>
        </div>
    );
}
