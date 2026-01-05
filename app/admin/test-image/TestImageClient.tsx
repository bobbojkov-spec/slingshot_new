"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import {
  Button,
  Card,
  Col,
  Divider,
  Image,
  Input,
  List,
  Modal,
  Row,
  Select,
  Slider,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import { UploadOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload";

type TestImageRecord = {
  id: string;
  name: string;
  original_url: string;
  small_url: string;
  large_url: string;
  crop_ratio: string | null;
  mode: string | null;
  created_at: string;
};

const ratioOptions = [
  { label: "1:1", value: "1:1", aspect: 1 },
  { label: "3:1", value: "3:1", aspect: 3 },
  { label: "4:3", value: "4:3", aspect: 4 / 3 },
  { label: "16:9", value: "16:9", aspect: 16 / 9 },
];

interface CustomUploadRequest {
  file: RcFile;
  onError?: (error: Error | string) => void;
  onSuccess?: (response: any) => void;
}

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImage = async (
  imageSrc: string,
  pixelCrop: { width: number; height: number; x: number; y: number }
) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to get canvas context");
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create cropped image"));
        return;
      }
      resolve(blob);
    }, "image/jpeg");
  });
};

const TestImageClient = () => {
  const [images, setImages] = useState<TestImageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [ratio, setRatio] = useState("1:1");
  const [ratioValue, setRatioValue] = useState(1);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editImageId, setEditImageId] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/test-images");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load images");
      setImages(data.images ?? []);
    } catch (err: any) {
      message.error(err?.message || "Failed to load test images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleCropSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setModalVisible(true);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
    event.target.value = "";
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !cropImageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedImage(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], selectedFile.name, { type: "image/jpeg" });
      await uploadTestImage({
        file,
        mode: "single",
        cropRatio: ratio,
        name: selectedFile.name,
        imageId: editImageId,
      });
      closeModal();
    } catch (err: any) {
      message.error(err?.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setCropImageSrc(null);
    setSelectedFile(null);
    setEditImageId(null);
    setCroppedAreaPixels(null);
    setZoom(1);
  };

  const uploadTestImage = async ({
    file,
    mode,
    cropRatio,
    name,
    imageId,
  }: {
    file: File;
    mode: "single" | "gallery";
    cropRatio?: string;
    name?: string;
    imageId?: string | null;
  }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    if (cropRatio) formData.append("cropRatio", cropRatio);
    if (name) formData.append("name", name);
    if (imageId) formData.append("imageId", imageId);
    const res = await fetch("/api/admin/test-images/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Upload failed");
    }
    message.success("Image saved to bucket");
    await fetchImages();
  };

  const handleGalleryUpload = async ({ file, onSuccess, onError }: CustomUploadRequest) => {
    try {
      await uploadTestImage({ file, mode: "gallery", name: file.name });
      onSuccess?.("ok");
    } catch (err: any) {
      onError?.(err);
      message.error(err?.message || "Gallery upload failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/admin/test-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      message.success("Image removed");
      await fetchImages();
    } catch (err: any) {
      message.error(err?.message || "Delete failed");
    }
  };

  const handleEdit = (id: string) => {
    setEditImageId(id);
    hiddenInputRef.current?.click();
  };

  const selectedRatio = useMemo(() => {
    const option = ratioOptions.find((item) => item.value === ratio);
    return option?.aspect ?? 1;
  }, [ratio]);

  return (
    <Space orientation="vertical" size={24} style={{ width: "100%" }}>
      <Card title="Test Image Upload">
        <Space orientation="vertical" size={16} style={{ width: "100%" }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => {
              setEditImageId(null);
              hiddenInputRef.current?.click();
            }}
          >
            Upload with Crop Ratio
          </Button>
          <input
            ref={hiddenInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleCropSelection}
          />
          <Upload.Dragger
            accept="image/*"
            multiple
            customRequest={handleGalleryUpload}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <PlusOutlined />
            </p>
            <p className="ant-upload-text">Upload multiple images (no ratio)</p>
          </Upload.Dragger>
        </Space>
      </Card>

      <Divider>Uploaded Images</Divider>

      <List
        dataSource={images}
        loading={loading}
        grid={{ gutter: 16, column: 3 }}
        renderItem={(item) => (
          <List.Item>
            <Card
              cover={
                <Image
                  src={item.small_url}
                  alt={item.name}
                  width="100%"
                  height={200}
                  style={{ objectFit: "cover" }}
                />
              }
              actions={[
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(item.id)}>
                  Edit
                </Button>,
                <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(item.id)}>
                  Delete
                </Button>,
              ]}
            >
              <Typography.Title level={5}>{item.name}</Typography.Title>
              <Typography.Text type="secondary">
                Ratio: {item.crop_ratio || "natural"} • Uploaded {new Date(item.created_at).toLocaleString()}
              </Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  type="link"
                  href={item.large_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View large
                </Button>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        open={modalVisible}
        onCancel={closeModal}
        title="Crop Image"
        okText="Save"
        confirmLoading={uploading}
        onOk={handleUploadSubmit}
        width={800}
      >
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Row gutter={16}>
            <Col span={12}>
              <Typography.Text>Select ratio</Typography.Text>
              <Select
                style={{ width: "100%" }}
                value={ratio}
                onChange={(value) => setRatio(value)}
                options={ratioOptions.map((opt) => ({ label: opt.label, value: opt.value }))}
              />
            </Col>
            <Col span={12}>
              <Typography.Text>Zoom</Typography.Text>
              <Slider min={1} max={3} step={0.1} value={zoom} onChange={(value) => setZoom(value)} />
            </Col>
          </Row>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 400,
              backgroundColor: "#333",
            }}
          >
            {cropImageSrc && (
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={selectedRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              />
            )}
          </div>
        </Space>
      </Modal>
    </Space>
  );
};

export default TestImageClient;

