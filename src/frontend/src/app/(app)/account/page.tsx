import type { Metadata } from "next";
import { AccountDetails } from "@/modules/account/account-details";

export const metadata: Metadata = { title: "Mon compte | Abricot" };

export default function AccountPage() {
  return (
    <section className="rounded-md border border-border bg-surface p-6 sm:p-8">
      <h1 className="font-heading text-2xl font-semibold">Mon compte</h1>
      <AccountDetails />
    </section>
  );
}
