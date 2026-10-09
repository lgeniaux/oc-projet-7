"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";

export const profileResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string().nullable().optional(),
    }),
  }),
});

export type Profile = z.infer<typeof profileResponseSchema>["data"]["user"];
export const profileQueryKey = ["profile"] as const;

export function useProfileQuery() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: async ({ signal }) => {
      const response = await authenticatedFetch("/auth/profile", { signal });
      if (!response.ok) throw new Error("Profile unavailable");
      const body: unknown = await response.json();
      return profileResponseSchema.parse(body).data.user;
    },
    staleTime: 60_000,
    retry: false,
  });
}
