import { NextResponse } from "next/server";
import { createDrive } from "../../createDrive";

export async function DELETE(
  _request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const drive = createDrive();
    const { fileId } = params;

    // Delete the file
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
      { status: 500 }
    );
  }
}
