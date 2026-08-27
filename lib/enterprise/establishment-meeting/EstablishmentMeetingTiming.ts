export const ESTABLISHMENT_MEETING_NO_SHOW_GRACE_MINUTES = 10;

export type EstablishmentMeetingStartWindow = {
  scheduledAt: Date | null;
  opensAt: Date | null;
  closesAt: Date | null;
  isTooEarly: boolean;
  isWithinStartWindow: boolean;
  isPastStartWindow: boolean;
};

export function getEstablishmentMeetingStartWindow(
  scheduledAtValue: string | null | undefined,
  now = new Date()
): EstablishmentMeetingStartWindow {
  if (!scheduledAtValue) {
    return {
      scheduledAt: null,
      opensAt: null,
      closesAt: null,
      isTooEarly: false,
      isWithinStartWindow: false,
      isPastStartWindow: false,
    };
  }

  const scheduledAt = new Date(scheduledAtValue);

  if (Number.isNaN(scheduledAt.getTime())) {
    return {
      scheduledAt: null,
      opensAt: null,
      closesAt: null,
      isTooEarly: false,
      isWithinStartWindow: false,
      isPastStartWindow: false,
    };
  }

  const opensAt = scheduledAt;

  const closesAt = new Date(
    scheduledAt.getTime() +
      ESTABLISHMENT_MEETING_NO_SHOW_GRACE_MINUTES * 60 * 1000
  );

  return {
    scheduledAt,
    opensAt,
    closesAt,
    isTooEarly: now < opensAt,
    isWithinStartWindow:
      now >= opensAt &&
      now < closesAt,
    isPastStartWindow:
      now >= closesAt,
  };
}
