import Image from "next/image";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-10 lg:px-12">
      <header>
        <Image
          src="/abricot-logo.svg"
          alt="Abricot"
          width={147}
          height={19}
          priority
        />
      </header>

      <div className="grid flex-1 items-center gap-10 py-16 md:grid-cols-2 md:gap-16">
        <div className="space-y-5">
          <p className="text-sm font-medium text-link">
            Gestion de projets collaborative
          </p>
          <h1 className="font-heading text-3xl leading-tight font-semibold sm:text-4xl">
            Vos projets, en toute clarté.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted">
            Abricot vous aidera bientôt à organiser vos projets et vos tâches
            avec votre équipe.
          </p>
        </div>

        <section
          className="rounded-md border border-border bg-surface p-6 sm:p-8"
          aria-labelledby="preview-title"
        >
          <FolderKanban aria-hidden="true" className="mb-5 size-7 text-brand" />
          <h2 id="preview-title" className="font-heading text-xl font-semibold">
            Votre espace de travail
          </h2>
          <p className="mt-3 mb-7 leading-relaxed text-muted">
            Retrouvez ici vos projets et suivez leur avancement.
          </p>
          <Button disabled>Disponible prochainement</Button>
        </section>
      </div>
    </main>
  );
}
