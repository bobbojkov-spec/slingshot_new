'use client';

import { Card, Space, Table, Tag, Typography } from 'antd';

const mediaRows = [
  { key: '1', file: 'machine-v4.jpg', type: 'image', usedIn: 'Products', uploadedAt: '2024-02-08' },
  { key: '2', file: 'hero-big-air.jpg', type: 'image', usedIn: 'Homepage', uploadedAt: '2024-02-06' },
  { key: '3', file: 'logo-dark.svg', type: 'image', usedIn: 'Header', uploadedAt: '2024-01-31' },
];

export default function MediaLibraryPage() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Media Library
      </Typography.Title>

      <Card>
        <Table
          dataSource={mediaRows}
          pagination={false}
          columns={[
            { title: 'File', dataIndex: 'file' },
            {
              title: 'Type',
              dataIndex: 'type',
              render: (value: string) => <Tag>{value}</Tag>,
              width: 120,
            },
            { title: 'Used in', dataIndex: 'usedIn' },
            { title: 'Uploaded at', dataIndex: 'uploadedAt', width: 140 },
          ]}
        />
      </Card>
    </Space>
  );
}

