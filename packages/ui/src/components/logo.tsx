import { cn } from "../lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showWord?: boolean;
}

export function Logo({ size = 32, className, showWord = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Canica"
      >
        {/* Outer ring — clinical precision */}
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-primary"
          fill="none"
        />
        {/* Inner C — connected intelligence */}
        <path
          d="M26 13C22.5 10.5 17.5 10.5 14 13C10.5 15.5 9 20 9 20C9 20 10.5 24.5 14 27C17.5 29.5 22.5 29.5 26 27"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-accent"
          fill="none"
        />
        {/* Node dot — intelligence marker */}
        <circle cx="26" cy="13" r="2.5" className="fill-info" />
      </svg>
      {showWord && (
        <span className="text-xl font-semibold tracking-tight text-primary">
          Canica
        </span>
      )}
    </div>
  );
}
