import { forwardRef } from "react";
import { cn } from "../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-[var(--radius-card)] bg-secondary-bg",
        className,
      )}
      {...props}
    />
  );
}
Skeleton.displayName = "Skeleton";

export { Skeleton };
