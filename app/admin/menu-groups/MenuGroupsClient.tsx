"use client";

import { Button, Card, Col, Empty, Row, Space, Spin, Typography, message } from 'antd';
import { useState } from 'react';

type ProductTypeRow = {
  id: string;
  slug: string;
  name: string;
  menuGroup: 'gear' | 'accessories';
  productCount: number;
};

type CategoryWithProducts = {
  id: string;
  name: string;
  slug: string;
  handle?: string;
  productTypes: ProductTypeRow[];
};

const MENU_GROUPS: Array<{ key: ProductTypeRow['menuGroup']; title: string }> = [
  { key: 'gear', title: 'Gear' },
  { key: 'accessories', title: 'Accessories' },
];

export default function MenuGroupsClient({ categories }: { categories: CategoryWithProducts[] }) {
  const [items, setItems] = useState<CategoryWithProducts[]>(categories);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const handleMove = async (
    categoryId: string,
    productTypeId: string,
    toGroup: ProductTypeRow['menuGroup'],
  ) => {
    setSavingKey(`${categoryId}-${productTypeId}`);
    try {
      const res = await fetch('/api/admin/menu-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, productTypeId, menuGroup: toGroup }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Assignment failed');

      setItems((prev) =>
        prev.map((category) => {
          if (category.id !== categoryId) return category;
          return {
            ...category,
            productTypes: category.productTypes.map((pt) =>
              pt.id === productTypeId ? { ...pt, menuGroup: toGroup } : pt,
            ),
          };
        }),
      );
      message.success('Menu group updated');
    } catch (err: any) {
      message.error(err?.message || 'Failed to update menu group');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      {items.length === 0 && (
        <Empty description="No sports with assigned product types yet" />
      )}
      {items.map((category) => (
        <Card
          key={category.id}
          title={
            <Typography.Title level={4} style={{ margin: 0 }}>
              {category.name}
            </Typography.Title>
          }
          size="small"
          styles={{ body: { padding: 16 } }}
        >
          <Row gutter={[16, 16]}>
            {MENU_GROUPS.map((group) => {
              const types = category.productTypes.filter((type) => type.menuGroup === group.key);
              const otherGroup = MENU_GROUPS.find((g) => g.key !== group.key);
              return (
                <Col xs={24} lg={12} key={`${category.id}-${group.key}`}>
                  <Card
                    title={group.title}
                    type="inner"
                    styles={{
                      header: { fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.2em' },
                      body: { padding: '12px 16px' },
                    }}
                  >
                    {types.length === 0 ? (
                      <Typography.Text type="secondary">No product types assigned</Typography.Text>
                      ) : (
                        <Space orientation="vertical" style={{ width: '100%' }}>
                        {types.map((type) => (
                          <Space
                            key={type.id}
                            style={{ justifyContent: 'space-between', width: '100%' }}
                          >
                            <span>
                              {type.name} <Typography.Text type="secondary">({type.productCount})</Typography.Text>
                            </span>
                            <Button
                              size="small"
                              type="link"
                              disabled={savingKey === `${category.id}-${type.id}`}
                              onClick={() => handleMove(category.id, type.id, otherGroup?.key || 'gear')}
                            >
                              Move to {otherGroup?.title}
                            </Button>
                          </Space>
                        ))}
                      </Space>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      ))}
    </Space>
  );
}

