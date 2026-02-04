"use client";

import { useEffect, useState } from "react";

type StorageFile = {
  name: string;
  path: string;
  size: number;
  lastModified?: string | null;
  url?: string;
};

export default function AdminStoragePage() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");

  const refreshList = async () => {
    try {
      const response = await fetch("/api/storage");
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Failed to load files", error);
      setStatus("Unable to load storage contents.");
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus("Choose a file first.");
      return;
    }

    setStatus("Uploading…");
    const form = new FormData();
    form.set("file", selectedFile);

    try {
      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Upload failed");
      }

      const data = await response.json();
      setStatus(`Uploaded: ${data.url}`);
      setSelectedFile(null);
      refreshList();
    } catch (error) {
      console.error("Upload failed", error);
      setStatus("Upload failed.");
    }
  };

  return (
    <section className="px-6 py-6">
      <h1 className="text-2xl font-medium mb-4">Storage</h1>
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="font-medium">Upload a file</label>
          <input
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleUpload}
          >
            Upload
          </button>
          {status && <p className="text-sm text-gray-500">{status}</p>}
        </div>
        <div>
          <h2 className="text-lg font-medium mb-2">Bucket contents</h2>
          <div className="border rounded p-4 bg-white shadow-sm">
            {files.length === 0 ? (
              <p className="text-sm text-gray-500">No files yet.</p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-800">
                {files.map((file) => (
                  <li key={file.path} className="flex justify-between">
                    <span>{file.name}</span>
                    {file.url ? (
                      <a
                        className="text-blue-600 underline"
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

