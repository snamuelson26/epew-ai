import type { EnterpriseHeroBadge } from "./types";

interface HeroBadgeProps {
  badge: EnterpriseHeroBadge;
}

export function HeroBadge({ badge }: HeroBadgeProps) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm backdrop-blur-md sm:px-4">
      {badge.icon ? (
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center"
        >
          {badge.icon}
        </span>
      ) : null}

      <span className="truncate">{badge.label}</span>
    </div>
  );
}