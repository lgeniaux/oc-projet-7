"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileQuery } from "@/modules/auth/profile-query";
import {
  type Contributor,
  useUserSearchQuery,
} from "@/modules/projects/user-search-query";

export function ContributorPicker({
  selected,
  onChange,
  error,
}: {
  selected: Contributor[];
  onChange: (contributors: Contributor[]) => void;
  error?: string;
}) {
  const profile = useProfileQuery();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const query = search.trim();
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);
  const users = useUserSearchQuery(
    debouncedSearch,
    !!profile.data && query === debouncedSearch,
  );
  const results = (users.data ?? []).filter(
    (user) =>
      user.id !== profile.data?.id &&
      !selected.some((member) => member.id === user.id),
  );
  const isSearching = query.length >= 2;
  const isWaiting = query !== debouncedSearch || users.isPending;

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Contributeurs</h3>
      <p className="text-sm text-muted">
        Les personnes ajoutées auront le rôle de contributeur. Vous serez
        propriétaire du projet.
      </p>
      <Label htmlFor="contributor-search">
        Rechercher un contributeur par e-mail ou nom
      </Label>
      <Input
        id="contributor-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-describedby="contributor-search-status"
        autoComplete="off"
      />
      <div
        id="contributor-search-status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-muted"
      >
        {profile.isPending ? (
          <p role="status">Chargement de votre profil…</p>
        ) : !profile.data ? (
          <p>
            Votre profil est indisponible. La recherche de contributeurs
            nécessite votre identité.
          </p>
        ) : !isSearching ? (
          <p>
            Saisissez au moins 2 caractères pour rechercher un contributeur.
          </p>
        ) : isWaiting ? (
          <p role="status">Recherche en cours…</p>
        ) : users.isError ? (
          <p>La recherche est indisponible. Réessayez.</p>
        ) : results.length === 0 ? (
          <p>Aucun utilisateur trouvé.</p>
        ) : (
          <p>
            {results.length} utilisateur{results.length > 1 ? "s" : ""} trouvé
            {results.length > 1 ? "s" : ""} (10 résultats maximum).
          </p>
        )}
      </div>
      {!profile.isPending && !profile.data && (
        <Button
          type="button"
          variant="outline"
          disabled={profile.isFetching}
          onClick={() => void profile.refetch()}
        >
          Réessayer le profil
        </Button>
      )}
      {profile.data && isSearching && !isWaiting && users.isError && (
        <Button
          type="button"
          variant="outline"
          disabled={users.isFetching}
          onClick={() => void users.refetch()}
        >
          Réessayer la recherche
        </Button>
      )}
      {profile.data &&
        isSearching &&
        !isWaiting &&
        !users.isError &&
        results.length > 0 && (
          <ul
            aria-label="Résultats de recherche"
            className="max-h-60 space-y-2 overflow-y-auto"
          >
            {results.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border p-3"
              >
                <div className="min-w-0 text-sm wrap-anywhere">
                  <p className="font-medium">
                    {user.name?.trim() || user.email}
                  </p>
                  {user.name?.trim() && (
                    <p className="text-muted">{user.email}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Ajouter ${user.name?.trim() || user.email}`}
                  onClick={() => onChange([...selected, user])}
                >
                  Ajouter
                </Button>
              </li>
            ))}
          </ul>
        )}
      {selected.length > 0 && (
        <ul aria-label="Contributeurs sélectionnés" className="space-y-2">
          {selected.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-brand-soft p-3"
            >
              <span className="min-w-0 text-sm wrap-anywhere">
                {user.name?.trim() || user.email} — {user.email}
              </span>
              <Button
                type="button"
                variant="outline"
                aria-label={`Retirer ${user.name?.trim() || user.email}`}
                onClick={() =>
                  onChange(selected.filter((member) => member.id !== user.id))
                }
              >
                Retirer
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-link">
          {error}
        </p>
      )}
    </div>
  );
}
