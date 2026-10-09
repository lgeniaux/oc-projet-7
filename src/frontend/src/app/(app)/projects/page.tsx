import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projets | Abricot" };

export default function ProjectsPage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold">Mes projets</h1>
      <p className="mt-4 text-muted">
        La consultation et la gestion de vos projets seront disponibles prochainement.
        Aucun projet n’est affiché pour le moment.
      </p>
    </>
  );
}
