import {
  authError,
  hasForeignOrigin,
  readAuthFields,
  readSessionToken,
} from "@/modules/auth/auth-request";
import { loginSchema } from "@/modules/auth/schemas";
import { createSessionResponse } from "@/modules/auth/session-response";

/**
 * Sign in with Express and set a session cookie.
 * @param request - Login request.
 * @returns Session response or safe error.
 */
export async function POST(request: Request) {
  if (hasForeignOrigin(request)) {
    return authError("Requête non autorisée.", 403);
  }

  const credentials = await readAuthFields(request, loginSchema);
  if (!credentials) {
    return authError("Données de connexion invalides.", 400);
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error("BACKEND_URL is not configured");
    return authError("Service temporairement indisponible.", 503);
  }

  let response: Response;
  try {
    response = await fetch(new URL("/auth/login", backendUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
  } catch {
    console.error("Auth backend unavailable: /auth/login");
    return authError("Service temporairement indisponible.", 503);
  }

  if (response.status === 401) {
    return authError("E-mail ou mot de passe incorrect.", 401);
  }
  if (response.status === 400) {
    return authError("Données de connexion invalides.", 400);
  }
  if (!response.ok) {
    console.error("Unexpected auth backend status:", response.status);
    return authError("Service temporairement indisponible.", 503);
  }

  const token = await readSessionToken(response);
  if (!token) {
    return authError("Service temporairement indisponible.", 503);
  }

  return createSessionResponse("Connexion réussie.", token);
}
