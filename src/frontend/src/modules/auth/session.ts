import { z } from "zod";

const authResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ token: z.string().min(1) }),
});

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
}
