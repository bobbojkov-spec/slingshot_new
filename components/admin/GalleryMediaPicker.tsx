"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type MouseEvent,
} from "react";
import { Modal, Tabs, Button, Spin, Space, message } from "antd";
import { UploadOutlined, CheckOutlined } from "@ant-design/icons";
import { PLACEHOLDER_IMAGE } from "@/lib/utils/placeholder-image";

export type GalleryMediaSelection = {
    mediaId: number;
    url: string;
    // This helps new images display immediately
};

type LibraryMediaFile = {
    id: number;
    filename: string | null;
    url: string;
    width: number | null;
    height: number | null;
    mime_type: string | null;
};

interface Props {
    open: boolean;
    existingMediaIds: number[];
    onClose: () => void;
    onConfirmSelection: (items: GalleryMediaSelection[]) => void;
}

const LIBRARY_PAGE_SIZE = 1000;

export default function GalleryMediaPicker({
    open,
    existingMediaIds,
    onClose,
    onConfirmSelection,
}: Props) {
    const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
    const [libraryFiles, setLibraryFiles] = useState<LibraryMediaFile[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const existingIdsSet = useMemo(() => new Set(existingMediaIds), [existingMediaIds]);
    const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    useEffect(() => {
        if (open) {
            fetchLibraryFiles();
            setSelectedIds([]);
            setLastSelectedIndex(null);
        }
    }, [open]);

    const parseJsonResponse = async (response: Response) => {
        const contentType = response.headers.get("content-type") ?? "";
        const text = await response.text();
        if (!contentType.includes("application/json")) {
            throw new Error(text || "Received non-JSON response from the server.");
        }
        if (!response.ok) {
            throw new Error(text || "Failed to load library data.");
        }
        return JSON.parse(text);
    };

    const fetchLibraryFiles = async () => {
        setLoadingLibrary(true);
        try {
            const response = await fetch(`/api/media?pageSize=${LIBRARY_PAGE_SIZE}`);
            const payload = await parseJsonResponse(response);
            if (payload.ok !== false && Array.isArray(payload.data)) {
                const imageFiles = payload.data.filter(
                    (file: any) => typeof file === "object" && file.mime_type?.startsWith("image/")
                );
                setLibraryFiles(
                    imageFiles.map((file: any) => ({
                        id: Number(file.id),
                        filename: file.filename ?? null,
                        url: String(file.url ?? PLACEHOLDER_IMAGE),
                        width: file.width ?? null,
                        height: file.height ?? null,
                        mime_type: file.mime_type ?? null,
                    }))
                );
            }
        } catch (error) {
            console.error("Failed to load media library:", error);
            message.error("Failed to load media library");
        } finally {
            setLoadingLibrary(false);
        }
    };

    const resetSelection = () => {
        setSelectedIds([]);
        setLastSelectedIndex(null);
    };

    const handleLibraryClick = (
        event: MouseEvent<HTMLDivElement>,
        index: number,
        mediaId: number
    ) => {
        if (existingIdsSet.has(mediaId)) {
            return;
        }

        if (event.shiftKey && lastSelectedIndex !== null) {
            const rangeStart = Math.min(lastSelectedIndex, index);
            const rangeEnd = Math.max(lastSelectedIndex, index);
            const idsInRange = libraryFiles
                .slice(rangeStart, rangeEnd + 1)
                .map((file) => file.id)
                .filter((id) => !existingIdsSet.has(id));
            setSelectedIds((prev) => {
                const next = new Set(prev);
                idsInRange.forEach((id) => next.add(id));
                return Array.from(next);
            });
        } else if (event.metaKey || event.ctrlKey) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(mediaId)) {
                    next.delete(mediaId);
                } else {
                    next.add(mediaId);
                }
                return Array.from(next);
            });
        } else {
            setSelectedIds([mediaId]);
        }

        setLastSelectedIndex(index);
    };

    const handleConfirmLibrarySelection = () => {
        const entries = selectedIds
            .map((id) => libraryFiles.find((file) => file.id === id))
            .filter((file): file is LibraryMediaFile => Boolean(file))
            .filter((file) => !existingIdsSet.has(file.id))
            .map((file) => ({ mediaId: file.id, url: file.url }));

        const uniqueEntries: GalleryMediaSelection[] = [];
        const seen = new Set<number>();
        for (const entry of entries) {
            if (seen.has(entry.mediaId)) {
                continue;
            }
            seen.add(entry.mediaId);
            uniqueEntries.push(entry);
        }

        if (!uniqueEntries.length) {
            message.info("No new images selected");
            return;
        }

        onConfirmSelection(uniqueEntries);
        message.success(`${uniqueEntries.length} image${uniqueEntries.length > 1 ? "s" : ""} added`);
        resetSelection();
    };

    const handleUploadFiles = async (files: FileList | null) => {
        if (!files?.length) {
            return;
        }

        setUploading(true);
        const uploads: GalleryMediaSelection[] = [];
        try {
            for (let index = 0; index < files.length; index += 1) {
                const file = files[index];
                setUploadStatus(`Uploading ${index + 1} of ${files.length}`);
                const formData = new FormData();
                formData.append("file", file);
                const response = await fetch("/api/media", {
                    method: "POST",
                    body: formData,
                });
                const result = await parseJsonResponse(response);
                if (!response.ok || !result?.data?.id) {
                    const errorMessage = result?.error || "Failed to upload image";
                    throw new Error(errorMessage);
                }
                uploads.push({ mediaId: Number(result.data.id), url: String(result.data.url) });
            }

            if (uploads.length) {
                onConfirmSelection(uploads);
                message.success("Images uploaded successfully");
                fetchLibraryFiles();
            }
        } catch (error) {
            console.error("Gallery upload error:", error);
            message.error(
                error instanceof Error ? error.message : "Failed to upload gallery images"
            );
        } finally {
            setUploading(false);
            setUploadStatus(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
        handleUploadFiles(event.target.files);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const libraryContent = loadingLibrary ? (
        <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
        </div>
    ) : libraryFiles.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24, color: "#888" }}>
            No media files found. Upload images first.
        </div>
    ) : (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 12,
                maxHeight: 420,
                overflowY: "auto",
            }}
        >
            {libraryFiles.map((file, index) => {
                const isExisting = existingIdsSet.has(file.id);
                const isSelected = selectedIdsSet.has(file.id);
                return (
                    <div
                        key={file.id}
                        onClick={(event) => handleLibraryClick(event, index, file.id)}
                        style={{
                            border: isSelected ? "2px solid #1890ff" : "1px solid #d9d9d9",
                            borderRadius: 6,
                            overflow: "hidden",
                            position: "relative",
                            cursor: isExisting ? "not-allowed" : "pointer",
                            backgroundColor: "#fff",
                        }}
                    >
                        <img
                            src={file.url}
                            alt={file.filename || `Image ${file.id}`}
                            style={{
                                width: "100%",
                                height: 110,
                                objectFit: "cover",
                                display: "block",
                                backgroundColor: "#f5f5f5",
                            }}
                        />
                        <div
                            style={{
                                padding: "8px",
                                fontSize: 11,
                                color: "#555",
                            }}
                        >
                            {file.filename || `Image ${file.id}`}
                        </div>
                        {isExisting && (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "rgba(0,0,0,0.55)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontSize: 12,
                                }}
                            >
                                Already added
                            </div>
                        )}
                        {isSelected && !isExisting && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 6,
                                    right: 6,
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    backgroundColor: "#1890ff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontSize: 12,
                                }}
                            >
                                <CheckOutlined />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const uploadContent = (
        <div style={{ padding: "12px 0" }}>
            <Space orientation="vertical" size="small" style={{ width: "100%" }}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleUploadChange}
                />
                <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={handleUploadClick}
                    disabled={uploading}
                >
                    Select files
                </Button>
                <span style={{ color: "#666", fontSize: 12 }}>
                    Upload multiple images at once (no cropping).
                </span>
                {uploading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Spin size="small" />
                        <span style={{ fontSize: 12 }}>{uploadStatus || "Uploading images..."}</span>
                    </div>
                )}
            </Space>
        </div>
    );

    return (
        <Modal
            title="Select gallery images"
            open={open}
            onCancel={() => {
                resetSelection();
                onClose();
            }}
            footer={null}
            width={840}
            destroyOnHidden
            zIndex={1100}
        >
            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as "library" | "upload")}
                items={[
                    {
                        key: "library",
                        label: "Library",
                        children: (
                            <>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 12,
                                    }}
                                >
                                    <span style={{ fontSize: 12, color: "#666" }}>
                                        Hold Shift to select a range; Cmd/Ctrl to toggle individual items.
                                    </span>
                                    <Button
                                        type="primary"
                                        disabled={!selectedIds.length}
                                        onClick={handleConfirmLibrarySelection}
                                    >
                                        Add {selectedIds.length} selected
                                    </Button>
                                </div>
                                {libraryContent}
                            </>
                        ),
                    },
                    {
                        key: "upload",
                        label: "Upload",
                        children: uploadContent,
                    },
                ]}
            />
        </Modal>
    );
}
