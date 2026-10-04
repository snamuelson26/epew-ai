export function reminderLanguage(raw:string) { return /^(ht|haitian|krey|creole)/i.test(raw)?'ht':/^(fr|french)/i.test(raw)?'fr':/^(es|spanish)/i.test(raw)?'es':'en'; }
export const reminderTemplates = {
 en:'EPEW appointment reminder: your appointment is {{1}} on {{2}} (New York time). Review your appointment details at https://www.epew.us. Contact your coordinator if you need to reschedule. Reply STOP to stop appointment messages.',
 fr:'Rappel de rendez-vous EPEW : votre rendez-vous est dans {{1}}, le {{2}} (heure de New York). Consultez les détails sur https://www.epew.us. Contactez votre coordinateur pour le reporter. Répondez STOP pour arrêter ces rappels.',
 ht:'Rapèl randevou EPEW: randevou ou ap fèt nan {{1}}, nan dat {{2}} (lè New York). Gade detay yo sou https://www.epew.us. Kontakte kowòdonatè ou si ou bezwen chanje dat la. Reponn STOP pou sispann mesaj randevou yo.',
 es:'Recordatorio de cita EPEW: su cita será en {{1}}, el {{2}} (hora de Nueva York). Consulte los detalles en https://www.epew.us. Contacte a su coordinador para reprogramarla. Responda STOP para dejar de recibir recordatorios.',
};
export function appointmentMessage(language:string,hours:number,startsAt:string) {
 const lang=reminderLanguage(language);
 const stages={en:['one week','24 hours','one hour'],fr:['une semaine','24 heures','une heure'],ht:['yon semèn','24 èdtan','yon èdtan'],es:['una semana','24 horas','una hora']};
 const variables={'1':stages[lang][hours===168?0:hours===24?1:2],'2':new Intl.DateTimeFormat(lang==='ht'?'fr-HT':lang,{timeZone:'America/New_York',dateStyle:'long',timeStyle:'short'}).format(new Date(startsAt))};
 return {lang,variables,body:reminderTemplates[lang].replace('{{1}}',variables['1']).replace('{{2}}',variables['2'])};
}
