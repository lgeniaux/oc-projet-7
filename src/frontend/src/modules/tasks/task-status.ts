/** French label and badge colors for each backend task status. */
export const taskStatuses = {
  TODO: { label: "À faire", className: "bg-status-todo-soft text-status-todo" },
  IN_PROGRESS: {
    label: "En cours",
    className: "bg-status-progress-soft text-status-progress",
  },
  DONE: {
    label: "Terminée",
    className: "bg-status-done-soft text-status-done",
  },
  CANCELLED: { label: "Annulée", className: "bg-border text-text" },
};
