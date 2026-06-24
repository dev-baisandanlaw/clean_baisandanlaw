import { NextResponse } from "next/server";
import { createDrive } from "../../createDrive";

type FileRouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: FileRouteContext,
) {
  try {
    const drive = createDrive();
    const { fileId } = await params;

    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
