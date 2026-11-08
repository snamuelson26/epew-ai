// Handle explicit support commands before interview state is read or changed.
export function supportReply(body: string): string | null {
  const command = body.trim().toUpperCase();
  if (!/^(HELP|SUPPORT|MENU)$/.test(command)) return null;
  return "EPEW Support — automated assistance\n\nFor account or application help, sign in and submit your request at https://www.epew.us/entrepreneurs/help. You can track staff replies there.\n\nFor a WhatsApp interview, connect your number at https://www.epew.us/entrepreneurs/whatsapp-interview.\n\nThis WhatsApp reply does not create a support case or connect you to a live coordinator. Do not send passwords or verification codes here. Reply STOP to stop appointment messages.";
}
