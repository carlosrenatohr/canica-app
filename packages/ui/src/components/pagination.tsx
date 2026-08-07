import { forwardRef } from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  current: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

const Pagination = forwardRef<HTMLElement, PaginationProps>(
  ({ className, current, total, pageSize = 10, onPageChange, ...props }, ref) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const showPages = 5;
    let start = Math.max(1, current - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);

    if (end - start < showPages - 1) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("ellipsis");

    return (
      <nav
        ref={ref}
        className={cn("flex items-center justify-center gap-1 text-small", className)}
        {...props}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
        >
          Anterior
        </Button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1.5 text-muted">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === current ? "primary" : "ghost"}
              size="sm"
              className="h-7 w-9"
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          disabled={current === totalPages}
          onClick={() => onPageChange(current + 1)}
        >
          Siguiente
        </Button>
      </nav>
    );
  },
);
Pagination.displayName = "Pagination";

export { Pagination };
