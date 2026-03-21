import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    return NextResponse.json({
      message: "Success! Copy the refresh_token below and add it to GOOGLE_REFRESH_TOKEN in .env.local and Vercel.",
      refresh_token: tokens.refresh_token,
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
  }
}
