import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Contribution } from "../core/types";

export async function updateSupporterProjection(
  contribution: Contribution
) {
  const supporterId = contribution.supporterId;

  const { data: transactions, error } = await supabaseAdmin
    .from("supporter_transactions")
    .select("*")
    .eq("supporter_id", supporterId)
    .eq("status", "paid");

  if (error) throw error;

  const totalContributions =
    transactions?.reduce(
      (sum, tx: any) => sum + Number(tx.amount || 0),
      0
    ) || 0;

  const activeUnitCommitments =
    transactions?.reduce(
      (sum, tx: any) => sum + Number(tx.units || 0),
      0
    ) || 0;

  const totalAnnualUnits = activeUnitCommitments * 52;

  const businessesSupported = new Set(
    transactions?.map((tx: any) => tx.entrepreneur_id).filter(Boolean)
  ).size;

  const activeCommitments =
    transactions?.filter((tx: any) =>
      ["weekly", "monthly", "annual"].includes(tx.frequency)
    ).length || 0;

  const now = new Date().toISOString();

  const { error: upsertError } = await supabaseAdmin
    .from("supporter_projections")
    .upsert(
      {
        supporter_id: supporterId,
        total_contributions: totalContributions,
        total_units: totalAnnualUnits,
        active_commitments: activeCommitments,
        businesses_supported: businessesSupported,
        last_contribution_date: now,
        updated_at: now,
      },
      { onConflict: "supporter_id" }
    );

  if (upsertError) throw upsertError;

  return {
    supporterId,
    totalContributions,
    totalUnits: totalAnnualUnits,
    activeCommitments,
    businessesSupported,
    lastContributionDate: now,
  };
}