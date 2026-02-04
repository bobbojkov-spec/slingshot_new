"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Divider, Form, Input, message, Modal, Row, Space, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

type ColorRecord = {
  id: string;
  name_en: string;
  name_bg?: string;
  hex_color: string;
  position: number;
  usage_count: number;
};

const DEFAULT_FORM_VALUES = { name_en: "", name_bg: "", hex_color: "#000000", position: 0 };

const ColorsAdminClient = () => {
  const [colors, setColors] = useState<ColorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ColorRecord | null>(null);
  const [form] = Form.useForm();

  const fetchColors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/colors");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load colors");
      setColors(data.colors ?? []);
    } catch (err: any) {
      message.error(err?.message || "Unable to load colors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  const openModal = (color?: ColorRecord) => {
    setSelectedColor(color ?? null);
    if (color) {
      form.setFieldsValue({
        name_en: color.name_en,
        name_bg: color.name_bg,
        hex_color: color.hex_color,
        position: color.position,
      });
    } else {
      form.setFieldsValue(DEFAULT_FORM_VALUES);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedColor(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      name_en: values.name_en?.toString().trim(),
      name_bg: values.name_bg?.toString().trim(),
    };
    try {
      const method = selectedColor ? "PUT" : "POST";
      const body = selectedColor ? { id: selectedColor.id, ...payload } : payload;
      const res = await fetch("/api/admin/colors", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save color");
      message.success(`Color ${selectedColor ? "updated" : "added"}`);
      closeModal();
      fetchColors();
    } catch (err: any) {
      message.error(err?.message || "Unable to save color");
    }
  };

  const handleDelete = async (color: ColorRecord) => {
    try {
      const res = await fetch("/api/admin/colors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: color.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete color");
      message.success("Color deleted");
      fetchColors();
    } catch (err: any) {
      message.error(err?.message || "Unable to delete color");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Name (EN)",
        dataIndex: "name_en",
        key: "name_en",
      },
      {
        title: "Name (BG)",
        dataIndex: "name_bg",
        key: "name_bg",
      },
      {
        title: "Hex",
        dataIndex: "hex_color",
        key: "hex_color",
        render: (value: string) => (
          <Tag color={value} style={{ borderRadius: 999 }}>
            {value}
          </Tag>
        ),
      },
      {
        title: "Usage",
        dataIndex: "usage_count",
        key: "usage_count",
        render: (value: number) => (value > 0 ? `${value} product(s)` : "unused"),
      },
      {
        title: "Actions",
        dataIndex: "actions",
        key: "actions",
        render: (_: any, record: ColorRecord) => (
          <Space size={8}>
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>
              Edit
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.usage_count > 0}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    [handleDelete]
  );

  return (
    <Space orientation="vertical" size={24} style={{ width: "100%" }}>
      <Card title="Color Catalog" extra={<Button icon={<PlusOutlined />} onClick={() => openModal()}>Add color</Button>}>
        <Table
          loading={loading}
          dataSource={colors}
          rowKey="id"
          columns={columns}
          pagination={false}
        />
      </Card>
      <Modal
        open={modalOpen}
        title={selectedColor ? "Edit color" : "Add color"}
        onCancel={closeModal}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={DEFAULT_FORM_VALUES}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name_en"
                label="Name (EN)"
                rules={[{ required: true, message: "Enter English name" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name_bg" label="Name (BG)">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hex_color"
                label="Hex Color"
                rules={[{ required: true, message: "Enter hex color" }]}
              >
                <Input type="color" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label="Position">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
};

export default ColorsAdminClient;

