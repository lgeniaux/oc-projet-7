import { NextResponse } from "next/server";
import { createSessionResponse } from "@/modules/auth/session-response";
import { registerSchema } from "@/modules/auth/schemas";

interface RegisterResponse {
  success: boolean;
  data?: { token?: string };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return errorResponse("Requête non autorisée.", 403);
  }

  let fields: unknown;
  try {
    fields = await request.json();
  } catch {
    return errorResponse("Données d'inscription invalides.", 400);
  }

  const parsed = registerSchema.safeParse(fields);
  if (!parsed.success) {
    return errorResponse("Données d'inscription invalides.", 400);
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return errorResponse("Service temporairement indisponible.", 503);
  }

  let response: Response;
  try {
    response = await fetch(new URL("/auth/register", backendUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return errorResponse("Service temporairement indisponible.", 503);
  }

  if (response.status === 409) {
    return errorResponse("Cette adresse e-mail est déjà utilisée.", 409);
  }
  if (response.status === 400) {
    return errorResponse("Données d'inscription invalides.", 400);
  }
  if (response.status !== 201) {
    return errorResponse("Service temporairement indisponible.", 503);
  }

  let result: RegisterResponse;
  try {
    result = (await response.json()) as RegisterResponse;
  } catch {
    return errorResponse("Service temporairement indisponible.", 503);
  }

  if (
    !result ||
    result.success !== true ||
    typeof result.data?.token !== "string" ||
    !result.data.token
  ) {
    return errorResponse("Service temporairement indisponible.", 503);
  }

  return createSessionResponse("Inscription réussie.", result.data.token);
}
