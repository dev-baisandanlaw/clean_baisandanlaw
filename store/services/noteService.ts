import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import { matterService } from "./matterService";

export const noteService = createApi({
  reducerPath: "noteService",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Notes"],
  endpoints: (builder) => ({
    createNote: builder.mutation<
      { message: string },
      { note: string; retainerId?: string; matterId?: string }
    >({
      query: ({ note, matterId, retainerId }) => {
        return {
          method: "POST",
          url: "/notes/create",
          body: {
            note,
            matterId: matterId || null,
            retainerId: retainerId || null,
          },
        };
      },
      invalidatesTags: ["Notes"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(matterService.util.invalidateTags(["Matter"]));
      },
    }),

    deleteNote: builder.mutation<
      { message: string },
      { slug: string; slugId: string; noteId: string }
    >({
      query: ({ slug, slugId, noteId }) => {
        return {
          url: `notes/delete/${slug}/${slugId}/${noteId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["Notes"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(matterService.util.invalidateTags(["Matter"]));
      },
    }),

    updateNote: builder.mutation<
      { message: string },
      { slug: string; slugId: string; noteId: string; note: string }
    >({
      query: ({ slug, slugId, noteId, note }) => {
        return {
          url: `notes/update/${slug}/${slugId}/${noteId}`,
          method: "PATCH",
          body: { note },
        };
      },
      invalidatesTags: ["Notes"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(matterService.util.invalidateTags(["Matter"]));
      },
    }),
  }),
});

export const {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useUpdateNoteMutation,
} = noteService;
