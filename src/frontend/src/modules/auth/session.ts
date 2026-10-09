import { z } from "zod";

const authResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ token: z.string().min(1) }),
});

let loginDestination = "/login";

export function getTabToken() {
  return sessionStorage.getItem("authToken");
}

export function subscribeToSession(onChange: () => void) {
  window.addEventListener("auth-session-change", onChange);
  return () => window.removeEventListener("auth-session-change", onChange);
}

export function getLoginDestination() {
  return loginDestination;
}

/**
 * Clear the tab token and notify the app shell.
 * @param expired - Whether Express rejected the session.
 */
export function clearAuthToken(expired = false) {
  loginDestination = expired ? "/login?reason=session-expired" : "/login";
  sessionStorage.removeItem("authToken");
  window.dispatchEvent(new Event("auth-session-change"));
}

/**
 * Save a valid Express token for the current browser tab.
 * @param response - Successful auth response from Express.
 * @returns A promise that ends when the token is stored.
 */
export async function saveAuthToken(response: Response) {
  const body: unknown = await response.json();
  const parsed = authResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Invalid auth response");
  }
  sessionStorage.setItem("authToken", parsed.data.data.token);
  loginDestination = "/login";
  window.dispatchEvent(new Event("auth-session-change"));
}
