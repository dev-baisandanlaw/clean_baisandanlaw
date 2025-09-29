import { CLERK_API_CONFIG } from "@/constants/constants";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      practiceAreas,
      role,
    } = body;

    if (!firstName || !lastName || !email || !password || !practiceAreas) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const response = await axios.post(
      `${CLERK_API_CONFIG.baseUrl}/users`,
      {
        first_name: firstName,
        last_name: lastName,
        email_address: [email],
        password,
        unsafe_metadata: {
          role,
          phoneNumber,
          practiceAreas,
        },
      },
      { headers: CLERK_API_CONFIG.headers }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
