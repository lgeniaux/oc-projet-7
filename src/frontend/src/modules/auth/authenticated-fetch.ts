import { clearAuthToken, getTabToken } from "@/modules/auth/session";

/**
 * Call Express with the current tab token. Authenticated calls must use this function.
 * A session-invalid 401 clears the session. The app shell handles the redirect.
 * @param path - Express endpoint path.
 * @param options - Standard fetch options, including an optional abort signal.
 * @returns The Express response. Other errors remain the caller's responsibility.
 */
export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
) {
  const token = getTabToken();
  if (!token) {
    clearAuthToken();
    throw new Error("No tab session");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(new URL(path, process.env.NEXT_PUBLIC_API_URL), {
    ...options,
    headers,
  });
  if (response.status === 401) {
    let isCurrentPasswordError = false;
    try {
      const body: unknown = await response.clone().json();
      // Express also uses 401 for a wrong current password, not an invalid session.
      isCurrentPasswordError =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        body.error === "INVALID_CURRENT_PASSWORD";
    } catch {
      // An unreadable 401 still means that the session was rejected.
    }
    // An old request must not clear a newer session or change a sign-out message.
    if (!isCurrentPasswordError && getTabToken() === token) {
      clearAuthToken(true);
    }
  }
  return response;
}
