import { DashboardGreeting } from "@/modules/dashboard/dashboard-greeting";

export default function DashboardPage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold">Tableau de bord</h1>
      <DashboardGreeting />
      <p className="mt-4 text-muted">
        Vos projets et vos tâches apparaîtront ici prochainement.
      </p>
    </>
  );
}
