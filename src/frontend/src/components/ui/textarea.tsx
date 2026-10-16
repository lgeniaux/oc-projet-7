import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full min-w-0 resize-y rounded-sm border border-border bg-surface px-4 py-3 text-base text-text outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60 aria-invalid:border-link",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
