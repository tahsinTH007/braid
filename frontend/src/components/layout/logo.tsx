import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-sidebar" />
      <circle
        cx="19.5"
        cy="16"
        r="7"
        className="stroke-chart-1"
        strokeWidth="3.4"
      />
      <circle
        cx="12.5"
        cy="16"
        r="7"
        className="stroke-primary"
        strokeWidth="3.4"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span
          className={cn(
            "bg-linear-to-r from-primary to-chart-1 bg-clip-text text-lg font-bold tracking-tight text-transparent",
            wordmarkClassName,
          )}
        >
          Braid
        </span>
      )}
    </span>
  );
}
