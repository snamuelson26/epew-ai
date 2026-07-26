import { HeroActions } from "./HeroActions";
import { HeroBadge } from "./HeroBadge";
import { HeroStats } from "./HeroStats";
import type {
  EnterpriseHeroVariant,
  HeroSectionProps,
} from "./types";

const variantStyles: Record<EnterpriseHeroVariant, string> = {
  emerald:
    "from-emerald-950 via-slate-950 to-slate-950 border-emerald-500/20",
  gold: "from-amber-950 via-slate-950 to-slate-950 border-amber-500/20",
  blue: "from-blue-950 via-slate-950 to-slate-950 border-blue-500/20",
  purple:
    "from-purple-950 via-slate-950 to-slate-950 border-purple-500/20",
  slate: "from-slate-900 via-slate-950 to-black border-slate-700/60",
};

const glowStyles: Record<EnterpriseHeroVariant, string> = {
  emerald: "bg-emerald-400/20",
  gold: "bg-amber-300/20",
  blue: "bg-blue-400/20",
  purple: "bg-purple-400/20",
  slate: "bg-slate-400/10",
};

export function HeroSection({
  badge,
  eyebrow,
  title,
  description,
  actions = [],
  stats = [],
  variant = "emerald",
  children,
  className = "",
  compact = false,
  showPattern = true,
}: HeroSectionProps) {
  return (
    <section
      className={[
        "relative isolate overflow-hidden rounded-[28px] border bg-gradient-to-br text-white shadow-2xl shadow-black/20",
        variantStyles[variant],
        className,
      ].join(" ")}
      aria-labelledby="enterprise-hero-title"
    >
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl",
          glowStyles[variant],
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full blur-3xl",
          glowStyles[variant],
        ].join(" ")}
      />

      {showPattern ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      ) : null}

      <div
        className={[
          "relative z-10",
          compact
            ? "px-5 py-6 sm:px-7 sm:py-8 lg:px-9"
            : "px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12",
        ].join(" ")}
      >
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              {badge ? <HeroBadge badge={badge} /> : null}

              {eyebrow ? (
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  {eyebrow}
                </p>
              ) : null}
            </div>

            <h1
              id="enterprise-hero-title"
              className={[
                "mt-5 max-w-5xl font-black tracking-[-0.04em] text-white",
                compact
                  ? "text-3xl sm:text-4xl lg:text-5xl"
                  : "text-4xl sm:text-5xl lg:text-6xl",
              ].join(" ")}
            >
              {title}
            </h1>

            {description ? (
              <p
                className={[
                  "mt-4 max-w-4xl leading-7 text-slate-300",
                  compact ? "text-sm sm:text-base" : "text-base sm:text-lg",
                ].join(" ")}
              >
                {description}
              </p>
            ) : null}

            {children ? <div className="mt-6">{children}</div> : null}
          </div>

          {actions.length > 0 ? (
            <div className="xl:max-w-md">
              <HeroActions actions={actions} />
            </div>
          ) : null}
        </div>

        {stats.length > 0 ? (
          <div className="mt-8 border-t border-white/10 pt-6">
            <HeroStats stats={stats} />
          </div>
        ) : null}
      </div>
    </section>
  );
}