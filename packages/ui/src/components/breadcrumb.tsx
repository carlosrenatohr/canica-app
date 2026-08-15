import { forwardRef } from "react";
import { cn } from "../lib/utils";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, ...props }, ref) => (
    <nav
      aria-label="Navegación de ruta"
      className={cn("flex items-center gap-1 text-small text-muted", className)}
      ref={ref}
      {...props}
    >
      <ol className="flex items-center gap-1">
        {items.map((item, i) => (
          <li key={`${item.href ?? "current"}-${item.label}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden="true" className="h-3 w-3" />}
            {item.href ? (
              <a
                href={item.href}
                aria-current={i === items.length - 1 ? "page" : undefined}
                className="rounded-sm transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {item.label}
              </a>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-text">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  ),
);
Breadcrumb.displayName = "Breadcrumb";

export { Breadcrumb };
