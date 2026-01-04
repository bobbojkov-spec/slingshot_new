"use client";

import { Button, Card, Input, Space, Table, Typography, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import React, { useMemo, useState } from "react";

type Row = {
  id: string;
  name: string;
  _isNew?: boolean;
};

type Props = {
  initialCategories: Row[];
  initialProductTypes: Row[];
  productTypesWritable?: boolean;
  productTypesCreatable?: boolean;
};

function makeTempId(prefix: string) {
  return `${prefix}_tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeRows(rows: any[]): Row[] {
  return (rows || [])
    .map((r) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
    }))
    .filter((r) => r.id && r.name !== undefined);
}

export default function CategoriesClient({
  initialCategories,
  initialProductTypes,
  productTypesWritable = true,
  productTypesCreatable = true,
}: Props) {
  const [categories, setCategories] = useState<Row[]>(() =>
    normalizeRows(initialCategories),
  );
  const [productTypes, setProductTypes] = useState<Row[]>(() =>
    normalizeRows(initialProductTypes),
  );

  const [editingIds, setEditingIds] = useState<Set<string>>(() => new Set());
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [deletedProductTypeIds, setDeletedProductTypeIds] = useState<
    Set<string>
  >(() => new Set());
  const [saving, setSaving] = useState(false);

  const hasPendingChanges = useMemo(() => {
    const hasEdits = editingIds.size > 0;
    const hasDeletes =
      deletedCategoryIds.size > 0 || deletedProductTypeIds.size > 0;
    const hasNew =
      categories.some((r) => r._isNew) || productTypes.some((r) => r._isNew);
    return hasEdits || hasDeletes || hasNew;
  }, [
    categories,
    productTypes,
    editingIds,
    deletedCategoryIds,
    deletedProductTypeIds,
  ]);

  function markEditing(id: string) {
    setEditingIds((prev) => new Set(prev).add(id));
  }

  function unmarkEditing(id: string) {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function isEditing(id: string) {
    return editingIds.has(id);
  }

  function addCategory() {
    const id = makeTempId("cat");
    setCategories((prev) => [{ id, name: "", _isNew: true }, ...prev]);
    markEditing(id);
  }

  function addProductType() {
    if (!productTypesWritable) {
      message.warning(
        "Product types are read-only because the `product_types` table does not exist.",
      );
      return;
    }
    if (!productTypesCreatable) {
      message.warning(
        "Creating new product types requires a `product_types` table. (Editing/deleting existing types is enabled.)",
      );
      return;
    }
    const id = makeTempId("ptype");
    setProductTypes((prev) => [{ id, name: "", _isNew: true }, ...prev]);
    markEditing(id);
  }

  function deleteCategory(row: Row) {
    setCategories((prev) => prev.filter((r) => r.id !== row.id));
    unmarkEditing(row.id);
    if (!row._isNew) {
      setDeletedCategoryIds((prev) => new Set(prev).add(row.id));
    }
  }

  function deleteProductType(row: Row) {
    setProductTypes((prev) => prev.filter((r) => r.id !== row.id));
    unmarkEditing(row.id);
    if (!row._isNew) {
      setDeletedProductTypeIds((prev) => new Set(prev).add(row.id));
    }
  }

  async function saveAll() {
    try {
      setSaving(true);

      const catCreates = categories
        .filter((r) => r._isNew)
        .map((r) => ({ name: r.name }));
      const catUpdates = categories
        .filter((r) => !r._isNew)
        .map((r) => ({ id: r.id, name: r.name }));
      const catDeletes = Array.from(deletedCategoryIds);

      const typeCreates = productTypes
        .filter((r) => r._isNew)
        .map((r) => ({ name: r.name }));
      const typeUpdates = productTypes
        .filter((r) => !r._isNew)
        .map((r) => ({ id: r.id, name: r.name }));
      const typeDeletes = Array.from(deletedProductTypeIds);

      const catReq = fetch("/api/admin/catalog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creates: catCreates,
          updates: catUpdates,
          deletes: catDeletes,
        }),
      });

      const typeReq = productTypesWritable
        ? fetch("/api/admin/catalog/product-types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creates: typeCreates,
              updates: typeUpdates,
              deletes: typeDeletes,
            }),
          })
        : null;

      const [catRes, typeRes] = await Promise.all([catReq, typeReq]);

      const catBody = await catRes.json().catch(() => ({}));
      if (!catRes.ok)
        throw new Error(catBody?.error || "Failed to save categories");
      const typeBody = typeRes ? await typeRes.json().catch(() => ({})) : {};
      if (typeRes && !typeRes.ok)
        throw new Error(typeBody?.error || "Failed to save product types");

      setCategories(normalizeRows(catBody.categories || []));
      if (typeRes) {
        setProductTypes(normalizeRows(typeBody.productTypes || []));
      }
      setEditingIds(new Set());
      setDeletedCategoryIds(new Set());
      setDeletedProductTypeIds(new Set());
      if (!productTypesWritable) {
        message.success("Saved categories (product types are read-only)");
      } else {
        message.success("Saved");
      }
    } catch (err: any) {
      message.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const categoriesColumns = useMemo(
    () => [
      {
        title: "Category",
        dataIndex: "name",
        key: "name",
        render: (_: any, row: Row) => (
          <Space size={8} style={{ width: "100%" }}>
            <Input
              value={row.name}
              placeholder="Category name"
              disabled={!isEditing(row.id)}
              onChange={(e) => {
                const val = e.target.value;
                setCategories((prev) =>
                  prev.map((r) => (r.id === row.id ? { ...r, name: val } : r)),
                );
              }}
              style={{ flex: 1 }}
            />
            <Button
              icon={<EditOutlined />}
              onClick={() => markEditing(row.id)}
              disabled={isEditing(row.id)}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteCategory(row)}
            />
          </Space>
        ),
      },
    ],
    [editingIds],
  );

  const productTypesColumns = useMemo(
    () => [
      {
        title: "Product type",
        dataIndex: "name",
        key: "name",
        render: (_: any, row: Row) => (
          <Space size={8} style={{ width: "100%" }}>
            <Input
              value={row.name}
              placeholder="Product type name"
              disabled={!isEditing(row.id)}
              onChange={(e) => {
                const val = e.target.value;
                setProductTypes((prev) =>
                  prev.map((r) => (r.id === row.id ? { ...r, name: val } : r)),
                );
              }}
              style={{ flex: 1 }}
            />
            <Button
              icon={<EditOutlined />}
              onClick={() => markEditing(row.id)}
              disabled={!productTypesWritable || isEditing(row.id)}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteProductType(row)}
              disabled={!productTypesWritable}
            />
          </Space>
        ),
      },
    ],
    [editingIds, productTypesWritable],
  );

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Categories
        </Typography.Title>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={saveAll}
          loading={saving}
          disabled={!hasPendingChanges}
        >
          Save
        </Button>
      </Space>

      <Card
        title="Categories"
        extra={
          <Button icon={<PlusOutlined />} onClick={addCategory}>
            Add category
          </Button>
        }
      >
        <Table<Row>
          rowKey="id"
          dataSource={categories}
          columns={categoriesColumns as any}
          pagination={false}
        />
      </Card>

      <Card
        title="Product types"
        extra={
          <Button icon={<PlusOutlined />} onClick={addProductType}>
            Add product type
          </Button>
        }
      >
        {!productTypesCreatable ? (
          <Typography.Text type="secondary">
            New product types can’t be created without a `product_types` table. You can still edit/delete existing types (this updates products in bulk).
          </Typography.Text>
        ) : null}
        <Table<Row>
          rowKey="id"
          dataSource={productTypes}
          columns={productTypesColumns as any}
          pagination={false}
        />
      </Card>
    </Space>
  );
}


