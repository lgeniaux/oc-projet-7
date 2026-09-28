"use client";

import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function subscribeToSession(onChange: () => void) {
  window.addEventListener("auth-session-change", onChange);
  return () => window.removeEventListener("auth-session-change", onChange);
}

function hasTabToken() {
  return Boolean(sessionStorage.getItem("authToken"));
}

/**
 * Show the dashboard only when this tab has a token.
 * @returns A loading state or the dashboard entry screen.
 */
export function DashboardSession() {
  const router = useRouter();
  const hasSession = useSyncExternalStore(
    subscribeToSession,
    hasTabToken,
    () => false,
  );

  useEffect(() => {
    if (!sessionStorage.getItem("authToken")) {
      router.replace("/login");
    }
  }, [router]);

  function signOut() {
    sessionStorage.removeItem("authToken");
    window.dispatchEvent(new Event("auth-session-change"));
    router.replace("/login");
  }

  if (!hasSession) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p role="status">Chargement de votre espace…</p>
      </main>
    );
  }

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <Image
            src="/abricot-logo.svg"
            alt="Abricot"
            width={147}
            height={19}
          />
          <Button variant="outline" onClick={signOut}>
            Se déconnecter
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <h1 className="font-heading text-2xl font-semibold">Tableau de bord</h1>
        <p className="mt-4 text-muted">
          Vos projets et vos tâches apparaîtront ici prochainement.
        </p>
      </main>
    </>
  );
}
