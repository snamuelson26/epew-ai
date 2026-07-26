import type {
  KpiGridColumns,
  KpiGridProps,
} from "./types";

const columnClasses: Record<KpiGridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6",
};

const gapClasses: Record<
  NonNullable<KpiGridProps["gap"]>,
  string
> = {
  sm: "gap-3",
  md: "gap-4 sm:gap-5",
  lg: "gap-5 sm:gap-6",
};

export function KpiGrid({
  children,
  columns = 4,
  className = "",
  gap = "md",
  ariaLabel = "Key performance indicators",
}: KpiGridProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={[
        "grid w-full",
        columnClasses[columns],
        gapClasses[gap],
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}