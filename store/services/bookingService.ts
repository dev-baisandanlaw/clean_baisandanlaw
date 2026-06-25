import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import { type CreateBookingDto } from "../service-types/type-booking-service";
import { type Booking } from "@/types/booking";
import {
  type BookingSettings,
  type UpdateBookingSettingsDto,
} from "@/types/bookingSettings";

type ReceiptFileResponse = {
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

const getExtensionFromFileSignature = async (blob: Blob) => {
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const ascii = String.fromCharCode(...bytes);

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }

  if (ascii.startsWith("%PDF")) {
    return "pdf";
  }

  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") {
    return "webp";
  }

  if (ascii.slice(4, 8) === "ftyp") {
    return "heic";
  }

  return "";
};

export const bookingService = createApi({
  reducerPath: "bookingService",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Booking", "Settings"],
  endpoints: (builder) => ({
    getBookingSettings: builder.query<BookingSettings, void>({
      query: () => ({
        url: "/bookings/settings",
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),

    getPublicBookingsByMonth: builder.query<
      { date: string; time: string }[],
      { month: string }
    >({
      query: ({ month }) => ({
        url: "/bookings/public/month",
        method: "GET",
        params: { month },
      }),
      providesTags: ["Booking"],
    }),

    getBookingsByMonth: builder.query<Booking[], { month: string }>({
      query: ({ month }) => ({
        url: "/bookings",
        method: "GET",
        params: { month },
      }),
      providesTags: ["Booking"],
    }),

    getPendingAttorneyAssignmentBookings: builder.query<
      Pick<Booking, "id" | "date" | "time">[],
      void
    >({
      query: () => ({
        url: "/bookings/pending-attorney-assignment",
        method: "GET",
      }),
      providesTags: ["Booking"],
    }),

    updateBookingSettings: builder.mutation<
      { message: string },
      UpdateBookingSettingsDto
    >({
      query: (payload) => ({
        url: "/bookings/settings/update",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Settings"],
    }),

    bookNewAppointment: builder.mutation<{ message: string }, CreateBookingDto>(
      {
        query: ({ ...payload }) => {
          return {
            url: "/bookings/book",
            method: "POST",
            body: payload,
          };
        },
        invalidatesTags: ["Booking"],
      },
    ),

    manualBookNewAppointment: builder.mutation<
      { message: string },
      CreateBookingDto
    >({
      query: (payload) => ({
        url: "/bookings/book/manual",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Booking"],
    }),

    manualUpdateBooking: builder.mutation<
      { message: string },
      Partial<CreateBookingDto> & { id: string }
    >({
      query: ({ id, ...payload }) => ({
        url: `/bookings/book/manual/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Booking"],
    }),

    approveBookingReceipt: builder.mutation<
      { message: string },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/bookings/receipt/approve/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Booking"],
    }),

    downloadBookingReceipt: builder.mutation<
      ReceiptFileResponse,
      { receiptFileId: string }
    >({
      query: ({ receiptFileId }) => ({
        url: `/bookings/receipt/download/${receiptFileId}`,
        method: "GET",
        responseHandler: async (response) => {
          const disposition = response.headers.get("content-disposition");
          const blob = await response.blob();
          const filenameMatch = disposition?.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
          );
          let filename = receiptFileId;

          if (filenameMatch?.[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");

            try {
              filename = decodeURIComponent(filename);
            } catch {
              // Keep the header value as-is when it is not URI encoded.
            }
          }

          return {
            objectUrl: URL.createObjectURL(blob),
            filename,
            mimeType:
              response.headers.get("content-type") ||
              blob.type ||
              "application/octet-stream",
            extension:
              getExtensionFromFilename(filename) ||
              getExtensionFromMimeType(
                response.headers.get("content-type") || blob.type,
              ) ||
              (await getExtensionFromFileSignature(blob)),
          };
        },
      }),
    }),

    deleteBooking: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/bookings/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Booking"],
    }),

    uploadBookingReceipt: builder.mutation<
      { fileId: string },
      { file: File; filename: string }
    >({
      query: ({ file, filename }) => {
        const formData = new FormData();
        const extension = file.name.split(".").pop();
        const uploadFilename =
          extension && extension !== file.name
            ? `${filename}.${extension}`
            : filename;

        formData.append("file", file, uploadFilename);

        return {
          method: "POST",
          url: "/documents/upload/receipt",
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetBookingsByMonthQuery,
  useGetBookingSettingsQuery,
  useGetPendingAttorneyAssignmentBookingsQuery,
  useGetPublicBookingsByMonthQuery,
  useUpdateBookingSettingsMutation,
  useBookNewAppointmentMutation,
  useManualBookNewAppointmentMutation,
  useManualUpdateBookingMutation,
  useApproveBookingReceiptMutation,
  useDownloadBookingReceiptMutation,
  useDeleteBookingMutation,
  useUploadBookingReceiptMutation,
} = bookingService;
