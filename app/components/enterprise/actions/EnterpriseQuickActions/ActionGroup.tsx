"use client";

import { ActionCard } from "./ActionCard";
import { getActionGroupKey } from "./helpers";

import type {
  EnterpriseActionGroup,
} from "./types";

interface ActionGroupProps {
  group: EnterpriseActionGroup;
  columns?: 2 | 3 | 4;
  showDescription?: boolean;
  showCategoryTitle?: boolean;
}

export function ActionGroup({
  group,
  columns = 3,
  showDescription = true,
  showCategoryTitle = true,
}: ActionGroupProps) {
  const gridClass =
    columns === 2
      ? "grid-cols-1 md:grid-cols-2"
      : columns === 4
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  return (
    <section className="space-y-5">
      {showCategoryTitle && (
        <div className="border-b border-white/10 pb-3">
          <h2 className="text-lg font-semibold tracking-wide text-white">
            {group.title}
          </h2>

          {group.description && (
            <p className="mt-1 text-sm text-slate-400">
              {group.description}
            </p>
          )}
        </div>
      )}

      <div className={`grid gap-4 ${gridClass}`}>
        {group.actions.map((action) => (
          <ActionCard
            key={getActionGroupKey(group) + "-" + action.id}
            action={action}
            showDescription={showDescription}
          />
        ))}
      </div>
    </section>
  );
}