import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";

export type DocumentDownloadSource =
  | "appointments"
  | "matters"
  | "retainers"
  | "client-requests";

type DocumentFileResponse = {
  objectUrl: string;
  filename: string;
  mimeType: string;
  extension: string;
};

const getExtensionFromMimeType = (mimeType: string) => {
  const mimeToExtension: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };

  return mimeToExtension[mimeType.toLowerCase().split(";")[0].trim()] || "";
};

const getExtensionFromFilename = (filename: string) => {
  const match = filename.toLowerCase().match(/\.([a-z0-9]{1,5})$/);
  const extension = match?.[1];
  const knownExtensions = new Set([
    "pdf",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "heic",
    "heif",
  ]);

  if (!extension || !knownExtensions.has(extension)) return "";

  return extension === "jpeg" ? "jpg" : extension;
};

const handleDocumentResponse = async (response: Response, fileId: string) => {
  const disposition = response.headers.get("content-disposition");
  const blob = await response.blob();
  const filenameMatch = disposition?.match(
    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
  );
  let filename = fileId;

  if (filenameMatch?.[1]) {
    filename = filenameMatch[1].replace(/['"]/g, "");

    try {
      filename = decodeURIComponent(filename);
    } catch {
      // Keep the header value as-is when it is not URI encoded.
    }
  }

  const mimeType =
    response.headers.get("content-type") ||
    blob.type ||
    "application/octet-stream";

  return {
    objectUrl: URL.createObjectURL(blob),
    filename,
    mimeType,
    extension:
      getExtensionFromFilename(filename) || getExtensionFromMimeType(mimeType),
  };
};

export const documentService = createApi({
  reducerPath: "documentService",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    downloadDocument: builder.mutation<
      DocumentFileResponse,
      { fileId: string; source: DocumentDownloadSource }
    >({
      query: ({ fileId, source }) => ({
        url: `/documents/download/${fileId}`,
        method: "GET",
        params: { source },
        responseHandler: (response) => handleDocumentResponse(response, fileId),
      }),
    }),
  }),
});

export const { useDownloadDocumentMutation } = documentService;
