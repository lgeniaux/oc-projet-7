import { NextResponse } from "next/server";
import { createSessionResponse } from "@/modules/auth/session-response";
import { loginSchema } from "@/modules/auth/schemas";

interface LoginResponse {
  success: boolean;
  data?: { token?: string };
  error?: string;
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

  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return errorResponse("Données de connexion invalides.", 400);
  }

  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) {
    return errorResponse("Données de connexion invalides.", 400);
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return errorResponse("Service temporairement indisponible.", 503);
  }

  let response: Response;
  try {
    response = await fetch(new URL("/auth/login", backendUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
      }),
      cache: "no-store",
    });
  } catch {
    return errorResponse("Service temporairement indisponible.", 503);
  }

  if (response.status === 401) {
    return errorResponse("E-mail ou mot de passe incorrect.", 401);
  }
  if (response.status === 400) {
    return errorResponse("Données de connexion invalides.", 400);
  }
  if (!response.ok) {
    return errorResponse("Service temporairement indisponible.", 503);
  }

  let result: LoginResponse;
  try {
    result = (await response.json()) as LoginResponse;
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

  return createSessionResponse("Connexion réussie.", result.data.token);
}
