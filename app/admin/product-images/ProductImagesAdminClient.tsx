"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import {
  Button,
  Card,
  Col,
  Divider,
  Image as AntdImage,
  Modal,
  Progress,
  Row,
  Select,
  Slider,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import type { RcFile } from "antd/es/upload";

type ImageSize = "thumb" | "small" | "big";

type ImageBundle = {
  bundleId: string;
  productId: string;
  order: number;
  createdAt?: string;
  urls: Record<ImageSize, { url: string; path: string } | null>;
};

type ProductImagesAdminClientProps = {
  productId: string;
  initialProductTitle?: string;
};

const ratioOptions = [
  { label: "1:1", value: "1:1", aspect: 1 },
  { label: "3:1", value: "3:1", aspect: 3 },
  { label: "4:3", value: "4:3", aspect: 4 / 3 },
  { label: "16:9", value: "16:9", aspect: 16 / 9 },
];

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

const ProductImagesAdminClient = ({ productId, initialProductTitle }: ProductImagesAdminClientProps) => {
  const [bundles, setBundles] = useState<ImageBundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState<string>(initialProductTitle ?? "Product images");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [ratio, setRatio] = useState("1:1");
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [draggedBundleId, setDraggedBundleId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProductTitle = useCallback(async () => {
    if (initialProductTitle) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) return;
      const payload = await res.json();
      const title = payload?.product?.title;
      if (title) {
        setProductTitle(title);
      }
    } catch {
      // keep default title
    }
  }, [initialProductTitle, productId]);

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/product-images?productId=${productId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load bundles");
      const normalized = (data.bundles ?? []).map((bundle: ImageBundle, idx: number) => ({
        ...bundle,
        order: idx + 1,
      }));
      setBundles(normalized);
    } catch (err: any) {
      message.error(err?.message || "Unable to load images");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductTitle();
    fetchBundles();
  }, [fetchProductTitle, fetchBundles]);

  const hiddenInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setCropImageSrc(src);
      setModalVisible(true);
      createImage(src)
        .then((image) => {
          setOriginalDimensions({ width: image.naturalWidth, height: image.naturalHeight });
        })
        .catch(() => {
          setOriginalDimensions(null);
        });
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
    event.target.value = "";
  };

  const closeModal = () => {
    setModalVisible(false);
    setCropImageSrc(null);
    setSelectedFile(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setOriginalDimensions(null);
  };

  const uploadProductImage = (file: File, onProgress?: (percent: number) => void) =>
    new Promise<ImageBundle>((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      form.append("productId", productId);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/product-images/upload");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress?.(percent);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText);
            resolve(body.bundle as ImageBundle);
            return;
          } catch (error) {
            reject(new Error("Upload failed"));
            return;
          }
        }
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body?.error || "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Upload failed"));
      };

      xhr.send(form);
    });

  const handleUploadSubmit = async () => {
    if (!selectedFile || !cropImageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const blob = await getCroppedImage(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], selectedFile.name, { type: "image/jpeg" });
      await uploadProductImage(file, setUploadProgress);
      await fetchBundles();
      message.success("Image saved to Railway storage");
      closeModal();
    } catch (err: any) {
      message.error(err?.message || "Failed to upload");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleGalleryUpload = async (options: any) => {
    const originFile = (options.file as any)?.originFileObj as File | undefined;
    const fallbackFile = (options.file as File) || (options.file as RcFile);
    const candidate = originFile || fallbackFile;
    if (!candidate || typeof candidate === "string") {
      const error = new Error("Unsupported file type");
      options.onError?.(error);
      message.error(error.message);
      return;
    }

    setUploadProgress(0);
    try {
      const uploaded = await uploadProductImage(candidate as File, setUploadProgress);
      options.onSuccess?.(uploaded, candidate);
      await fetchBundles();
      message.success("Image uploaded");
    } catch (err: any) {
      options.onError?.(err);
      message.error(err?.message || "Upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const persistOrder = useCallback(async (ordered: ImageBundle[]) => {
    const payload = {
      productId,
      bundles: ordered.map((bundle) => ({
        bundleId: bundle.bundleId,
        order: bundle.order,
      })),
    };
    const res = await fetch("/api/admin/product-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body?.error || "Failed to update order");
    }
  }, []);

  const reorderSequence = (list: ImageBundle[]) =>
    list.map((bundle, idx) => ({ ...bundle, order: idx + 1 }));

  const applyOrderChange = (fromIndex: number, toIndex: number) => {
    const next = [...bundles];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return reorderSequence(next);
  };

  const handleDragStart = (bundleId: string) => (event: React.DragEvent<HTMLDivElement>) => {
    setDraggedBundleId(bundleId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (bundleId: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragTargetId(bundleId);
  };

  const handleDragLeave = () => {
    setDragTargetId(null);
  };

  const handleArrowMove = async (bundleId: string, direction: -1 | 1) => {
    const currentIndex = bundles.findIndex((bundle) => bundle.bundleId === bundleId);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= bundles.length) return;
    const normalized = applyOrderChange(currentIndex, nextIndex);
    setBundles(normalized);
    try {
      await persistOrder(normalized);
      message.success("Order saved");
      await fetchBundles();
    } catch (err: any) {
      message.error(err?.message || "Reorder failed");
      await fetchBundles();
    }
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedBundleId || draggedBundleId === targetId) return;
    const currentIndex = bundles.findIndex((bundle) => bundle.bundleId === draggedBundleId);
    const targetIndex = bundles.findIndex((bundle) => bundle.bundleId === targetId);
    if (currentIndex === -1 || targetIndex === -1) return;
    const next = [...bundles];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    const normalized = reorderSequence(next);
    setBundles(normalized);
    try {
      await persistOrder(normalized);
      message.success("Order saved");
      await fetchBundles();
    } catch (err: any) {
      message.error(err?.message || "Reorder failed");
      await fetchBundles();
    } finally {
      setDraggedBundleId(null);
      setDragTargetId(null);
    }
  };

  const handleDelete = async (bundleId: string) => {
    try {
      const res = await fetch("/api/admin/product-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Delete failed");
      }
      message.success("Image bundle removed");
      await fetchBundles();
    } catch (err: any) {
      message.error(err?.message || "Delete failed");
    }
  };

  const selectedRatio = useMemo(() => {
    const option = ratioOptions.find((item) => item.value === ratio);
    return option?.aspect ?? 1;
  }, [ratio]);

  return (
    <Space orientation="vertical" size={24} style={{ width: "100%" }}>
      <Card>
        <Space orientation="vertical" size={16} style={{ width: "100%" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {productTitle}
          </Typography.Title>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => hiddenInputRef.current?.click()}
          >
            Upload with Crop Ratio
          </Button>
          <input
            ref={hiddenInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={hiddenInputChange}
          />
          <Upload.Dragger
            accept="image/*"
            multiple
            customRequest={handleGalleryUpload}
            showUploadList={false}
            style={{ borderRadius: 8 }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Drag & drop images (no crop)</p>
          </Upload.Dragger>
          {uploadProgress !== null && (
            <Progress
              percent={uploadProgress}
              size="small"
              status={uploadProgress === 100 ? "success" : "active"}
            />
          )}
        </Space>
      </Card>

      <Divider>Product Images</Divider>

      <Row gutter={[12, 12]}>
        {bundles.map((bundle) => (
          <Col key={bundle.bundleId} xs={24} sm={12} md={8} lg={6}>
            <Card
              styles={{ body: { padding: 0 } }}
              style={{
                border:
                  dragTargetId === bundle.bundleId ? "2px dashed #1890ff" : "1px solid #d9d9d9",
                borderRadius: 10,
                cursor: "grab",
                opacity: draggedBundleId === bundle.bundleId ? 0.6 : 1,
              }}
              draggable
              onDragStart={handleDragStart(bundle.bundleId)}
              onDragOver={handleDragOver(bundle.bundleId)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(bundle.bundleId)}
              onDragEnd={() => {
                setDraggedBundleId(null);
                setDragTargetId(null);
              }}
            >
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fafafa",
                }}
              >
                <AntdImage
                  src={bundle.urls.thumb?.url || bundle.urls.small?.url || bundle.urls.big?.url || undefined}
                  alt={`Image ${bundle.order}`}
                  height={180}
                  width="auto"
                  preview={false}
                  style={{ objectFit: "contain", maxHeight: "100%", maxWidth: "100%" }}
                />
              </div>
              <div
                style={{
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography.Text>Order: {bundle.order}</Typography.Text>
                <Space>
                  <Button
                    size="small"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setPreviewUrl(bundle.urls.big?.url || bundle.urls.small?.url || null);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(bundle.bundleId)}
                  />
                  <Button
                    size="small"
                    icon={<ArrowUpOutlined />}
                    onClick={() => handleArrowMove(bundle.bundleId, -1)}
                    disabled={bundle.order <= 1}
                  />
                  <Button
                    size="small"
                    icon={<ArrowDownOutlined />}
                    onClick={() => handleArrowMove(bundle.bundleId, 1)}
                    disabled={bundle.order >= bundles.length}
                  />
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        open={previewUrl !== null}
        footer={null}
        onCancel={() => setPreviewUrl(null)}
        width="80vw"
      >
        {previewUrl && (
          <AntdImage
            src={previewUrl}
            alt="Preview"
            width="100%"
            style={{ objectFit: "contain" }}
          />
        )}
      </Modal>

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
          {originalDimensions && (
            <Typography.Text type="secondary">
              Original size: {originalDimensions.width} × {originalDimensions.height} px
            </Typography.Text>
          )}
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

export default ProductImagesAdminClient;

