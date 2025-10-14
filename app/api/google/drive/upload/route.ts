import { NextResponse } from "next/server";
import { createDrive } from "../createDrive";
import { Readable } from "node:stream";

export const maxDuration = 60;

// function fileToStream(file: File): Readable {
//   // Convert Web File to Node Readable stream
//   return Readable.from(Buffer.from(await file.arrayBuffer()));
// }

export async function POST(request: Request) {
  try {
    const drive = createDrive();

    const form = await request.formData();
    const parentId = form.get("parentId") as string;
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const res = await drive.files.create({
      requestBody: {
        name: file.name,
        mimeType: file.type,
        parents: [parentId],
      },
      media: {
        mimeType: file.type,
        body: Readable.from(Buffer.from(await file.arrayBuffer())),
      },
      fields: "id, name, parents",
    });

    return NextResponse.json({ uploadedFiles: res.data }, { status: 200 });
  } catch (error) {
    console.error("Error uploading files to Google Drive:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
