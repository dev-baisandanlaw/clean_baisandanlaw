import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateNewRetainerDto,
  RetainerListingResponse,
  UpdateRetainerDto,
} from "../service-types/type-retainer-service";
import { Retainer } from "@/types/retainer-new";

export const retainerService = createApi({
  reducerPath: "retainerService",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Retainer"],
  endpoints: (builder) => ({
    getAllRetainers: builder.query<RetainerListingResponse, void>({
      query: () => "/retainers/listing",
      providesTags: ["Retainer"],
    }),

    getSingleRetainer: builder.query<
      Retainer,
      { id: string; options?: string[] }
    >({
      query: ({ id, options }) => ({
        url: `retainers/${id}`,
        params: { options },
      }),
      providesTags: ["Retainer"],
    }),

    createRetainer: builder.mutation<
      { message: string; id: string },
      CreateNewRetainerDto
    >({
      query: (createRetainerDto) => {
        return {
          method: "POST",
          url: "/retainers/create",
          body: {
            ...createRetainerDto,
          },
        };
      },
      invalidatesTags: ["Retainer"],
    }),

    updateRetainer: builder.mutation<{ message: string }, UpdateRetainerDto>({
      query: ({ id, ...payload }) => ({
        method: "PATCH",
        url: `/retainers/update/${id}`,
        body: payload,
      }),
      invalidatesTags: ["Retainer"],
    }),

    uploadRetainerDocuments: builder.mutation<
      { failedUploads: number; successfulUploads: number },
      {
        id: string;
        files: File[];
      }
    >({
      query: ({ id, files }) => {
        const formData = new FormData();

        files.forEach((file) => {
          formData.append("files", file);
        });

        return {
          method: "POST",
          url: `/retainers/upload/documents/${id}`,
          body: formData,
        };
      },
      invalidatesTags: ["Retainer"],
    }),

    deleteRetainerDocument: builder.mutation<
      { message: string },
      { id: string; driveId: string }
    >({
      query: ({ id, driveId }) => ({
        method: "DELETE",
        url: `/documents/delete/${id}/${driveId}`,
      }),
      invalidatesTags: ["Retainer"],
    }),
  }),
});

export const {
  // Retainers
  useGetAllRetainersQuery,
  useGetSingleRetainerQuery,
  useCreateRetainerMutation,
  useUpdateRetainerMutation,

  // Documents
  useUploadRetainerDocumentsMutation,
  useDeleteRetainerDocumentMutation,
} = retainerService;
