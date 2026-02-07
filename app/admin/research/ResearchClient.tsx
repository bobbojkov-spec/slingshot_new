'use client';

import { useState } from 'react';
import { Input, Button, Radio, Tabs, Table, Card, Typography, Spin, message, Result } from 'antd';
import { SearchOutlined, RobotOutlined, GlobalOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ResearchResult {
    keyword?: string;
    question?: string;
    volume?: string; // or number
    difficulty?: string;
    intent?: string;
    name?: string;
    url?: string;
    strength?: string;
}

type ResearchType = 'keywords' | 'questions' | 'competitors';

export default function ResearchClient() {
    const [term, setTerm] = useState('');
    const [lang, setLang] = useState<'en' | 'de' | 'bg'>('en');
    const [activeTab, setActiveTab] = useState<ResearchType>('keywords');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ [key in ResearchType]: ResearchResult[] }>({
        keywords: [],
        questions: [],
        competitors: [],
    });

    const handleSearch = async () => {
        if (!term.trim()) {
            message.warning('Please enter a topic or keyword');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term, lang, type: activeTab }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch research data');
            }

            const data = await res.json();

            if (data.results) {
                setResults(prev => ({
                    ...prev,
                    [activeTab]: data.results
                }));
                message.success('Research completed successfully');
            } else {
                message.warning('No results returned from AI');
            }

        } catch (error: any) {
            console.error(error);
            message.error(error.message || 'An error occurred during research');
        } finally {
            setLoading(false);
        }
    };

    const columnsKeywords = [
        { title: 'Keyword', dataIndex: 'keyword', key: 'keyword', render: (text: string) => <Text strong>{text}</Text> },
        { title: 'Volume', dataIndex: 'volume', key: 'volume' },
        { title: 'Difficulty', dataIndex: 'difficulty', key: 'difficulty' },
        { title: 'Intent', dataIndex: 'intent', key: 'intent' },
    ];

    const columnsQuestions = [
        { title: 'Question', dataIndex: 'question', key: 'question', render: (text: string) => <Text strong>{text}</Text> },
        { title: 'Intent', dataIndex: 'intent', key: 'intent' },
    ];

    const columnsCompetitors = [
        { title: 'Name', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
        {
            title: 'URL',
            dataIndex: 'url',
            key: 'url',
            render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer">{url}</a> : '-'
        },
        { title: 'Strength', dataIndex: 'strength', key: 'strength' },
    ];

    const renderContent = () => {
        const currentResults = results[activeTab];
        let columns: any[] = [];

        switch (activeTab) {
            case 'keywords': columns = columnsKeywords; break;
            case 'questions': columns = columnsQuestions; break;
            case 'competitors': columns = columnsCompetitors; break;
        }

        if (!currentResults || currentResults.length === 0) {
            return (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <RobotOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                    <Paragraph type="secondary" className="mt-4">
                        Enter a topic and generate AI research for <strong>{lang.toUpperCase()}</strong> market.
                    </Paragraph>
                </div>
            );
        }

        return (
            <Table
                dataSource={currentResults}
                columns={columns}
                rowKey={(record) => record.keyword || record.question || record.name || Math.random().toString()}
                pagination={false}
                bordered
                size="small"
            />
        );
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <Title level={2}><ThunderboltOutlined /> SEO Research Module</Title>
                <Paragraph type="secondary">
                    Use AI to research keywords, questions, and competitors in specific languages.
                </Paragraph>
            </div>

            <Card className="mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Seed Keyword</label>
                        <Input
                            size="large"
                            placeholder="e.g. Kitesuriing, Foilboards..."
                            prefix={<SearchOutlined />}
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            onPressEnter={handleSearch}
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Language / Market</label>
                        <Radio.Group
                            value={lang}
                            onChange={(e) => setLang(e.target.value)}
                            buttonStyle="solid"
                            size="large"
                        >
                            <Radio.Button value="en">🇺🇸 English</Radio.Button>
                            <Radio.Button value="de">🇩🇪 German</Radio.Button>
                            <Radio.Button value="bg">🇧🇬 Bulgarian</Radio.Button>
                        </Radio.Group>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        icon={<RobotOutlined />}
                        onClick={handleSearch}
                        loading={loading}
                        className="bg-black hover:bg-gray-800 border-black"
                    >
                        Generate Research
                    </Button>
                </div>
            </Card>

            <Card className="shadow-sm min-h-[500px]">
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as ResearchType)}
                    type="card"
                    items={[
                        { label: 'Keywords', key: 'keywords', children: renderContent() },
                        { label: 'Questions', key: 'questions', children: renderContent() },
                        { label: 'Competitors', key: 'competitors', children: renderContent() },
                    ]}
                />
            </Card>
        </div>
    );
}
