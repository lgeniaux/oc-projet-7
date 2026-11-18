import type { Metadata } from "next";
import { DashboardGreeting } from "@/modules/dashboard/dashboard-greeting";
import { DashboardViews } from "@/modules/dashboard/dashboard-views";
import { ProjectCreation } from "@/modules/projects/project-creation";

export const metadata: Metadata = { title: "Tableau de bord | Abricot" };

export default function DashboardPage() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Tableau de bord
          </h1>
          <DashboardGreeting />
        </div>
        <ProjectCreation />
      </div>
      <DashboardViews />
    </>
  );
}
