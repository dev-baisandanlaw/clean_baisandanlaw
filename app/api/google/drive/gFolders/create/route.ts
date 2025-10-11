import { NextResponse } from "next/server";
import { createDrive } from "../../createDrive";

export async function POST(request: Request) {
  const { name, parentId } = await request.json();

  const drive = createDrive();

  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id, name, parents",
  });

  return NextResponse.json(res.data);
}
