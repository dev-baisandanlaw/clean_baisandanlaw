import { CLERK_API_CONFIG } from "@/constants/constants";
import axios from "axios";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const response = await axios.delete(
      `${CLERK_API_CONFIG.baseUrl}/users/${userId}`,
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
