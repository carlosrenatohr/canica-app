export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

import { forwardRef } from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { FileText } from "lucide-react";

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, actionLabel, onAction, icon: Icon = FileText, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center",
        className,
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
        <Icon className="h-6 w-6 text-secondary" />
      </div>
      <h3 className="text-h3 font-semibold">{title}</h3>
      {description && (
        <p className="text-small text-muted max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  ),
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
