import { NextResponse } from "next/server";
import { createDrive } from "../../createDrive";

type FileRouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(
  _request: Request,
  { params }: FileRouteContext,
) {
  try {
    const drive = createDrive(true);
    const { fileId } = await params;

    const meta = await drive.files.get({
      fileId,
      fields: "name, mimeType",
      supportsAllDrives: true,
    });

    const name = meta.data.name || "file";
    const mime = meta.data.mimeType || "application/octet-stream";

    const { data } = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" },
    );

    const headers = new Headers({
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${name}"`,
    });

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
