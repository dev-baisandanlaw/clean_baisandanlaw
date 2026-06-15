import { baseQueryWithAuth } from "@/lib/baseQuery";
import { GenericPaginatedResponse } from "@/types/pagination";
import { UserReference } from "@/types/user-reference";
import { createApi } from "@reduxjs/toolkit/query/react";

export const userService = createApi({
  reducerPath: "userService",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsers: builder.query<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      GenericPaginatedResponse<UserReference & { metadata: any }>,
      {
        page: number;
        organization_id: string;
        search?: string;
        banned?: string;
      }
    >({
      query: ({ page, organization_id, search, banned }) => {
        const params = new URLSearchParams();

        params.append("page", page.toString() || "0");
        params.append("organization_id", organization_id);
        params.append("banned", banned || "false");

        if (search && search.trim().length > 0) {
          params.append("search", search);
        }

        return `users/listing?${params.toString()}`;
      },
      providesTags: ["Users"],
    }),

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

export const { useGetUsersByOrgQuery, useGetUsersQuery } = userService;
