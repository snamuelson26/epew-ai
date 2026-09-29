export function whatsappNumber(value: string): string | null {
  const clean = value.replace(/^whatsapp:/i, "").replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(clean) ? clean : null;
}
export function whatsappSender() {
  return whatsappNumber(
    process.env.TWILIO_WHATSAPP_FROM_NUMBER?.trim() ||
      process.env.EPEW_TWILIO_WHATSAPP_NUMBER?.trim() ||
      "",
  );
}
export function whatsappReadiness() {
  return {
    messaging: Boolean(
      whatsappSender() &&
        process.env.EPEW_WHATSAPP_INTERVIEWS_ENABLED === "true",
    ),
    calling: Boolean(
      whatsappSender() && process.env.EPEW_WHATSAPP_CALLING_ENABLED === "true",
    ),
  };
}
export const languageMenu =
  "Which language would you like to use?\n1 — English\n2 — Kreyòl ayisyen\n3 — Español\n4 — Français\nReply with a number. / Reponn ak yon chif. / Responda con un número. / Répondez avec un chiffre.";
