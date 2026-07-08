import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateNewMatterDto,
  CreateNewMatterTaskDto,
  MatterScheduleDateQuery,
  MatterScheduleResponse,
  MatterListingResponse,
  UpsertMatterScheduleDto,
} from "../service-types/type-matter-service";
import { Matter, MatterSchedule } from "@/types/matter";
import { Booking } from "@/types/booking";

export const matterService = createApi({
  reducerPath: "matterService",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Matter"],
  endpoints: (builder) => ({
    getAllMatters: builder.query<
      MatterListingResponse,
      { page: number; limit: number; search?: string }
    >({
      query: ({ page, limit, search }) => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        params.append("search", search?.trim() || "");

        return `/matters/listing?${params.toString()}`;
      },
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

    createNewMatterTask: builder.mutation<
      { message: string },
      CreateNewMatterTaskDto
    >({
      query: (dto) => ({
        url: "/matter-tasks/create",
        body: dto,
        method: "POST",
      }),
      invalidatesTags: ["Matter"],
    }),

    deleteMatterTask: builder.mutation<
      { message: string },
      { matterId: string; taskId: string }
    >({
      query: ({ matterId, taskId }) => ({
        url: `/matter-tasks/delete/${matterId}/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Matter"],
    }),

    completeMatterTask: builder.mutation<
      { message: string },
      { matterId: string; taskId: string }
    >({
      query: ({ matterId, taskId }) => ({
        url: `/matter-tasks/complete/${matterId}`,
        body: { taskId },
        method: "PATCH",
      }),
      invalidatesTags: ["Matter"],
    }),

    getMatterLeadAttorneyAppointmentsByDate: builder.query<
      Booking[],
      { caseId: string } & MatterScheduleDateQuery
    >({
      query: ({ caseId, date }) => ({
        url: `/matter-schedules/matter/${caseId}/lead-attorney-appointments`,
        params: { date },
      }),
    }),

    getAttorneyMatterSchedulesByDate: builder.query<
      MatterSchedule[],
      { attorneyId: string; date: string }
    >({
      query: ({ attorneyId, date }) => ({
        url: "/matter-schedules/attorney/date",
        params: { attorneyId, date },
      }),
    }),

    createMatterSchedule: builder.mutation<
      MatterScheduleResponse,
      UpsertMatterScheduleDto
    >({
      query: (dto) => ({
        url: "/matter-schedules/create",
        body: dto,
        method: "POST",
      }),
      invalidatesTags: ["Matter"],
    }),

    updateMatterSchedule: builder.mutation<
      MatterScheduleResponse,
      Partial<UpsertMatterScheduleDto> & { id: string }
    >({
      query: ({ id, ...payload }) => ({
        url: `/matter-schedules/update/${id}`,
        body: payload,
        method: "PATCH",
      }),
      invalidatesTags: ["Matter"],
    }),

    deleteMatterSchedule: builder.mutation<{ message: string }, { id: string }>(
      {
        query: ({ id }) => ({
          url: `/matter-schedules/delete/${id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Matter"],
      },
    ),
  }),
});

export const {
  // Matters
  useGetAllMattersQuery,
  useGetSingleMatterQuery,
  useCreateNewMatterMutation,
  useUpdateMatterMutation,

  // Documents
  useUploadMatterDocumentMutation,
  useDeleteMatterDocumentMutation,

  // Tasks
  useCreateNewMatterTaskMutation,
  useDeleteMatterTaskMutation,
  useCompleteMatterTaskMutation,

  // Schedules
  useGetMatterLeadAttorneyAppointmentsByDateQuery,
  useGetAttorneyMatterSchedulesByDateQuery,
  useCreateMatterScheduleMutation,
  useUpdateMatterScheduleMutation,
  useDeleteMatterScheduleMutation,
} = matterService;
