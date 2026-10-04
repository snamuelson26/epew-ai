export type Appointment = {
  source_key: string; application_id: number | null; starts_at: string;
  email: string; recipient_name: string | null; language: string;
  title: string; portal_url: string;
};
const copy = {
  en: { subject: 'Appointment reminder', stages: ['one week', '24 hours', 'one hour'], intro: 'Your appointment is coming up in', date: 'Date and time', zone: 'New York time', open: 'Open EPEW', help: 'Please check your appointment details in your portal. If you cannot attend, contact your coordinator to reschedule.' },
  fr: { subject: 'Rappel de rendez-vous', stages: ['une semaine', '24 heures', 'une heure'], intro: 'Votre rendez-vous est prévu dans', date: 'Date et heure', zone: 'Heure de New York', open: 'Ouvrir EPEW', help: 'Consultez les détails de votre rendez-vous dans votre portail. Si vous ne pouvez pas y assister, contactez votre coordinateur pour le reporter.' },
  ht: { subject: 'Rapèl randevou', stages: ['yon semèn', '24 èdtan', 'yon èdtan'], intro: 'Randevou ou ap fèt nan', date: 'Dat ak lè', zone: 'Lè New York', open: 'Louvri EPEW', help: 'Tanpri verifye detay randevou a nan pòtal ou. Si ou pa ka patisipe, kontakte kowòdonatè ou pou chanje dat la.' },
  es: { subject: 'Recordatorio de cita', stages: ['una semana', '24 horas', 'una hora'], intro: 'Su cita será dentro de', date: 'Fecha y hora', zone: 'Hora de Nueva York', open: 'Abrir EPEW', help: 'Revise los detalles de su cita en su portal. Si no puede asistir, contacte a su coordinador para reprogramarla.' },
};
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}
export function reminderEmail(a: Appointment, hours: number) {
  const raw = a.language.toLowerCase();
  const lang = raw.startsWith('fr') ? 'fr' : raw.startsWith('es') ? 'es' : /^(ht|creole|haitian|krey)/.test(raw) ? 'ht' : 'en';
  const c = copy[lang];
  const stage = c.stages[hours === 168 ? 0 : hours === 24 ? 1 : 2];
  const when = new Intl.DateTimeFormat(lang === 'ht' ? 'fr-HT' : lang, {
    timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short',
  }).format(new Date(a.starts_at));
  const subject = `${c.subject} — ${stage}`;
  const url = a.portal_url.startsWith('https://www.epew.us/') || a.portal_url === 'https://www.epew.us' ? a.portal_url : 'https://www.epew.us';
  const text = `${a.recipient_name || ''}\n${c.intro} ${stage}.\n${a.title}\n${c.date}: ${when} (${c.zone}, America/New_York)\n${c.help}\n${url}`;
  const html = `<html lang="${lang}"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033"><h1>${c.subject}</h1><p>${escapeHtml(a.recipient_name || '')}</p><p>${c.intro} <strong>${stage}</strong>.</p><h2>${escapeHtml(a.title)}</h2><p>${c.date}: <strong>${escapeHtml(when)}</strong><br>${c.zone} (America/New_York)</p><p>${c.help}</p><p><a href="${escapeHtml(url)}">${c.open}</a></p><p>EPEW</p></body></html>`;
  return {subject,text,html};
}
