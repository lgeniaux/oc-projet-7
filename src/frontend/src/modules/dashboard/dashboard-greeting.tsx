"use client";

import { useProfileQuery } from "@/modules/auth/profile-query";

/** Greet the user under the dashboard title, as in the dashboard mockup. */
export function DashboardGreeting() {
  const profile = useProfileQuery();
  const name = profile.data?.name?.trim();

  return (
    <p className="mt-2 text-muted">
      {name ? `Bonjour ${name}, voici` : "Voici"} un aperçu de vos projets et
      tâches
    </p>
  );
}
