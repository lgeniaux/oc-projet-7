import type { Metadata } from "next";
import { AuthPage } from "@/modules/auth/auth-page";
import { RegisterForm } from "@/modules/auth/register-form";

export const metadata: Metadata = { title: "Inscription | Abricot" };

export default function RegisterPage() {
  return (
    <AuthPage
      title="Inscription"
      image="/auth-register.webp"
      alternateText="Déjà inscrit ?"
      alternateLink="Se connecter"
      alternateHref="/login"
    >
      <RegisterForm />
    </AuthPage>
  );
}
