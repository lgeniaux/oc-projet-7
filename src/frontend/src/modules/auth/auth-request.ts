import { NextResponse } from "next/server";
import { z } from "zod";

const sessionPayloadSchema = z.object({
  success: z.literal(true),
  data: z.object({ token: z.string().min(1) }),
});

/**
 * Build a safe auth error.
 * @param message - Message for the user.
 * @param status - HTTP status.
 * @returns JSON response with no cache.
 */
export function authError(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Check the request origin.
 * @param request - Auth request.
 * @returns True if the Origin header has a different origin.
 */
export function hasForeignOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
}

/**
 * Read and validate auth fields.
 * @param request - Auth request.
 * @param schema - Schema for the fields.
 * @returns Valid fields, or null if the body is invalid.
 */
export async function readAuthFields<T>(
  request: Request,
  schema: z.ZodType<T>,
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }

  const parsed = schema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

/**
 * Read a valid token from Express.
 * @param response - Backend success response.
 * @returns Token, or null if the body is invalid.
 */
export async function readSessionToken(response: Response) {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    console.error("Invalid auth backend JSON, status:", response.status);
    return null;
  }

  const parsed = sessionPayloadSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Invalid auth backend payload, status:", response.status);
    return null;
  }

  return parsed.data.data.token;
}
