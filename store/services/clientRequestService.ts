import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  ApproveClientRequestDto,
  ApproveClientRequestDocumentDto,
  CancelClientRequestDto,
  CompleteClientRequestDto,
  CreateClientRequestDto,
  ClientRequestDetailsResponse,
  ClientRequestRemarksDto,
  ClientRequestListingParams,
  ClientRequestListingResponse,
  ClientRequestTimelineResponse,
  ProcessAgainClientRequestDto,
  UpdateClientRequestDto,
  RejectClientRequestDocumentDto,
  UploadClientRequestFinishedDocumentDto,
  UploadClientRequestPaymentDto,
} from "../service-types/type-client-request-service";

export const clientRequestService = createApi({
  reducerPath: "clientRequestService",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["ClientRequest"],
  endpoints: (builder) => ({
    getClientRequestsListing: builder.query<
      ClientRequestListingResponse,
      ClientRequestListingParams
    >({
      query: (params) => ({
        url: "/client-requests/listing",
        method: "GET",
        params,
      }),
      providesTags: ["ClientRequest"],
    }),

    getClientRequestById: builder.query<ClientRequestDetailsResponse, string>({
      query: (id) => ({
        url: `/client-requests/${id}`,
        method: "GET",
      }),
      providesTags: ["ClientRequest"],
    }),

    getClientRequestTimeline: builder.query<
      ClientRequestTimelineResponse,
      string
    >({
      query: (id) => ({
        url: `/client-requests/${id}/timeline`,
        method: "GET",
      }),
      providesTags: ["ClientRequest"],
    }),

    createClientRequest: builder.mutation<
      { message: string },
      CreateClientRequestDto
    >({
      query: ({ description, file }) => {
        const formData = new FormData();
        formData.append("description", description);

        if (file) {
          formData.append("file", file);
        }

        return {
          url: "/client-requests/create",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["ClientRequest"],
    }),

    updateClientRequest: builder.mutation<
      { message: string },
      UpdateClientRequestDto
    >({
      query: ({ id, description, file, removeInitialFile }) => {
        const formData = new FormData();
        formData.append("description", description);

        if (removeInitialFile) {
          formData.append("removeInitialFile", String(removeInitialFile));
        }

        if (file) {
          formData.append("file", file);
        }

        return {
          url: `/client-requests/update/${id}`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["ClientRequest"],
    }),

    approveClientRequest: builder.mutation<
      { message: string },
      ApproveClientRequestDto
    >({
      query: ({ id, fee }) => ({
        url: `/client-requests/approve/${id}`,
        method: "PATCH",
        body: { fee },
      }),
      invalidatesTags: ["ClientRequest"],
    }),

    sendBackClientRequest: builder.mutation<
      { message: string },
      ClientRequestRemarksDto
    >({
      query: ({ id, remarks }) => ({
        url: `/client-requests/send-back/${id}`,
        method: "PATCH",
        body: { remarks },
      }),
      invalidatesTags: ["ClientRequest"],
    }),

    submitClientRequestPayment: builder.mutation<
      { message: string },
      UploadClientRequestPaymentDto
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file, `receipt-[${file.name}]`);

        return {
          url: `/client-requests/payment/${id}`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["ClientRequest"],
    }),

    approveClientRequestPayment: builder.mutation<
      { message: string },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/client-requests/payment/approve/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["ClientRequest"],
    }),

    uploadClientRequestFinishedDocument: builder.mutation<
      { message: string },
      UploadClientRequestFinishedDocumentDto
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/client-requests/finished-document/${id}`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["ClientRequest"],
    }),

    approveClientRequestDocument: builder.mutation<
      { message: string },
      ApproveClientRequestDocumentDto
    >({
      query: ({ id, ...body }) => ({
        url: `/client-requests/document/approve/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ClientRequest"],
    }),

    rejectClientRequestDocument: builder.mutation<
      { message: string },
      RejectClientRequestDocumentDto
    >({
      query: ({ id, remarks }) => ({
        url: `/client-requests/document/reject/${id}`,
        method: "PATCH",
        body: { remarks },
      }),
      invalidatesTags: ["ClientRequest"],
    }),

    completeClientRequest: builder.mutation<
      { message: string },
      CompleteClientRequestDto
    >({
      query: ({ id, remarks }) => ({
        url: `/client-requests/complete/${id}`,
        method: "PATCH",
        body: { remarks },
      }),
      invalidatesTags: ["ClientRequest"],
    }),

    cancelClientRequest: builder.mutation<
      { message: string },
      CancelClientRequestDto
    >({
      query: ({ id, remarks }) => ({
        url: `/client-requests/cancel/${id}`,
        method: "PATCH",
        body: { remarks },
      }),
      invalidatesTags: ["ClientRequest"],
    }),

    processAgainClientRequest: builder.mutation<
      { message: string },
      ProcessAgainClientRequestDto
    >({
      query: ({ id }) => ({
        url: `/client-requests/process-again/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["ClientRequest"],
    }),
  }),
});

export const {
  useApproveClientRequestDocumentMutation,
  useApproveClientRequestPaymentMutation,
  useApproveClientRequestMutation,
  useCancelClientRequestMutation,
  useCompleteClientRequestMutation,
  useCreateClientRequestMutation,
  useLazyGetClientRequestByIdQuery,
  useGetClientRequestsListingQuery,
  useGetClientRequestTimelineQuery,
  useProcessAgainClientRequestMutation,
  useRejectClientRequestDocumentMutation,
  useSendBackClientRequestMutation,
  useSubmitClientRequestPaymentMutation,
  useUploadClientRequestFinishedDocumentMutation,
  useUpdateClientRequestMutation,
} = clientRequestService;
