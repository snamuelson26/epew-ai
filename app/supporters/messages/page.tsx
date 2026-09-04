"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useEpewLanguage } from "@/app/components/EpewLanguage";

const copy = {
  en: {
    loading: "Loading messages...", title: "Messages", intro: "Contact EPEW administration and support services.", sendTitle: "Send a Message", recipient: "Recipient", admin: "EPEW Admin", coach: "Assigned Coach", technical: "Technical Support", payment: "Payment Support", subject: "Subject", message: "Message", sending: "Sending...", send: "Send Message", history: "Message History", requests: "Support Requests", requestsBody: "Messages sent to EPEW administration will appear here.", coachCommunication: "Coach Communication", coachBody: "Future messages from assigned coaches will appear here.", notifications: "Notifications", notificationsBody: "Funding updates and system notifications will appear here.", complete: "Please complete all fields.", unable: "Unable to send message.", sent: "Message sent successfully."
  },
  ht: {
    loading: "Mesaj yo ap chaje...", title: "Mesaj", intro: "Kontakte administrasyon EPEW ak sèvis sipò yo.", sendTitle: "Voye yon Mesaj", recipient: "Destinatè", admin: "Administrasyon EPEW", coach: "Antrenè Asiyen", technical: "Sipò Teknik", payment: "Sipò Peman", subject: "Sijè", message: "Mesaj", sending: "Ap voye...", send: "Voye Mesaj", history: "Istwa Mesaj yo", requests: "Demann Sipò", requestsBody: "Mesaj ou voye bay administrasyon EPEW ap parèt isit la.", coachCommunication: "Kominikasyon ak Antrenè", coachBody: "Mesaj k ap vini nan men antrenè yo asiyen pou ou ap parèt isit la.", notifications: "Notifikasyon", notificationsBody: "Mizajou sou finansman ak notifikasyon sistèm nan ap parèt isit la.", complete: "Tanpri ranpli tout chan yo.", unable: "Nou pa kapab voye mesaj la.", sent: "Mesaj la voye avèk siksè."
  },
  fr: {
    loading: "Chargement des messages...", title: "Messages", intro: "Contactez l’administration EPEW et les services de soutien.", sendTitle: "Envoyer un Message", recipient: "Destinataire", admin: "Administration EPEW", coach: "Coach Assigné", technical: "Support Technique", payment: "Support de Paiement", subject: "Objet", message: "Message", sending: "Envoi...", send: "Envoyer le Message", history: "Historique des Messages", requests: "Demandes de Soutien", requestsBody: "Les messages envoyés à l’administration EPEW apparaîtront ici.", coachCommunication: "Communication avec le Coach", coachBody: "Les futurs messages de vos coachs assignés apparaîtront ici.", notifications: "Notifications", notificationsBody: "Les mises à jour sur le financement et les notifications du système apparaîtront ici.", complete: "Veuillez remplir tous les champs.", unable: "Impossible d’envoyer le message.", sent: "Message envoyé avec succès."
  },
  es: {
    loading: "Cargando mensajes...", title: "Mensajes", intro: "Comuníquese con la administración de EPEW y los servicios de apoyo.", sendTitle: "Enviar un Mensaje", recipient: "Destinatario", admin: "Administración EPEW", coach: "Coach Asignado", technical: "Soporte Técnico", payment: "Soporte de Pago", subject: "Asunto", message: "Mensaje", sending: "Enviando...", send: "Enviar Mensaje", history: "Historial de Mensajes", requests: "Solicitudes de Apoyo", requestsBody: "Los mensajes enviados a la administración de EPEW aparecerán aquí.", coachCommunication: "Comunicación con el Coach", coachBody: "Los futuros mensajes de los coaches asignados aparecerán aquí.", notifications: "Notificaciones", notificationsBody: "Las actualizaciones de financiamiento y las notificaciones del sistema aparecerán aquí.", complete: "Complete todos los campos.", unable: "No se pudo enviar el mensaje.", sent: "Mensaje enviado correctamente."
  }
};

export default function MessagesPage() {
  const { language } = useEpewLanguage();
  const t = copy[language];
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);
  const [recipientType, setRecipientType] = useState("EPEW Admin");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { loadSupporter(); }, []);

  async function loadSupporter() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/supporters/login"; return; }
    const { data } = await supabase.from("supporters").select("*").eq("user_id", user.id).single();
    if (!data) { window.location.href = "/supporters/login"; return; }
    setSupporter(data);
    setLoading(false);
  }

  async function sendMessage() {
    if (!subject || !message) { alert(t.complete); return; }
    setSending(true);
    const { error } = await supabase.from("supporter_messages").insert([{ supporter_id: supporter.supporter_id, supporter_name: supporter.full_name, supporter_email: supporter.email, recipient_type: recipientType, subject, message, status: "New" }]);
    setSending(false);
    if (error) { console.log(error); alert(t.unable + "\n\n" + error.message); return; }
    alert(t.sent);
    setSubject(""); setMessage("");
  }

  if (loading) return <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]"><p className="text-2xl font-bold">{t.loading}</p></main>;

  const options = [
    ["EPEW Admin", t.admin],
    ["Assigned Coach", t.coach],
    ["Technical Support", t.technical],
    ["Payment Support", t.payment],
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">{t.title}</h1>
        <p className="text-xl text-gray-700">{t.intro}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-3xl font-bold mb-6">{t.sendTitle}</h2>
          <div className="space-y-5">
            <div>
              <label className="font-bold block mb-2">{t.recipient}</label>
              <select value={recipientType} onChange={(e) => setRecipientType(e.target.value)} className="border rounded-2xl p-4 text-lg w-full">
                {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div><label className="font-bold block mb-2">{t.subject}</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="border rounded-2xl p-4 text-lg w-full" /></div>
            <div><label className="font-bold block mb-2">{t.message}</label><textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} className="border rounded-2xl p-4 text-lg w-full" /></div>
            <button onClick={sendMessage} disabled={sending} className="bg-green-700 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]">{sending ? t.sending : t.send}</button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-3xl font-bold mb-6">{t.history}</h2>
          <div className="space-y-5">
            <Info title={t.requests} body={t.requestsBody} />
            <Info title={t.coachCommunication} body={t.coachBody} />
            <Info title={t.notifications} body={t.notificationsBody} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return <div className="bg-[#f5f7fb] rounded-2xl p-6"><p className="font-bold text-xl mb-2">{title}</p><p className="text-lg text-gray-700">{body}</p></div>;
}
