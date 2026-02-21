import { NextResponse } from "next/server";
import axios from "axios";
import { CLERK_API_CONFIG } from "@/constants/constants";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const organizationId = searchParams.get("organization_id");
    const search = searchParams.get("search");
    const banned = searchParams.get("banned"); // "true" | "false" | null (omit for "All")

    const params: Record<string, string> = {};
    if (organizationId) params.organization_id = organizationId;
    if (search) params.query = search;
    if (banned === "true" || banned === "false") params.banned = banned;

    const res = await axios.get(`${CLERK_API_CONFIG.baseUrl}/users/count`, {
      headers: CLERK_API_CONFIG.headers,
      params,
    });

    return NextResponse.json(res.data);
  } catch (error) {
    console.log(error);
    // return NextResponse.json(
    //   { error: "Failed to fetch users" },
    //   { status: error.response?.status || 500 }
    // );
  }
}
