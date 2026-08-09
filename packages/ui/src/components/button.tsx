import { forwardRef } from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
        secondary: "bg-accent text-white hover:opacity-90 shadow-md hover:shadow-lg dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
        outline: "border border-border bg-transparent hover:bg-accent/5",
        ghost: "border-transparent hover:bg-accent/5",
        danger: "bg-danger text-white hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-small",
        default: "h-11 px-4 text-body",
        lg: "h-12 px-6 text-body",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          "rounded-[var(--radius-button)] motion-button",
        )}
        {...props}
        ref={ref}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
