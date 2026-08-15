import { forwardRef } from "react";
import { cn } from "../lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  privacyMode?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({
    className,
    src,
    alt,
    name,
    size = "md",
    privacyMode = false,
    "aria-label": ariaLabel,
    ...props
  }, ref) => {
    const initials = name
      ? name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "?";

    return (
      <div
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary-bg text-small font-medium text-text",
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? ariaLabel ?? name ?? "Avatar"}
            className={cn(
              "h-full w-full object-cover",
              privacyMode && "grayscale-[0.8] blur-[0.5px]",
            )}
          />
        ) : (
          <span
            role="img"
            aria-label={ariaLabel ?? alt ?? name ?? "Avatar"}
            className="text-caption font-medium text-text"
          >
            {initials}
          </span>
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
