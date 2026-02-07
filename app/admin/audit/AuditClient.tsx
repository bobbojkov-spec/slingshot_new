'use client';

import { useState, useEffect } from 'react';
import { Input, Button, Card, Col, Row, Progress, Typography, CardProps, List, Tag, Spin, message, Space, Divider } from 'antd';
import { AreaChartOutlined, RocketOutlined, SearchOutlined, CheckCircleOutlined, AlertOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface AuditScores {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
}

interface Opportunity {
    id: string;
    title: string;
    description: string;
    score: number;
    displayValue: string;
}

interface AuditData {
    url: string;
    scores: AuditScores;
    opportunities: Opportunity[];
}

export default function AuditClient() {
    const [targetUrl, setTargetUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [auditData, setAuditData] = useState<AuditData | null>(null);

    // Default to the current production-like URL if possible
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setTargetUrl(window.location.origin);
        }
    }, []);

    const handleRunAudit = async () => {
        if (!targetUrl.trim()) {
            message.warning('Please enter a valid URL');
            return;
        }

        setLoading(true);
        setAuditData(null);
        try {
            const res = await fetch(`/api/admin/audit?url=${encodeURIComponent(targetUrl)}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to fetch audit results');
            }
            const data = await res.json();
            setAuditData(data);
            message.success('Audit completed successfully');
        } catch (error: any) {
            console.error(error);
            message.error(error.message || 'An error occurred during audit');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#52c41a'; // Good
        if (score >= 50) return '#faad14'; // Needs improvement
        return '#f5222d'; // Poor
    };

    const ScoreGauge = ({ title, score }: { title: string, score: number }) => (
        <Col xs={12} sm={6} className="text-center">
            <div className="mb-2">
                <Progress
                    type="dashboard"
                    percent={Math.round(score)}
                    strokeColor={getScoreColor(score)}
                    width={100}
                />
            </div>
            <Text strong>{title}</Text>
        </Col>
    );

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <Title level={2}><RocketOutlined /> Visual Performance Audit</Title>
                <Paragraph type="secondary">
                    Analyze any page on your site using Google Lighthouse metrics.
                </Paragraph>
            </div>

            <Card className="mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target URL to analyze</label>
                        <Input
                            size="large"
                            placeholder="https://..."
                            prefix={<SearchOutlined />}
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                            onPressEnter={handleRunAudit}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Note: Analysis takes about 10-20 seconds.
                        </Text>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        icon={<AreaChartOutlined />}
                        onClick={handleRunAudit}
                        loading={loading}
                        className="bg-black hover:bg-gray-800 border-black px-8"
                    >
                        {loading ? 'Analyzing...' : 'Audit Now'}
                    </Button>
                </div>
            </Card>

            {loading && (
                <div className="py-20 text-center">
                    <Spin size="large" tip="Running Lighthouse audit..." />
                </div>
            )}

            {auditData && (
                <div className="animate-in fade-in duration-500">
                    <Card className="mb-6 shadow-sm">
                        <Title level={4} className="mb-6">Lighthouse Performance Overview</Title>
                        <Row gutter={[16, 16]} justify="space-around">
                            <ScoreGauge title="Performance" score={auditData.scores.performance} />
                            <ScoreGauge title="Accessibility" score={auditData.scores.accessibility} />
                            <ScoreGauge title="Best Practices" score={auditData.scores.bestPractices} />
                            <ScoreGauge title="SEO" score={auditData.scores.seo} />
                        </Row>
                    </Card>

                    <Row gutter={16}>
                        <Col xs={24} lg={24}>
                            <Card title="Optimization Opportunities" className="shadow-sm">
                                <List
                                    itemLayout="horizontal"
                                    dataSource={auditData.opportunities}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<AlertOutlined style={{ color: getScoreColor(item.score * 100) }} />}
                                                title={<Text strong>{item.title}</Text>}
                                                description={
                                                    <div>
                                                        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }} className="mb-1">
                                                            <div dangerouslySetInnerHTML={{ __html: item.description }} />
                                                        </Paragraph>
                                                        <Tag color="orange">{item.displayValue}</Tag>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
}
