import { NextResponse } from "next/server";
import { createDrive } from "../createDrive";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const folderId = searchParams.get("folderId");
  const _fields = searchParams.get("fields");
  const _search = searchParams.get("search");

  const q = `${folderId ? `'${folderId}' in parents and ` : ""}mimeType = 'application/vnd.google-apps.folder' and trashed = false${_search ? ` and name contains '${_search}'` : ""}`;
  let fields = "files(id, name, parents)";

  if (_fields) {
    fields = _fields;
  }

  const drive = createDrive();
  const res = await drive.files.list({
    q: q,
    fields: fields,
  });

  return NextResponse.json(res.data.files);
}
