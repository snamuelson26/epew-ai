import type { EnterpriseHeroStat } from "./types";

interface HeroStatsProps {
  stats: EnterpriseHeroStat[];
}

const statusStyles: Record<
  NonNullable<EnterpriseHeroStat["status"]>,
  string
> = {
  default: "border-white/10 bg-white/[0.07] text-white",
  success:
    "border-emerald-300/20 bg-emerald-400/10 text-emerald-50",
  warning: "border-amber-300/20 bg-amber-400/10 text-amber-50",
  danger: "border-red-300/20 bg-red-400/10 text-red-50",
  info: "border-blue-300/20 bg-blue-400/10 text-blue-50",
};

export function HeroStats({ stats }: HeroStatsProps) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Page statistics"
    >
      {stats.map((stat, index) => {
        const status = stat.status ?? "default";

        return (
          <article
            key={`${stat.label}-${index}`}
            className={[
              "group rounded-2xl border px-4 py-4 shadow-sm backdrop-blur-md transition-all duration-200",
              "hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg",
              statusStyles[status],
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                  {stat.label}
                </p>

                <p className="mt-2 break-words text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {stat.value}
                </p>
              </div>

              {stat.icon ? (
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition-transform duration-200 group-hover:scale-105"
                >
                  {stat.icon}
                </div>
              ) : null}
            </div>

            {stat.description ? (
              <p className="mt-2 text-sm leading-5 text-white/60">
                {stat.description}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}