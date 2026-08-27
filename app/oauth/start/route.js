export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/server/appwrite";
import { NextResponse } from "next/server";
import { OAuthProvider } from "node-appwrite";

export async function GET(request) {
  const providerParam = (request.nextUrl.searchParams.get("provider") || "google").toLowerCase();
  if (providerParam !== "google") {
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=unsupported_provider`);
  }
  const provider = OAuthProvider.Google;

  try {
    const { account } = createAdminClient();
    const configuredOrigin = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
    const redirectUrl = await account.createOAuth2Token({
      provider,
      success: `${configuredOrigin}/oauth`,
      failure: `${configuredOrigin}/login?error=oauth_failed`,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("OAuth initiation error:", err);
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=oauth_start_failed`);
  }
}
