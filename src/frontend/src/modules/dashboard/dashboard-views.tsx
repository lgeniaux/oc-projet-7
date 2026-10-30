"use client";

import { useState } from "react";
import { CalendarDays, Folder, SquareCheckBig } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardAssignedTasks } from "@/modules/dashboard/dashboard-assigned-tasks";
import { DashboardMonthKanban } from "@/modules/dashboard/dashboard-month-kanban";
import { DashboardProjects } from "@/modules/dashboard/dashboard-projects";

/** Switch between the dashboard views. The view is not kept in the URL. */
export function DashboardViews() {
  const [selectedView, setSelectedView] = useState("list");

  return (
    <Tabs
      value={selectedView}
      onValueChange={setSelectedView}
      className="mt-8 gap-6"
    >
      <TabsList aria-label="Vues du tableau de bord">
        <TabsTrigger value="list">
          <SquareCheckBig aria-hidden="true" />
          Liste
        </TabsTrigger>
        <TabsTrigger value="kanban">
          <CalendarDays aria-hidden="true" />
          Kanban
        </TabsTrigger>
        <TabsTrigger value="projects">
          <Folder aria-hidden="true" />
          Projets
        </TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <DashboardAssignedTasks />
      </TabsContent>
      {/* Stay mounted, but hidden, so that the chosen month survives a tab change. */}
      <TabsContent value="kanban" forceMount hidden={selectedView !== "kanban"}>
        <DashboardMonthKanban />
      </TabsContent>
      <TabsContent value="projects">
        <DashboardProjects />
      </TabsContent>
    </Tabs>
  );
}
