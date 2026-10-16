import type { Metadata } from "next";
import { AuthPage } from "@/modules/auth/auth-page";
import { LoginForm } from "@/modules/auth/login-form";

export const metadata: Metadata = { title: "Connexion | Abricot" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const { reason } = await searchParams;
  return (
    <AuthPage
      title="Connexion"
      image="/auth-login.webp"
      alternateText="Pas encore de compte ?"
      alternateLink="Créer un compte"
      alternateHref="/register"
    >
      {reason === "session-expired" && (
        <p
          role="status"
          className="mb-6 rounded-sm border border-border bg-surface p-4 text-sm"
        >
          Votre session a expiré. Connectez-vous à nouveau pour continuer.
        </p>
      )}
      <LoginForm />
    </AuthPage>
  );
}
