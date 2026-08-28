import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type IdentifiedCaller = {
  applicationId: number;
  entrepreneurName: string | null;
  businessName: string | null;
  callerPhone: string;
  coachName: string | null;
};

function normalizePhone(value: string) {
  return String(value ?? "")
    .replace(/[^\d+]/g, "")
    .trim();
}

function buildPhoneLookupValues(phone: string) {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/\D/g, "");

  const national =
    digits.length === 11 && digits.startsWith("1")
      ? digits.slice(1)
      : digits;

  return Array.from(
    new Set(
      [
        normalized,
        digits,
        national,
        national ? `+1${national}` : "",
        national ? `1${national}` : "",
      ].filter(Boolean)
    )
  );
}

export class CallerIdentificationService {
  static async identify(
    callerPhone: string
  ): Promise<IdentifiedCaller | null> {
    const normalizedPhone =
      normalizePhone(callerPhone);

    if (!normalizedPhone) {
      return null;
    }

    const lookupValues =
      buildPhoneLookupValues(normalizedPhone);

    const { data, error } = await supabaseAdmin
      .from("entrepreneur_applications")
      .select(`
        id,
        full_name,
        phone,
        business_name,
        coach_name,
        assigned_coach_name,
        created_at
      `)
      .in("phone", lookupValues)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      applicationId: data.id,
      entrepreneurName:
        data.full_name ?? null,
      businessName:
        data.business_name ?? null,
      callerPhone: normalizedPhone,
      coachName:
        String(
          data.assigned_coach_name ??
            data.coach_name ??
            ""
        ).trim() || null,
    };
  }
}
