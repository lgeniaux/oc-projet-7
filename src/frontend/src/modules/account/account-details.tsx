"use client";

import { Button } from "@/components/ui/button";
import { useProfileQuery } from "@/modules/auth/profile-query";
import { ProfileForm } from "@/modules/account/profile-form";
import { PasswordForm } from "@/modules/account/password-form";

export function AccountDetails() {
  const profile = useProfileQuery();
  if (profile.isPending) {
    return (
      <p role="status" className="mt-6 text-muted">
        Chargement de vos informations…
      </p>
    );
  }
  if (!profile.data) {
    return (
      <div className="mt-6 space-y-4">
        <p role="alert" className="text-link">
          Vos informations sont indisponibles. Réessayez.
        </p>
        <Button
          variant="outline"
          disabled={profile.isFetching}
          onClick={() => void profile.refetch()}
        >
          {profile.isFetching ? "Chargement en cours…" : "Réessayer"}
        </Button>
      </div>
    );
  }
  return (
    <div className="mt-8 space-y-10">
      {profile.isError && (
        <p role="alert" className="text-link">
          L&apos;actualisation de vos informations est indisponible. Vos
          dernières informations restent affichées.
        </p>
      )}
      <ProfileForm profile={profile.data} />
      <div className="border-t border-border pt-8">
        <PasswordForm />
      </div>
    </div>
  );
}
