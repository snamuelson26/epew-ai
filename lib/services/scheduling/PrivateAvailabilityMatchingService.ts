import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CoachService } from "@/lib/services/CoachService";
import { CoachWorkloadService } from "@/lib/services/CoachWorkloadService";

type AvailabilityWindow = {
  available_date: string;
  available_from: string;
  available_until: string;
  is_overnight: boolean;
};

type CoachScheduleWindow = {
  day_of_week: number;
  available_from: string;
  available_until: string;
  is_overnight: boolean;
  timezone: string;
};

function hhmmToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToHHMM(value: number) {
  const hours = Math.floor(value / 60) % 24;
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function dayOfWeekFromDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function localDateTimeToUtcIso(
  dateString: string,
  timeString: string,
  timeZone: string
) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.slice(0, 5).split(":").map(Number);

  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(guess)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const renderedUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute)
  );

  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsetMs = renderedUtc - guess.getTime();

  return new Date(desiredUtc - offsetMs).toISOString();
}

export class PrivateAvailabilityMatchingService {
  static async matchAvailability(
    availabilityId: string,
    options: { runSchedulingReview?: boolean } = {}
  ) {
    const { data: availability, error: availabilityError } =
      await supabaseAdmin
        .from("epew_participant_availability")
        .select(
          `
          id,
          application_id,
          coach_assignment_id,
          coach_id,
          participant_timezone,
          meeting_type,
          status,
          scheduling_review_started_at,
          scheduling_review_eligible_at,
          scheduling_review_deadline_at,
          scheduling_review_completed_at
        `
        )
        .eq("id", availabilityId)
        .single();

    if (availabilityError || !availability) {
      throw availabilityError ?? new Error("Availability record not found.");
    }

    const { data: participantWindows, error: participantWindowsError } =
      await supabaseAdmin
        .from("epew_participant_availability_windows")
        .select(
          "available_date, available_from, available_until, is_overnight"
        )
        .eq("availability_id", availabilityId)
        .order("available_date", { ascending: true });

    if (participantWindowsError) {
      throw participantWindowsError;
    }

    const { data: coachWindows, error: coachWindowsError } =
      await supabaseAdmin
        .from("epew_coach_schedule_windows")
        .select(
          "day_of_week, available_from, available_until, is_overnight, timezone"
        )
        .eq("coach_id", availability.coach_id)
        .eq("is_active", true);

    if (coachWindowsError) {
      throw coachWindowsError;
    }

    const { data: coachBlocks, error: coachBlocksError } =
      await supabaseAdmin
        .from("epew_coach_schedule_blocks")
        .select("blocked_from, blocked_until")
        .eq("coach_id", availability.coach_id)
        .eq("is_active", true);

    if (coachBlocksError) {
      throw coachBlocksError;
    }

    const { data: existingMeetings, error: meetingError } =
      await supabaseAdmin
        .from("epew_coach_meetings")
        .select("scheduled_at, follow_up_at, meeting_status")
        .eq("coach_id", availability.coach_id)
        .in("meeting_status", [
          "scheduled",
          "ready_to_start",
          "in_progress",
          "follow_up_required",
        ]);

    if (meetingError) {
      throw meetingError;
    }

    await supabaseAdmin
      .from("epew_private_schedule_matches")
      .delete()
      .eq("availability_id", availabilityId)
      .in("status", ["available", "expired", "withdrawn", "conflict"]);

    const matches: Array<{
      availability_id: string;
      application_id: number;
      coach_assignment_id: string;
      coach_id: string;
      meeting_type: string;
      proposed_start_at: string;
      reserved_until: string;
      reservation_minutes: number;
      status: string;
      exposed_to_participant: boolean;
      matched_by: string;
    }> = [];

    for (const participantWindow of (participantWindows ?? []) as AvailabilityWindow[]) {
      const dayOfWeek = dayOfWeekFromDate(participantWindow.available_date);

      const matchingCoachWindows = (coachWindows ?? []).filter(
        (window: CoachScheduleWindow) => window.day_of_week === dayOfWeek
      );

      for (const coachWindow of matchingCoachWindows as CoachScheduleWindow[]) {
        const participantStart = hhmmToMinutes(participantWindow.available_from);
        const participantEndRaw = hhmmToMinutes(participantWindow.available_until);
        const participantEnd =
          participantWindow.is_overnight || participantEndRaw <= participantStart
            ? participantEndRaw + 24 * 60
            : participantEndRaw;

        const coachStart = hhmmToMinutes(coachWindow.available_from);
        const coachEndRaw = hhmmToMinutes(coachWindow.available_until);
        const coachEnd =
          coachWindow.is_overnight || coachEndRaw <= coachStart
            ? coachEndRaw + 24 * 60
            : coachEndRaw;

        const overlapStart = Math.max(participantStart, coachStart);
        const overlapEnd = Math.min(participantEnd, coachEnd);

        if (overlapEnd - overlapStart < 60) continue;

        let candidate = Math.ceil(overlapStart / 5) * 5;

        while (candidate + 60 <= overlapEnd) {
          const dayOffset = Math.floor(candidate / (24 * 60));
          const localMinutes = candidate % (24 * 60);

          const candidateDate = new Date(
            `${participantWindow.available_date}T00:00:00Z`
          );
          candidateDate.setUTCDate(candidateDate.getUTCDate() + dayOffset);

          const candidateDateString = candidateDate
            .toISOString()
            .slice(0, 10);

          const startIso = localDateTimeToUtcIso(
            candidateDateString,
            minutesToHHMM(localMinutes),
            coachWindow.timezone
          );

          const endIso = new Date(
            new Date(startIso).getTime() + 60 * 60 * 1000
          ).toISOString();

          const startMs = new Date(startIso).getTime();
          const endMs = new Date(endIso).getTime();

          const blocked = (coachBlocks ?? []).some((block) => {
            const blockStart = new Date(block.blocked_from).getTime();
            const blockEnd = new Date(block.blocked_until).getTime();

            return startMs < blockEnd && endMs > blockStart;
          });

          const meetingConflict = (existingMeetings ?? []).some((meeting) => {
            if (!meeting.scheduled_at) return false;

            const meetingStart = new Date(meeting.scheduled_at).getTime();
            const meetingEnd = meeting.follow_up_at
              ? new Date(meeting.follow_up_at).getTime()
              : meetingStart + 60 * 60 * 1000;

            return startMs < meetingEnd && endMs > meetingStart;
          });

          if (!blocked && !meetingConflict) {
            matches.push({
              availability_id: availabilityId,
              application_id: availability.application_id,
              coach_assignment_id: availability.coach_assignment_id,
              coach_id: availability.coach_id,
              meeting_type: availability.meeting_type,
              proposed_start_at: startIso,
              reserved_until: endIso,
              reservation_minutes: 60,
              status: "available",
              exposed_to_participant: true,
              matched_by: "EMCC Private Availability Matching Engine",
            });
          }

          candidate += 5;
        }
      }
    }

    if (matches.length > 0) {
      const unique = Array.from(
        new Map(matches.map((match) => [match.proposed_start_at, match])).values()
      ).slice(0, 12);

      const { error: insertError } = await supabaseAdmin
        .from("epew_private_schedule_matches")
        .insert(unique);

      if (insertError) {
        throw insertError;
      }
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from("epew_participant_availability")
      .update({
        status: matches.length > 0 ? "matched" : "scheduling_review",
        matched_at: matches.length > 0 ? now : null,
        updated_at: now,
      })
      .eq("id", availabilityId);

    if (matches.length === 0) {
      const coachService = new CoachService(supabaseAdmin);
      const availableCoaches = await coachService.getAvailable();

      const eligibleAlternatives =
        CoachWorkloadService.sortByLowestWorkload(
          availableCoaches.filter(
            (coach) =>
              coach.id !== availability.coach_id &&
              CoachWorkloadService.canReceiveAssignments(coach)
          )
        );

      const reviewStartedAt = availability.scheduling_review_started_at
        ? new Date(availability.scheduling_review_started_at)
        : new Date(now);

      const reviewEligibleAt =
        availability.scheduling_review_eligible_at ??
        new Date(
          reviewStartedAt.getTime() + 5 * 60 * 1000
        ).toISOString();

      const reviewDeadlineAt =
        availability.scheduling_review_deadline_at ??
        new Date(
          reviewStartedAt.getTime() + 15 * 60 * 1000
        ).toISOString();

      await supabaseAdmin
        .from("epew_participant_availability")
        .update({
          status: "scheduling_review",
          scheduling_review_started_at:
            availability.scheduling_review_started_at ?? now,
          scheduling_review_eligible_at: reviewEligibleAt,
          scheduling_review_deadline_at: reviewDeadlineAt,
          scheduling_review_completed_at: null,
          updated_at: now,
        })
        .eq("id", availabilityId);

      if (availability.status !== "scheduling_review") {
        await supabaseAdmin
          .from("epew_operational_history")
          .insert({
          application_id: availability.application_id,
          event_type: "alternative_coach_search_prepared",
          event_name: "Alternative Coach Search Prepared",
          event_description:
            "EMCC started a private search across other eligible Personal Coaches because the currently assigned Coach had no compatible appointment.",
          previous_status: "scheduling_review",
          new_status: "scheduling_review",
          occurred_at: now,
          actor_role: "system",
          actor_type: "automation",
          actor_name: "EMCC Scheduling Engine",
          decision_made_by_role: "system",
          decision_made_by_type: "automation",
          decision_made_by_name: "EMCC Scheduling Engine",
          decision_organization: "EPEW",
          decision_reason:
            "No compatible appointment was available with the assigned Personal Coach.",
          decision_at: now,
          executed_by: "EMCC Scheduling Review Engine",
          recorded_by: "EPEW EDE / IBOS",
          source_system: "EMCC Scheduling Engine",
          communication_channel: "system",
          reference_type: "participant_availability",
          reference_id: availabilityId,
          metadata: {
            currentCoachId: availability.coach_id,
            eligibleAlternativeCoachIds:
              eligibleAlternatives.map((coach) => coach.id),
            eligibleAlternativeCoachCount:
              eligibleAlternatives.length,
            reviewEligibleAt,
            reviewDeadlineAt,
            reviewWindowMinutesMinimum: 5,
            reviewWindowMinutesMaximum: 15,
          },
        });
      }

      const reviewMayRun =
        options.runSchedulingReview === true &&
        new Date(now).getTime() >=
          new Date(reviewEligibleAt).getTime();

      if (reviewMayRun) {
        for (const alternativeCoach of eligibleAlternatives) {
        const { data: alternativeWindows, error: alternativeWindowsError } =
          await supabaseAdmin
            .from("epew_coach_schedule_windows")
            .select(
              "day_of_week, available_from, available_until, is_overnight, timezone"
            )
            .eq("coach_id", alternativeCoach.id)
            .eq("is_active", true);

        if (alternativeWindowsError) {
          throw alternativeWindowsError;
        }

        const { data: alternativeBlocks, error: alternativeBlocksError } =
          await supabaseAdmin
            .from("epew_coach_schedule_blocks")
            .select("blocked_from, blocked_until")
            .eq("coach_id", alternativeCoach.id)
            .eq("is_active", true);

        if (alternativeBlocksError) {
          throw alternativeBlocksError;
        }

        const { data: alternativeMeetings, error: alternativeMeetingsError } =
          await supabaseAdmin
            .from("epew_coach_meetings")
            .select("scheduled_at, follow_up_at, meeting_status")
            .eq("coach_id", alternativeCoach.id)
            .in("meeting_status", [
              "scheduled",
              "ready_to_start",
              "in_progress",
              "follow_up_required",
            ]);

        if (alternativeMeetingsError) {
          throw alternativeMeetingsError;
        }

        const alternativeMatches: typeof matches = [];

        for (const participantWindow of (participantWindows ?? []) as AvailabilityWindow[]) {
          const dayOfWeek = dayOfWeekFromDate(
            participantWindow.available_date
          );

          const matchingAlternativeWindows =
            (alternativeWindows ?? []).filter(
              (window: CoachScheduleWindow) =>
                window.day_of_week === dayOfWeek
            );

          for (const coachWindow of matchingAlternativeWindows as CoachScheduleWindow[]) {
            const participantStart =
              hhmmToMinutes(participantWindow.available_from);

            const participantEndRaw =
              hhmmToMinutes(participantWindow.available_until);

            const participantEnd =
              participantWindow.is_overnight ||
              participantEndRaw <= participantStart
                ? participantEndRaw + 24 * 60
                : participantEndRaw;

            const coachStart =
              hhmmToMinutes(coachWindow.available_from);

            const coachEndRaw =
              hhmmToMinutes(coachWindow.available_until);

            const coachEnd =
              coachWindow.is_overnight ||
              coachEndRaw <= coachStart
                ? coachEndRaw + 24 * 60
                : coachEndRaw;

            const overlapStart =
              Math.max(participantStart, coachStart);

            const overlapEnd =
              Math.min(participantEnd, coachEnd);

            if (overlapEnd - overlapStart < 60) continue;

            let candidate =
              Math.ceil(overlapStart / 5) * 5;

            while (candidate + 60 <= overlapEnd) {
              const dayOffset =
                Math.floor(candidate / (24 * 60));

              const localMinutes =
                candidate % (24 * 60);

              const candidateDate = new Date(
                `${participantWindow.available_date}T00:00:00Z`
              );

              candidateDate.setUTCDate(
                candidateDate.getUTCDate() + dayOffset
              );

              const candidateDateString =
                candidateDate.toISOString().slice(0, 10);

              const startIso =
                localDateTimeToUtcIso(
                  candidateDateString,
                  minutesToHHMM(localMinutes),
                  coachWindow.timezone
                );

              const endIso = new Date(
                new Date(startIso).getTime() +
                  60 * 60 * 1000
              ).toISOString();

              const startMs =
                new Date(startIso).getTime();

              const endMs =
                new Date(endIso).getTime();

              const blocked =
                (alternativeBlocks ?? []).some(
                  (block) => {
                    const blockStart =
                      new Date(block.blocked_from).getTime();

                    const blockEnd =
                      new Date(block.blocked_until).getTime();

                    return (
                      startMs < blockEnd &&
                      endMs > blockStart
                    );
                  }
                );

              const meetingConflict =
                (alternativeMeetings ?? []).some(
                  (meeting) => {
                    if (!meeting.scheduled_at) {
                      return false;
                    }

                    const meetingStart =
                      new Date(
                        meeting.scheduled_at
                      ).getTime();

                    const meetingEnd =
                      meeting.follow_up_at
                        ? new Date(
                            meeting.follow_up_at
                          ).getTime()
                        : meetingStart +
                          60 * 60 * 1000;

                    return (
                      startMs < meetingEnd &&
                      endMs > meetingStart
                    );
                  }
                );

              if (!blocked && !meetingConflict) {
                alternativeMatches.push({
                  availability_id: availabilityId,
                  application_id:
                    availability.application_id,
                  coach_assignment_id:
                    availability.coach_assignment_id,
                  coach_id: alternativeCoach.id,
                  meeting_type:
                    availability.meeting_type,
                  proposed_start_at: startIso,
                  reserved_until: endIso,
                  reservation_minutes: 60,
                  status: "available",
                  exposed_to_participant: true,
                  matched_by:
                    "EMCC Scheduling Review Engine",
                });
              }

              candidate += 5;
            }
          }
        }

        if (alternativeMatches.length === 0) {
          continue;
        }

        const uniqueAlternativeMatches =
          Array.from(
            new Map(
              alternativeMatches.map((match) => [
                match.proposed_start_at,
                match,
              ])
            ).values()
          ).slice(0, 12);

        const previousCoachId =
          availability.coach_id;

        const { error: assignmentUpdateError } =
          await supabaseAdmin
            .from("coach_assignments")
            .update({
              coach_id: alternativeCoach.id,
              coach_name: alternativeCoach.fullName,
              coach_email: alternativeCoach.email,
              assignment_method: "reassignment",
              reassignment_reason:
                "EMCC Scheduling Review found no compatible appointment with the previously assigned Coach and identified an eligible Coach with compatible availability.",
              updated_at: now,
            })
            .eq(
              "id",
              availability.coach_assignment_id
            );

        if (assignmentUpdateError) {
          throw assignmentUpdateError;
        }

        await supabaseAdmin
          .from("epew_participant_availability")
          .update({
            coach_id: alternativeCoach.id,
            status: "matched",
            matched_at: now,
            scheduling_review_completed_at: now,
            updated_at: now,
          })
          .eq("id", availabilityId);

        const matchesToInsert =
          uniqueAlternativeMatches.map((match) => ({
            ...match,
            coach_id: alternativeCoach.id,
          }));

        const { error: alternativeInsertError } =
          await supabaseAdmin
            .from("epew_private_schedule_matches")
            .insert(matchesToInsert);

        if (alternativeInsertError) {
          throw alternativeInsertError;
        }

        await supabaseAdmin
          .from("coach_assignment_history")
          .insert({
            assignment_id:
              availability.coach_assignment_id,
            coach_id: alternativeCoach.id,
            previous_coach_id: previousCoachId,
            event_type: "reassigned",
            previous_status: "active",
            new_status: "active",
            reason:
              "EMCC Scheduling Review reassigned the entrepreneur to an eligible Personal Coach with compatible private availability.",
            event_data: {
              applicationId:
                availability.application_id,
              availabilityId,
              previousCoachId,
              newCoachId: alternativeCoach.id,
              reviewEligibleAt,
              reviewDeadlineAt,
              compatibleMatchCount:
                uniqueAlternativeMatches.length,
            },
          });

        await supabaseAdmin
          .from("epew_operational_history")
          .insert({
            application_id:
              availability.application_id,
            event_type: "coach_reassigned_for_scheduling",
            event_name:
              "Personal Coach Reassigned for Scheduling",
            event_description:
              "EMCC reassigned the entrepreneur to another eligible Personal Coach after finding compatible private availability.",
            previous_status: "scheduling_review",
            new_status: "matched",
            occurred_at: now,
            actor_role: "system",
            actor_type: "automation",
            actor_name:
              "EMCC Scheduling Review Engine",
            decision_made_by_role: "system",
            decision_made_by_type: "automation",
            decision_made_by_name:
              "EMCC Scheduling Review Engine",
            decision_organization: "EPEW",
            decision_reason:
              "The previous Coach had no compatible appointment and another eligible Coach had compatible private availability.",
            decision_at: now,
            executed_by:
              "EMCC Scheduling Review Engine",
            recorded_by: "EPEW EDE / IBOS",
            source_system:
              "EMCC Scheduling Engine",
            communication_channel: "system",
            reference_type: "coach_assignment",
            reference_id:
              availability.coach_assignment_id,
            metadata: {
              previousCoachId,
              newCoachId: alternativeCoach.id,
              availabilityId,
              compatibleMatchCount:
                uniqueAlternativeMatches.length,
              reviewEligibleAt,
              reviewDeadlineAt,
            },
          });

        return {
          availabilityId,
          matchCount:
            uniqueAlternativeMatches.length,
          status: "matched",
          reassigned: true,
          previousCoachId,
          coachId: alternativeCoach.id,
        };
        }
      }
    }

    if (
      matches.length === 0 &&
      availability.status !== "scheduling_review"
    ) {
      await supabaseAdmin
        .from("epew_operational_history")
        .insert({
          application_id: availability.application_id,
          event_type: "scheduling_review_started",
          event_name: "Scheduling Review Started",
          event_description:
            "No compatible appointment was found with the currently assigned Personal Coach. EMCC started a private scheduling review.",
          previous_status: "submitted",
          new_status: "scheduling_review",
          occurred_at: now,
          actor_role: "system",
          actor_type: "automation",
          actor_name: "EMCC Scheduling Engine",
          decision_made_by_role: "system",
          decision_made_by_type: "automation",
          decision_made_by_name: "EMCC Scheduling Engine",
          decision_organization: "EPEW",
          decision_reason:
            "No compatible 60-minute appointment was found within the participant's submitted availability.",
          decision_at: now,
          executed_by: "EMCC Private Availability Matching Engine",
          recorded_by: "EPEW EDE / IBOS",
          source_system: "EMCC Scheduling Engine",
          communication_channel: "system",
          reference_type: "participant_availability",
          reference_id: availabilityId,
          metadata: {
            coachId: availability.coach_id,
            coachAssignmentId: availability.coach_assignment_id,
            reviewWindowMinutesMinimum: 5,
            reviewWindowMinutesMaximum: 15,
          },
        });
    }

    return {
      availabilityId,
      matchCount: Math.min(matches.length, 12),
      status:
        matches.length > 0 ? "matched" : "scheduling_review",
    };
  }
}
