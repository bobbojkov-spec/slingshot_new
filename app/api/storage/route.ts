import { NextResponse } from "next/server";
import { uploadPublicImage, listPublicImages, getPublicImageUrl } from "@/lib/storage";

export async function GET() {
  try {
    const files = await listPublicImages("", 100);
    const withUrls = files.map((file) => ({
      ...file,
      url: getPublicImageUrl(file.path),
    }));
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Storage list failed", error);
    return NextResponse.json(
      { error: (error as Error).message || "failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file field" },
        { status: 400 },
      );
    }

    const folder = (form.get("folder") as string) || "";
    const filePath = folder ? `${folder}/${file.name}` : file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadPublicImage(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ url: result.publicUrl, path: result.path });
  } catch (error) {
    console.error("Storage upload failed", error);
    return NextResponse.json(
      { error: (error as Error).message || "upload failed" },
      { status: 500 },
    );
  }
}

