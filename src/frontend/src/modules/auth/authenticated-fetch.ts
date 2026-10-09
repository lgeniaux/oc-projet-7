import { clearAuthToken, getTabToken } from "@/modules/auth/session";

/**
 * Call Express with the current tab token. Authenticated calls must use this function.
 * A 401 clears the session. The app shell handles the redirect.
 * @param path - Express endpoint path.
 * @param options - Standard fetch options, including an optional abort signal.
 * @returns The Express response. Other errors remain the caller's responsibility.
 */
export async function authenticatedFetch(path: string, options: RequestInit = {}) {
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
  // An old request must not clear a newer session or change a sign-out message.
  if (response.status === 401 && getTabToken() === token) {
    clearAuthToken(true);
  }
  return response;
}
