/**
 * ============================================================
 * EPEW Enterprise Operating System (EOS) v1.0
 * Financial Core
 * ------------------------------------------------------------
 * Participation Engine
 *
 * Official owner of supporter participation records.
 * ============================================================
 */

import { EnterpriseEngine } from "../core/engine";
import { EnterpriseContext, Contribution } from "../core/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface ParticipationResult {
  participationId: string;
  action: "created" | "updated";
}

export class ParticipationEngine extends EnterpriseEngine<
  Contribution,
  ParticipationResult
> {
  constructor() {
    super("Participation Engine");
  }

  protected async execute(
    context: EnterpriseContext,
    contribution: Contribution
  ): Promise<ParticipationResult> {
    const weeklyAmount = contribution.units * 100;
    const monthlyAmount = weeklyAmount * 4;
    const annualCommitment = weeklyAmount * 52;

    const { data: existing } = await supabaseAdmin
      .from("supporter_participations")
      .select("id")
      .eq("supporter_id", contribution.supporterId)
      .eq("entrepreneur_id", contribution.entrepreneurId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("supporter_participations")
        .update({
          units: contribution.units,
          weekly_amount: weeklyAmount,
          monthly_amount: monthlyAmount,
          annual_commitment: annualCommitment,
          payment_frequency: contribution.frequency,
          automatic_payment_active: true,
          participation_status: "Active",
          participation_agreement_accepted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        throw error;
      }

      return {
        participationId: existing.id,
        action: "updated",
      };
    }

    const { data, error } = await supabaseAdmin
      .from("supporter_participations")
      .insert({
        supporter_id: contribution.supporterId,
        entrepreneur_id: contribution.entrepreneurId,
        units: contribution.units,
        weekly_amount: weeklyAmount,
        monthly_amount: monthlyAmount,
        annual_commitment: annualCommitment,
        payment_frequency: contribution.frequency,
        automatic_payment_active: true,
        participation_status: "Active",
        participation_agreement_accepted: true,
        created_at: contribution.createdAt,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return {
      participationId: data.id,
      action: "created",
    };
  }
}

export const participationEngine =
  new ParticipationEngine();