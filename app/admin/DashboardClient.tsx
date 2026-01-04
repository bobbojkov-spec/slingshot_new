'use client';

import { Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';

type DashboardSnapshot = {
  productsCount: number;
  categoriesCount: number;
  inquiriesCount: number;
  subscribersCount: number;
  lastImported: Array<{ id?: string; title?: string; updated_at?: string; created_at?: string }>;
};

export default function DashboardClient({ snapshot }: { snapshot: DashboardSnapshot }) {
  const dashboardStats = [
    { title: 'Total products', value: snapshot.productsCount },
    { title: 'Active categories', value: snapshot.categoriesCount },
    { title: 'Inquiries (new)', value: snapshot.inquiriesCount },
    { title: 'Newsletter subscribers', value: snapshot.subscribersCount },
  ];

  const inquiriesData = [
    { id: 'IQ-1042', status: 'new', createdAt: '—' },
    { id: 'IQ-1039', status: 'replied', createdAt: '—' },
    { id: 'IQ-1035', status: 'closed', createdAt: '—' },
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Dashboard
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {dashboardStats.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card>
              <Statistic title={stat.title} value={stat.value ?? 0} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Inquiries">
            <Space orientation="vertical" size={8} style={{ width: '100%' }}>
              {inquiriesData.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 0',
                  }}
                >
                  <Tag color={item.status === 'new' ? 'red' : item.status === 'replied' ? 'blue' : 'default'}>
                    {item.status}
                  </Tag>
                  <Typography.Text strong>{item.id}</Typography.Text>
                  <Typography.Text type="secondary">{item.createdAt}</Typography.Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Last imported products">
            <Table
              size="small"
              pagination={false}
              dataSource={(snapshot.lastImported || []).map((item, idx) => ({
                key: item.id || idx,
                name: item.title || 'Untitled',
                importedAt: item.updated_at || item.created_at || '—',
              }))}
              columns={[
                { title: 'Name', dataIndex: 'name' },
                { title: 'Imported at', dataIndex: 'importedAt', width: 160 },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

