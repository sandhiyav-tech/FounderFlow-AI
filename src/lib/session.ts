import { cookies, headers } from "next/headers";
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "founderflow_session_id";

export async function getSessionUserId(): Promise<string> {
  // 1. Check for Clerk session if available in headers
  const headerStore = await headers();
  const clerkUserId = headerStore.get("x-clerk-user-id");
  if (clerkUserId) {
    return clerkUserId;
  }

  // 2. Check for custom session header
  const customSessionId = headerStore.get("x-session-id");
  if (customSessionId) {
    return customSessionId;
  }

  // 3. Check for session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (sessionCookie && sessionCookie.value) {
    return sessionCookie.value;
  }

  // 4. Generate a deterministic or fallback anonymous ID
  const newId = `anon_${crypto.randomUUID()}`;
  return newId;
}

