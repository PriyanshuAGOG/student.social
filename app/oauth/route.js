export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/server/appwrite";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const userId = request.nextUrl.searchParams.get("userId");
  const secret = request.nextUrl.searchParams.get("secret");

  if (!userId || !secret) {
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=missing_params`);
  }

  try {
    const { account } = await createAdminClient();
    const session = await account.createSession({ userId, secret });

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return NextResponse.redirect(`${request.nextUrl.origin}/`);
  } catch (err) {
    console.error("OAuth session error:", err);
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=session_failed`);
  }
}