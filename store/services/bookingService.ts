import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import { type CreateBookingDto } from "../service-types/type-booking-service";
import { type Booking } from "@/types/booking";
import {
  type BookingSettings,
  type UpdateBookingSettingsDto,
} from "@/types/bookingSettings";

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
  useDeleteBookingMutation,
  useUploadBookingReceiptMutation,
} = bookingService;
