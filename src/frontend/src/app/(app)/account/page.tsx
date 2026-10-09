import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mon compte | Abricot" };

export default function AccountPage() {
  return (
    <section className="rounded-md border border-border bg-surface p-6 sm:p-8">
      <h1 className="font-heading text-2xl font-semibold">Mon compte</h1>
      <p className="mt-4 text-muted">
        La modification de vos informations personnelles sera disponible prochainement.
        Aucun formulaire de modification n’est encore disponible.
      </p>
    </section>
  );
}
