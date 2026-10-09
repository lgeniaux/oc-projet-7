"use client";

import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderOpen, LayoutDashboard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppQueryProvider } from "@/modules/auth/app-query-provider";
import { useProfileQuery } from "@/modules/auth/profile-query";
import {
  clearAuthToken,
  getLoginDestination,
  getTabToken,
  subscribeToSession,
} from "@/modules/auth/session";

const navigation = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/projects", label: "Projets", icon: FolderOpen },
  { href: "/account", label: "Mon compte", icon: UserRound },
];

/**
 * Hide the app pages until the browser reads the tab token.
 * Express, not this presence check, protects the data.
 * @param props - Page content rendered by the server.
 * @returns The shared shell or an announced transition to login.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeToSession,
    getTabToken,
    () => null,
  );

  useEffect(() => {
    if (!getTabToken()) {
      router.replace(getLoginDestination());
    }
  }, [router, token]);

  if (!token) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p role="status">Chargement de votre espace…</p>
      </main>
    );
  }

  return (
    <AppQueryProvider>
      <AppShellContent>{children}</AppShellContent>
    </AppQueryProvider>
  );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const profile = useProfileQuery();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-surface p-3 text-link focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:outline-2 focus:outline-link"
      >
        Aller au contenu
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:flex-nowrap">
          <Image
            src="/abricot-logo.svg"
            alt="Abricot"
            width={147}
            height={19}
          />
          <nav
            aria-label="Navigation principale"
            className="order-last w-full lg:order-none lg:w-auto"
          >
            <ul className="flex flex-wrap gap-2">
              {navigation.map(({ href, label, icon: Icon }) => {
                // Every path starts with "/", so the home link must match exactly.
                const isCurrent =
                  pathname === href ||
                  (href !== "/" && pathname.startsWith(`${href}/`));
                return (
                  <li key={href} className="flex-1 sm:flex-none">
                    <Link
                      href={href}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-md px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link sm:px-5 sm:text-base ${
                        isCurrent
                          ? "bg-action text-on-action"
                          : "text-link hover:bg-background"
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-5 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Button variant="outline" onClick={() => clearAuthToken()}>
            Se déconnecter
          </Button>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 focus-visible:outline-2 focus-visible:outline-link sm:px-10 sm:py-14"
      >
        {profile.data?.name && (
          <p className="mb-4 text-sm text-muted">Bonjour {profile.data.name}</p>
        )}
        {profile.isError && (
          <p role="status" className="mb-4 text-sm text-muted">
            Votre profil est indisponible pour le moment. Réessayez plus tard.
          </p>
        )}
        {children}
      </main>
      <footer className="border-t border-border bg-surface px-6 py-5 text-sm text-muted sm:px-10">
        <div className="mx-auto max-w-7xl">Abricot</div>
      </footer>
    </div>
  );
}
