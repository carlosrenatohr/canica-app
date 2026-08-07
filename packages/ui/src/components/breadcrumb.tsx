import { forwardRef } from "react";
import { cn } from "../lib/utils";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, ...props }, ref) => (
    <nav
      aria-label="breadcrumb"
      className={cn("flex items-center gap-1 text-small text-muted", className)}
      ref={ref}
      {...props}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {item.href ? (
            <a
              href={item.href}
              className="transition-colors hover:text-text"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-text">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  ),
);
Breadcrumb.displayName = "Breadcrumb";

export { Breadcrumb };
