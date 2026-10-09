"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Share remote data only while the authenticated shell is mounted.
 * @param props - Authenticated app content.
 * @returns The app query provider with a fresh cache for this session.
 */
export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
