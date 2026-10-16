"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { authenticatedFetch } from "@/modules/auth/authenticated-fetch";
import { profileResponseSchema } from "@/modules/auth/profile-query";
import { ProjectRequestError } from "@/modules/projects/project-query";

const usersResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    users: z.array(profileResponseSchema.shape.data.shape.user),
  }),
});

export type Contributor = z.infer<
  typeof usersResponseSchema
>["data"]["users"][number];

export function useUserSearchQuery(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["users", "search", query],
    enabled: enabled && query.length >= 2,
    queryFn: async ({ signal }) => {
      const response = await authenticatedFetch(
        `/users/search?query=${encodeURIComponent(query)}`,
        { signal },
      );
      if (!response.ok) throw new ProjectRequestError(response.status);
      const body: unknown = await response.json();
      return usersResponseSchema.parse(body).data.users;
    },
    staleTime: 30_000,
    retry: false,
  });
}
