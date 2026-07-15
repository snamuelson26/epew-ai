import { supabase } from "@/lib/supabase";
import type { IBOSTimelineEvent } from "./types";

export async function createIBOSTimelineEvent(event: IBOSTimelineEvent) {
  const { error } = await supabase.from("ibos_timeline").insert({
    entrepreneur_id: event.entrepreneurId,
    event_title: event.eventTitle,
    event_description: event.eventDescription || "",
    previous_stage: event.previousStage,
    current_stage: event.currentStage,
    next_stage: event.nextStage,
    created_by: event.createdBy,
    created_at: event.createdAt || new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}