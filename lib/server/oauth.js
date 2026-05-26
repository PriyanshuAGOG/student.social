"use server";

import { createAdminClient } from "@/lib/server/appwrite";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { OAuthProvider } from "node-appwrite";

async function signInWithProvider(provider) {
  const { account } = await createAdminClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

  if (!origin) {
    throw new Error("Unable to determine request origin for OAuth redirect.");
  }

  const redirectUrl = await account.createOAuth2Token({
    provider,
    success: `${origin}/oauth`,
    failure: `${origin}/login`,
  });

  return redirect(redirectUrl);
}

export async function signInWithGoogle() {
  return signInWithProvider(OAuthProvider.Google);
}

export async function signInWithGitHub() {
  return signInWithProvider(OAuthProvider.Github);
}