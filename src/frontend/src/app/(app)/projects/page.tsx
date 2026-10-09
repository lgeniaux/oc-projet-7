import type { Metadata } from "next";
import { ProjectList } from "@/modules/projects/project-list";

export const metadata: Metadata = { title: "Projets | Abricot" };

export default function ProjectsPage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold">Mes projets</h1>
      <p className="mt-3 text-muted">Gérez vos projets</p>
      <ProjectList />
    </>
  );
}
