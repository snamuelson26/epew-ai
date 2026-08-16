import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
  static async matchAvailability(availabilityId: string) {
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
          status
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

    await supabaseAdmin
      .from("epew_participant_availability")
      .update({
        status: matches.length > 0 ? "matched" : "submitted",
        matched_at: matches.length > 0 ? new Date().toISOString() : null,
      })
      .eq("id", availabilityId);

    return {
      availabilityId,
      matchCount: Math.min(matches.length, 12),
    };
  }
}
