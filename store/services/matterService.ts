import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateNewMatterDto,
  MatterListingResponse,
} from "../service-types/type-matter-service";
import { Matter } from "@/types/matter";

export const matterService = createApi({
  reducerPath: "matterService",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Matter"],
  endpoints: (builder) => ({
    getAllMatters: builder.query<MatterListingResponse, void>({
      query: () => "/matters/listing",
      providesTags: ["Matter"],
    }),

    getSingleMatter: builder.query<
      Matter,
      {
        id: string;
        options?: string[];
      }
    >({
      query: ({ id, options = [] }) => ({
        url: `/matters/${id}`,
        params: {
          options,
        },
      }),
      providesTags: ["Matter"],
    }),

    createNewMatter: builder.mutation<
      { data: { id: string }; message: string },
      CreateNewMatterDto
    >({
      query: (createNewMatterDto) => {
        const payload = {
          ...createNewMatterDto,
        };

        return {
          method: "POST",
          url: "/matters/create",
          body: payload,
        };
      },
      invalidatesTags: ["Matter"],
    }),

    updateMatter: builder.mutation<
      { message: string },
      Partial<CreateNewMatterDto> & { id: string }
    >({
      query: ({ id, ...payload }) => ({
        method: "PATCH",
        url: `/matters/update/${id}`,
        body: payload,
      }),
      invalidatesTags: ["Matter"],
    }),

    uploadMatterDocument: builder.mutation<
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
          url: `/matters/upload/documents/${id}`,
          body: formData,
        };
      },
      invalidatesTags: ["Matter"],
    }),

    deleteMatterDocument: builder.mutation<
      { message: string },
      { id: string; driveId: string }
    >({
      query: ({ id, driveId }) => ({
        method: "DELETE",
        url: `/documents/delete/${id}/${driveId}`,
      }),
      invalidatesTags: ["Matter"],
    }),
  }),
});

export const {
  useGetAllMattersQuery,
  useGetSingleMatterQuery,
  useCreateNewMatterMutation,
  useUpdateMatterMutation,
  useUploadMatterDocumentMutation,
  useDeleteMatterDocumentMutation,
} = matterService;
