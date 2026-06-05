import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const sampleService = createApi({
  reducerPath: "sampleService",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/sample",
  }),
  tagTypes: ["SampleProduct"],
  endpoints: (builder) => ({
    getSample: builder.query<{ id: string }, void>({
      query: () => "/prodcuts",
      providesTags: ["SampleProduct"],
    }),
  }),
});

export const { useGetSampleQuery } = sampleService;
