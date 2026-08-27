export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/server/appwrite";
import { getSessionCookieSecret } from "@/lib/env";
import { AUTH_COOKIE_NAME, JWT_COOKIE_NAME, getClientIP, getUserAgent, signCookiePayload } from "@/lib/auth-route-utils";
import { generateDeviceFingerprint, generateJWT, registerDevice } from "@/lib/auth-security";
import { sendSessionSecurityEmail } from "@/lib/server/security-email";
import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";

export async function GET(request) {
  const userId = request.nextUrl.searchParams.get("userId");
  const secret = request.nextUrl.searchParams.get("secret");

  if (!userId || !secret) {
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=missing_params`);
  }

  try {
    const { account, users } = createAdminClient();
    const session = await account.createSession({ userId, secret });
    const accountUser = await users.get({ userId });
    const userAgent = getUserAgent(request);
    const clientIP = getClientIP(request);
    const deviceFingerprint = generateDeviceFingerprint(userAgent, clientIP);
    registerDevice(userId, userAgent, clientIP);
    const accessToken = generateJWT({ userId, sessionId: session.$id, deviceFingerprint });

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });

    const cookiePayload = JSON.stringify({
      sessionId: session.$id,
      secret: session.secret,
      userId,
      email: accountUser.email,
      deviceFingerprint,
      expire: session.expire,
    });
    const encodedPayload = Buffer.from(cookiePayload).toString("base64url");
    const signedValue = `${encodedPayload}.${signCookiePayload(encodedPayload, getSessionCookieSecret())}`;
    cookieStore.set(AUTH_COOKIE_NAME, signedValue, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    cookieStore.set(JWT_COOKIE_NAME, accessToken, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60,
    });

    after(async () => {
      await sendSessionSecurityEmail({
        email: accountUser.email,
        name: accountUser.name,
        sessionId: session.$id,
        ipAddress: clientIP,
        userAgent,
        method: "google",
      }).catch((emailError) => console.warn("[oauth] Security alert email was not sent:", emailError?.message));
    });

    return NextResponse.redirect(`${request.nextUrl.origin}/app/feed`);
  } catch (err) {
    console.error("OAuth session error:", err);
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=session_failed`);
  }
}
