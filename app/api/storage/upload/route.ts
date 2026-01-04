import { NextResponse } from "next/server";
import { uploadPublicImage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const folder = (form.get("folder") as string) || "";
    const filePath = folder ? `${folder}/${file.name}` : file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadPublicImage(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ url: result.publicUrl, path: result.path });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json(
      { error: (error as Error).message || "Upload failed" },
      { status: 500 },
    );
  }
}

