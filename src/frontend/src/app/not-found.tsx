import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Page introuvable | Abricot" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center px-6 py-12">
      <Image src="/abricot-logo.svg" alt="Abricot" width={147} height={19} />
      <p className="mt-12 font-heading text-5xl font-semibold text-link">404</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold">
        Page introuvable
      </h1>
      <p className="mt-4 text-muted">
        Cette page n’existe pas ou n’est plus disponible.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center rounded-md bg-action px-6 py-3 text-on-action hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        Retour au tableau de bord
      </Link>
    </main>
  );
}
