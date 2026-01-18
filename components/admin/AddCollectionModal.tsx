
'use client';

import { useState } from 'react';
import { Button, Modal, Form, Input, message } from 'antd';
import { Plus } from 'lucide-react';

interface AddCollectionModalProps {
    source: string;
    onSuccess: (newCollection: any) => void;
}

export default function AddCollectionModal({ source, onSuccess }: AddCollectionModalProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const res = await fetch('/api/admin/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: values.title,
                    source: source
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create collection');
            }

            message.success('Collection created successfully');
            onSuccess(data.collection);
            setIsModalOpen(false);
            form.resetFields();

        } catch (error: any) {
            message.error(error.message || 'Failed to create collection');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    return (
        <>
            <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 flex items-center"
            >
                Add Collection
            </Button>

            <Modal
                title={`Add New ${source === 'slingshot' ? 'Slingshot' : 'Ride Engine'} Collection`}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={loading}
                okText="Create"
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="add_collection_form"
                >
                    <Form.Item
                        name="title"
                        label="Collection Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="e.g. New Arrivals, Foil Boards..." />
                    </Form.Item>

                    <p className="text-gray-500 text-xs">
                        Slug will be automatically generated from the title.
                        The collection will be created as "Hidden" by default.
                    </p>
                </Form>
            </Modal>
        </>
    );
}
