import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getClerkToken } from "@/lib/clerkToken";

export const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  prepareHeaders: async (headers) => {
    const token = await getClerkToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});
