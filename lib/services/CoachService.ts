// =======================================================
// EPEW – EDE – IBOS
// Coach Management Engine
// Coach Service
// =======================================================

import { SupabaseClient } from "@supabase/supabase-js";
import {
  Coach,
  CoachStatus,
  CoachCard,
  CoachCapacity,
} from "@/lib/types/coach";

export class CoachService {
  constructor(private readonly supabase: SupabaseClient) {}

  // -------------------------------------------------------
  // Get every coach
  // -------------------------------------------------------

  async getAll(): Promise<Coach[]> {
    const { data, error } = await this.supabase
      .from("epew_coaches")
      .select("*")
      .order("coach_code");

    if (error) throw error;

    return (data ?? []).map(this.mapCoach);
  }

  // -------------------------------------------------------
  // Get one coach
  // -------------------------------------------------------

  async getById(id: string): Promise<Coach | null> {
    const { data, error } = await this.supabase
      .from("epew_coaches")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;

    return this.mapCoach(data);
  }

  // -------------------------------------------------------
  // Available coaches
  // -------------------------------------------------------

  async getAvailable(): Promise<Coach[]> {
    const { data, error } = await this.supabase
      .from("epew_coaches")
      .select("*")
      .eq("status", "available")
      .eq("accepts_automatic_assignments", true)
      .order("active_entrepreneur_count");

    if (error) throw error;

    return (data ?? []).map(this.mapCoach);
  }

  // -------------------------------------------------------
  // Update coach status
  // -------------------------------------------------------

  async updateStatus(
    coachId: string,
    status: CoachStatus
  ): Promise<void> {
    const { error } = await this.supabase
      .from("epew_coaches")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", coachId);

    if (error) throw error;
  }

  // -------------------------------------------------------
  // Dashboard cards
  // -------------------------------------------------------

  async getCards(): Promise<CoachCard[]> {
    const coaches = await this.getAll();

    return coaches.map((coach) => ({
      id: coach.id,
      coachCode: coach.coachCode,
      fullName: coach.fullName,
      email: coach.email,
      photoUrl: coach.photoUrl,
      status: coach.status,
      activeEntrepreneurCount:
        coach.activeEntrepreneurCount,
      maximumCapacity: coach.maximumCapacity,
      workloadPercentage:
        coach.maximumCapacity === 0
          ? 0
          : Math.round(
              (coach.activeEntrepreneurCount /
                coach.maximumCapacity) *
                100
            ),
    }));
  }

  // -------------------------------------------------------
  // Capacity
  // -------------------------------------------------------

  async getCapacity(): Promise<CoachCapacity[]> {
    const coaches = await this.getAll();

    return coaches.map((coach) => ({
      coachId: coach.id,
      fullName: coach.fullName,
      active: coach.activeEntrepreneurCount,
      capacity: coach.maximumCapacity,
      remaining:
        coach.maximumCapacity -
        coach.activeEntrepreneurCount,
      percentage:
        coach.maximumCapacity === 0
          ? 0
          : Math.round(
              (coach.activeEntrepreneurCount /
                coach.maximumCapacity) *
                100
            ),
    }));
  }

  // -------------------------------------------------------
  // Mapping
  // -------------------------------------------------------

  private mapCoach(row: any): Coach {
    return {
      id: row.id,

      coachCode: row.coach_code,

      fullName: row.full_name,

      professionalTitle: row.professional_title,

      secondaryTitle: row.secondary_title,

      organizationName: row.organization_name,

      email: row.email,

      phone: row.phone,

      photoUrl: row.photo_url,

      languages: row.languages ?? [],

      specialties: row.specialties ?? [],

      status: row.status,

     maximumCapacity:
     Number(row.maximum_capacity ?? 0),

     activeEntrepreneurCount:
     Number(row.active_entrepreneur_count ?? 0),

      acceptsAutomaticAssignments:
        row.accepts_automatic_assignments,

      timezone: row.timezone,

      averageCommunicationScore:
        row.average_communication_score,

      averageRelationshipScore:
        row.average_relationship_score,

      lastAssignmentAt:
        row.last_assignment_at,

      createdAt: row.created_at,

      updatedAt: row.updated_at,
    };
  }
}