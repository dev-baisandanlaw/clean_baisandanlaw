import { baseQueryWithAuth } from "@/lib/baseQuery";
import { GenericPaginatedResponse } from "@/types/pagination";
import { UserReference } from "@/types/user-reference";
import { createApi } from "@reduxjs/toolkit/query/react";

export type CreateAttorneyPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  practiceAreas: string[];
};

export type CreateAttorneyResponse = {
  message: string;
};

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

    addNewAttorney: builder.mutation<
      CreateAttorneyResponse,
      CreateAttorneyPayload
    >({
      query: (body) => ({
        url: "/users/attorneys",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    banAttorney: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/users/attorneys/ban/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users"],
    }),

    unBanAttorney: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/users/attorneys/unban/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUsersByOrgQuery,
  useGetUsersQuery,
  useAddNewAttorneyMutation,
  useBanAttorneyMutation,
  useUnBanAttorneyMutation,
} = userService;
