const PHONE_AUDIO_BASE = "/audio/phone";

export const ApprovedAudioRegistry = {
  ht: {
    languageSelection:
      `${PHONE_AUDIO_BASE}/ht-language-selection.mp3`,

    accountConfirmation:
      `${PHONE_AUDIO_BASE}/ht-account-confirmation.mp3`,

    noMeetingScheduleOffer:
      `${PHONE_AUDIO_BASE}/ht-no-meeting-schedule-offer.mp3`,

    scheduleAvailability:
      `${PHONE_AUDIO_BASE}/ht-schedule-availability.mp3`,

    connectingCoach:
      `${PHONE_AUDIO_BASE}/ht-connecting-coach.mp3`,

    memberAssistanceMenu:
      `${PHONE_AUDIO_BASE}/ht-member-assistance-menu.mp3`,

    goodbye:
      `${PHONE_AUDIO_BASE}/ht-goodbye.mp3`,
  },
} as const;

export type HaitianApprovedAudioKey =
  keyof typeof ApprovedAudioRegistry.ht;

export function approvedHaitianAudioUrl(
  publicBaseUrl: string,
  key: HaitianApprovedAudioKey
) {
  const base = publicBaseUrl.replace(/\/+$/, "");

  return `${base}${ApprovedAudioRegistry.ht[key]}`;
}
