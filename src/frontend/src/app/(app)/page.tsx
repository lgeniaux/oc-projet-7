import { DashboardAssignedTasks } from "@/modules/dashboard/dashboard-assigned-tasks";
import { DashboardGreeting } from "@/modules/dashboard/dashboard-greeting";

export default function DashboardPage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold">Tableau de bord</h1>
      <DashboardGreeting />
      <DashboardAssignedTasks />
    </>
  );
}
