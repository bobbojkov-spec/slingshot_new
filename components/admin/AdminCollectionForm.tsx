
"use client";

import { useState } from "react";
import { Tabs, Form, Input, Button, Card, Divider } from "antd";

interface Props {
    collection?: any;
    translations?: any[];
    action: (formData: FormData) => Promise<void>;
}

export default function AdminCollectionForm({ collection, translations = [], action }: Props) {
    const [loading, setLoading] = useState(false);

    // Helper to get translation value
    const getTrans = (lang: string, field: string) => {
        const t = translations.find((t) => t.language_code === lang);
        return t ? t[field] : (collection ? collection[field] : ""); // Fallback to main if EN or empty
    };

    return (
        <form action={action} onSubmit={() => setLoading(true)}>
            <Card title="General Info" className="mb-8">
                <Form.Item label="Handle (URL Slug)">
                    <Input name="handle" defaultValue={collection?.handle || ""} required />
                </Form.Item>
            </Card>

            <Card title="Content">
                <Tabs
                    defaultActiveKey="en"
                    items={[
                        {
                            key: "en",
                            label: "English",
                            children: (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Title (EN)</label>
                                        <Input name="title_en" defaultValue={getTrans('en', 'title')} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Description (EN)</label>
                                        <Input.TextArea name="desc_en" rows={4} defaultValue={getTrans('en', 'description') || ""} />
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: "bg",
                            label: "Bulgarian",
                            children: (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Title (BG)</label>
                                        <Input name="title_bg" defaultValue={getTrans('bg', 'title')} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Description (BG)</label>
                                        <Input.TextArea name="desc_bg" rows={4} defaultValue={getTrans('bg', 'description') || ""} />
                                    </div>
                                </div>
                            ),
                        },
                    ]}
                />
            </Card>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-4 z-50">
                <Button href="/admin/collections">Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                    Save Collection
                </Button>
            </div>
        </form>
    );
}
