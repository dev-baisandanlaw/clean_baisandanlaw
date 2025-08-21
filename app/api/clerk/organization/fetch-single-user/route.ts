import { NextResponse } from "next/server";
import axios from "axios";
import { CLERK_API_CONFIG } from "@/constants/constants";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    console.log(userId);

    const { data } = await axios.get(`${CLERK_API_CONFIG.baseUrl}/users`, {
      headers: CLERK_API_CONFIG.headers,
      params: { user_id: userId },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.log(error);
    // return NextResponse.json(
    //   { error: "Failed to fetch users" },
    //   { status: error.response?.status || 500 }
    // );
  }
}
