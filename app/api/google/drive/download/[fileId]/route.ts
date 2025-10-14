import { NextResponse } from "next/server";
import { createDrive } from "../../createDrive";

export async function GET(
  _request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const drive = createDrive();
    const fileId = params.fileId;

    // Get metadata
    const meta = await drive.files.get({
      fileId,
      fields: "name, mimeType",
      supportsAllDrives: true,
    });

    const name = meta.data.name || "file";
    const mime = meta.data.mimeType || "application/octet-stream";

    // Stream file content
    const { data } = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );

    const headers = new Headers({
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${name}"`,
    });

    // ✅ Wrap Node.js stream into a web Response for Next.js
    const readableStream = new ReadableStream({
      start(controller) {
        data.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        data.on("end", () => controller.close());
        data.on("error", (err: Error) => controller.error(err));
      },
    });

    return new NextResponse(readableStream, { headers });
  } catch (error) {
    console.error("Drive download error:", error);
    return new NextResponse("Failed to download file", { status: 500 });
  }
}
