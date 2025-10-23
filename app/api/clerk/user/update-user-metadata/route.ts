import { CLERK_API_CONFIG } from "@/constants/constants";
import axios from "axios";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, unsafe_metadata } = body;

    if (!userId || !unsafe_metadata) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const response = await axios.patch(
      `${CLERK_API_CONFIG.baseUrl}/users/${userId}/metadata`,
      {
        unsafe_metadata: {
          ...unsafe_metadata,
        },
      },
      { headers: CLERK_API_CONFIG.headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
