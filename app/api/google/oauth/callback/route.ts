import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  console.log(code);
  if (!code)
    return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const redirectUri = "http://localhost:3000/google-service/callback";
  const oauth2 = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const { tokens } = await oauth2.getToken(
    decodeURIComponent(
      "4%2F0AVGzR1Dwl3W6CxZ2fhcMHvIcqctXT6cB75VLY-wAijRMc_5Lep8xzTt3M50j7elSME0SjA"
    )
  );

  return NextResponse.json({
    message: "Token fetched successfully",
    tokens,
  });
}
