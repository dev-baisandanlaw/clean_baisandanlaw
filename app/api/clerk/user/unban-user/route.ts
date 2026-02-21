import { CLERK_API_CONFIG } from "@/constants/constants";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const response = await axios.post(
      `${CLERK_API_CONFIG.baseUrl}/users/${userId}/unban`,
      {},
      {
        headers: CLERK_API_CONFIG.headers,
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.response?.data || error?.message },
      { status: error?.response?.status || 500 }
    );
  }
}

