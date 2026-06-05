import { baseQueryWithAuth } from "@/lib/baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CreateNewMatterDto,
  MatterListingResponse,
} from "../service-types/type-matter-service";

export const matterService = createApi({
  reducerPath: "matterService",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Matter"],
  endpoints: (builder) => ({
    getAllMatters: builder.query<MatterListingResponse, void>({
      query: () => "/matters/listing",
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
          url: "matters/create",
          body: payload,
        };
      },
      invalidatesTags: ["Matter"],
    }),
  }),
});

export const { useGetAllMattersQuery, useCreateNewMatterMutation } =
  matterService;
