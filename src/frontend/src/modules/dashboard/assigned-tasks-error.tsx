import { Button } from "@/components/ui/button";

/**
 * Announce a failed read of the assigned tasks and offer a manual retry.
 * @param hasTasks - True when the last tasks are still shown after a failed refresh.
 */
export function AssignedTasksError({
  hasTasks,
  isRetrying,
  onRetry,
}: {
  hasTasks: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <p role="alert" className="text-link">
        {hasTasks
          ? "L’actualisation des tâches assignées est indisponible. Les dernières tâches restent affichées."
          : "Les tâches assignées sont indisponibles pour le moment. Réessayez."}
      </p>
      <Button variant="outline" disabled={isRetrying} onClick={onRetry}>
        {isRetrying ? "Chargement en cours…" : "Réessayer"}
      </Button>
    </div>
  );
}
