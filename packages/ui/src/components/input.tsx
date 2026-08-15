import { forwardRef } from "react";
import { cn } from "../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2.5 text-body text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface aria-invalid:border-danger aria-invalid:focus-visible:ring-danger disabled:cursor-not-allowed disabled:opacity-50 motion-button",
        className,
      )}
      {...props}
      ref={ref}
    />
  ),
);
Input.displayName = "Input";

export { Input };
