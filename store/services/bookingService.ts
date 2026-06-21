import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import { type CreateBookingDto } from "../service-types/type-booking-service";
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

    uploadBookingReceipt: builder.mutation<
      { fileId: string },
      { file: File; filename: string }
    >({
      query: ({ file, filename }) => {
        const formData = new FormData();
        formData.append("file", file, filename);

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
  useGetBookingSettingsQuery,
  useGetPublicBookingsByMonthQuery,
  useUpdateBookingSettingsMutation,
  useBookNewAppointmentMutation,
  useUploadBookingReceiptMutation,
} = bookingService;
