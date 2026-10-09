import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectDetails } from "@/modules/projects/project-details";

export const metadata: Metadata = { title: "Projet | Abricot" };

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Link
        href="/projects"
        className="inline-flex min-h-12 items-center gap-2 rounded-sm text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
        Mes projets
      </Link>
      <ProjectDetails projectId={id} />
    </>
  );
}
