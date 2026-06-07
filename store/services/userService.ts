import { baseQueryWithAuth } from "@/lib/baseQuery";
import { UserReference } from "@/types/user-reference";
import { createApi } from "@reduxjs/toolkit/query/react";

export const userService = createApi({
  reducerPath: "userService",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsersByOrg: builder.query<
      { attorney: UserReference[]; client: UserReference[] },
      { types: string[] }
    >({
      query: ({ types }) => {
        const params = new URLSearchParams();

        types.forEach((id) => {
          params.append("type", id);
        });

        return `/users?${params.toString()}`;
      },
      providesTags: ["Users"],
    }),
  }),
});

export const { useGetUsersByOrgQuery } = userService;
