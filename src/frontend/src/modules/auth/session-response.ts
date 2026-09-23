import { NextResponse } from "next/server";

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
