import {
  IconFileTypeJpg,
  IconFileTypePdf,
  IconFileTypePng,
  IconFile,
} from "@tabler/icons-react";

export const getMimeTypeIcon = (mimeType: string) => {
  if (mimeType.includes("jpg") || mimeType.includes("jpeg")) {
    return <IconFileTypeJpg color="#33D187" />;
  }

  if (mimeType.includes("pdf")) {
    return <IconFileTypePdf color="#D4AF37" />;
  }

  if (mimeType.includes("png")) {
    return <IconFileTypePng color="#33D187" />;
  }

  return <IconFile color="#33D187" />;
};
