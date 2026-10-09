import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-sm border border-border bg-surface px-4 text-base text-text outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60 aria-invalid:border-link",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
