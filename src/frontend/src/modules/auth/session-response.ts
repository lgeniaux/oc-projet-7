import { NextResponse } from "next/server";

/**
 * Set the session cookie. Do not put the token in JSON.
 * @param message - Success message for the user.
 * @param token - JWT from Express.
 * @returns Response with an HttpOnly cookie and no cache.
 */
export function createSessionResponse(message: string, token: string) {
  const response = NextResponse.json(
    { message },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
