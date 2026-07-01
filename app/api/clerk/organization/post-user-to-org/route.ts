import { NextResponse } from "next/server";
import axios from "axios";
import { CLERK_API_CONFIG } from "@/constants/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, organization_id } = body;

    if (!user_id || !organization_id) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const response = await axios.post(
      `${CLERK_API_CONFIG.baseUrl}/organizations/${organization_id}/memberships`,
      { role: "org:member", user_id },
      { headers: CLERK_API_CONFIG.headers },
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const isAxiosError = axios.isAxiosError(error);
    const status = isAxiosError ? error.response?.status : undefined;
    const errorDetails = isAxiosError
      ? error.response?.data || error.message
      : error instanceof Error
        ? error.message
        : error;

    console.error(errorDetails);

    return NextResponse.json(
      { error: "Failed to post user to org" },
      { status: status || 500 },
    );
  }
}
