export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { OAuthProvider } from "node-appwrite";

export async function GET(request) {
  const providerParam = (request.nextUrl.searchParams.get("provider") || "google").toLowerCase();
  const provider = providerParam === "github" ? OAuthProvider.Github : OAuthProvider.Google;

  try {
    const { account } = await createAdminClient();
    const redirectUrl = await account.createOAuth2Token({
      provider,
      success: `${request.nextUrl.origin}/oauth`,
      failure: `${request.nextUrl.origin}/login`,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("OAuth initiation error:", err);
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=oauth_start_failed`);
  }
}