import type { Metadata } from "next";
import { AuthPage } from "@/modules/auth/auth-page";
import { LoginForm } from "@/modules/auth/login-form";

export const metadata: Metadata = { title: "Connexion | Abricot" };

export default function LoginPage() {
  return (
    <AuthPage
      title="Connexion"
      image="/auth-login.webp"
      alternateText="Pas encore de compte ?"
      alternateLink="Créer un compte"
      alternateHref="/register"
    >
      <LoginForm />
    </AuthPage>
  );
}
