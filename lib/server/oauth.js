"use server";

import { createAdminClient } from "@/lib/server/appwrite";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { OAuthProvider } from "node-appwrite";

async function signInWithProvider(provider) {
  const { account } = await createAdminClient();
  const headerStore = await headers();
  const origin = process.env.NEXT_PUBLIC_APP_URL || headerStore.get("origin");

  if (!origin) {
    throw new Error("Unable to determine request origin for OAuth redirect.");
  }

  const redirectUrl = await account.createOAuth2Token({
    provider,
    success: `${origin.replace(/\/$/, "")}/oauth`,
    failure: `${origin.replace(/\/$/, "")}/login?error=oauth_failed`,
  });

  return redirect(redirectUrl);
}

export async function signInWithGoogle() {
  return signInWithProvider(OAuthProvider.Google);
}
