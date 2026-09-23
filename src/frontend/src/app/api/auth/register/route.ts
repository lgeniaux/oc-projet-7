import {
  authError,
  hasForeignOrigin,
  postToAuthBackend,
  readAuthFields,
  readSessionToken,
} from "@/modules/auth/auth-request";
import { registerSchema } from "@/modules/auth/schemas";
import { createSessionResponse } from "@/modules/auth/session-response";

/**
 * Create an account with Express and set a session cookie.
 * @param request - Sign-up request.
 * @returns Session response or safe error.
 */
export async function POST(request: Request) {
  if (hasForeignOrigin(request)) {
    return authError("Requête non autorisée.", 403);
  }

  const fields = await readAuthFields(request, registerSchema);
  if (!fields) {
    return authError("Données d'inscription invalides.", 400);
  }

  const response = await postToAuthBackend("/auth/register", fields);
  if (!response) {
    return authError("Service temporairement indisponible.", 503);
  }

  if (response.status === 409) {
    return authError("Cette adresse e-mail est déjà utilisée.", 409);
  }
  if (response.status === 400) {
    return authError("Données d'inscription invalides.", 400);
  }
  if (response.status !== 201) {
    console.error("Unexpected auth backend status:", response.status);
    return authError("Service temporairement indisponible.", 503);
  }

  const token = await readSessionToken(response);
  if (!token) {
    return authError("Service temporairement indisponible.", 503);
  }

  return createSessionResponse("Inscription réussie.", token);
}
