"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LanguageSelector,
  useEpewLanguage,
} from "@/app/components/EpewLanguage";
const words = {
  en: {
    title: "Your WhatsApp Interview",
    intro:
      "International entrepreneurs can use WhatsApp for a live interview or answer with text and short voice notes.",
    phone: "Your WhatsApp number, including country code",
    consent:
      "I want to use WhatsApp for my EPEW interview. My messages and voice-note transcriptions will be saved in my interview record.",
    connect: "Connect my WhatsApp",
    open: "Open WhatsApp and send the connection message",
    linked: "Your number is connected",
    verify:
      "Send the prepared message from this same WhatsApp number to verify it. The connection link expires in 30 minutes.",
    live: "Live WhatsApp call",
    liveHelp:
      "After connecting your number, open the EPEW chat and tap the voice-call button. You start the call; EPEW does not place an international telephone call.",
    chat: "Text and voice-note interview",
    chatHelp:
      "Send one answer at a time. The coach replies in your selected language. Send LANGUAGE to change languages or REPEAT to repeat the question.",
    pending:
      "Awaiting EPEW WhatsApp activation. Your regular interview options remain available.",
    questionnaire:
      "Complete your entrepreneur questionnaire before starting your interview.",
    back: "Back to dashboard",
    refresh: "Check connection",
    error: "Unable to connect. Check the number and try again.",
    signIn: "Sign in to your entrepreneur portal to continue.",
    chatOpen: "Open EPEW WhatsApp",
  },
  ht: {
    title: "Entèvyou WhatsApp ou",
    intro:
      "Antreprenè entènasyonal yo ka itilize WhatsApp pou yon entèvyou an dirèk oswa reponn ak tèks ak mesaj vokal kout.",
    phone: "Nimewo WhatsApp ou ak kòd peyi a",
    consent:
      "Mwen vle itilize WhatsApp pou entèvyou EPEW mwen. N ap konsève mesaj mwen yo ak transkripsyon mesaj vokal mwen yo nan dosye entèvyou mwen.",
    connect: "Konekte WhatsApp mwen",
    open: "Louvri WhatsApp epi voye mesaj koneksyon an",
    linked: "Nimewo ou konekte",
    verify:
      "Voye mesaj ki pare a nan menm nimewo WhatsApp sa a pou verifye li. Lyen an ekspire nan 30 minit.",
    live: "Apèl WhatsApp an dirèk",
    liveHelp:
      "Apre ou fin konekte nimewo ou, louvri konvèsasyon EPEW la epi peze bouton apèl vokal la. Se ou menm ki kòmanse apèl la.",
    chat: "Entèvyou ak tèks ak mesaj vokal",
    chatHelp:
      "Voye yon repons alafwa. Antrenè a reponn nan lang ou chwazi a. Ekri LANGUAGE pou chanje lang oswa REPEAT pou repete kesyon an.",
    pending:
      "N ap tann aktivasyon WhatsApp EPEW. Lòt opsyon entèvyou ou yo toujou disponib.",
    questionnaire: "Ranpli kesyonè antreprenè ou anvan ou kòmanse entèvyou a.",
    back: "Retounen nan tablo bò",
    refresh: "Verifye koneksyon",
    error: "Nou pa kapab konekte. Verifye nimewo a epi eseye ankò.",
    signIn: "Konekte nan pòtay antreprenè ou pou kontinye.",
    chatOpen: "Louvri WhatsApp EPEW",
  },
  fr: {
    title: "Votre entretien WhatsApp",
    intro:
      "Les entrepreneurs internationaux peuvent utiliser WhatsApp pour un entretien en direct ou répondre par texte et courts messages vocaux.",
    phone: "Votre numéro WhatsApp avec l’indicatif du pays",
    consent:
      "Je souhaite utiliser WhatsApp pour mon entretien EPEW. Mes messages et leurs transcriptions seront conservés dans mon dossier d’entretien.",
    connect: "Connecter mon WhatsApp",
    open: "Ouvrir WhatsApp et envoyer le message de connexion",
    linked: "Votre numéro est connecté",
    verify:
      "Envoyez le message préparé depuis ce même numéro WhatsApp pour le vérifier. Le lien expire dans 30 minutes.",
    live: "Appel WhatsApp en direct",
    liveHelp:
      "Après avoir connecté votre numéro, ouvrez la conversation EPEW et appuyez sur le bouton d’appel vocal. Vous lancez l’appel.",
    chat: "Entretien par texte et messages vocaux",
    chatHelp:
      "Envoyez une réponse à la fois. Le coach répond dans votre langue. Envoyez LANGUAGE pour changer de langue ou REPEAT pour répéter la question.",
    pending:
      "En attente de l’activation WhatsApp EPEW. Vos autres options d’entretien restent disponibles.",
    questionnaire:
      "Remplissez votre questionnaire avant de commencer l’entretien.",
    back: "Retour au tableau de bord",
    refresh: "Vérifier la connexion",
    error: "Connexion impossible. Vérifiez le numéro et réessayez.",
    signIn: "Connectez-vous à votre portail entrepreneur pour continuer.",
    chatOpen: "Ouvrir WhatsApp EPEW",
  },
  es: {
    title: "Su entrevista por WhatsApp",
    intro:
      "Los emprendedores internacionales pueden usar WhatsApp para una entrevista en vivo o responder con texto y notas de voz cortas.",
    phone: "Su número de WhatsApp con código de país",
    consent:
      "Quiero usar WhatsApp para mi entrevista EPEW. Mis mensajes y transcripciones de voz se guardarán en mi expediente.",
    connect: "Conectar mi WhatsApp",
    open: "Abrir WhatsApp y enviar el mensaje de conexión",
    linked: "Su número está conectado",
    verify:
      "Envíe el mensaje preparado desde este mismo número para verificarlo. El enlace vence en 30 minutos.",
    live: "Llamada de WhatsApp en vivo",
    liveHelp:
      "Después de conectar su número, abra el chat EPEW y pulse el botón de llamada de voz. Usted inicia la llamada.",
    chat: "Entrevista por texto y notas de voz",
    chatHelp:
      "Envíe una respuesta a la vez. El coach responde en su idioma. Envíe LANGUAGE para cambiar de idioma o REPEAT para repetir la pregunta.",
    pending:
      "Pendiente de activación de WhatsApp EPEW. Sus otras opciones de entrevista siguen disponibles.",
    questionnaire: "Complete su cuestionario antes de comenzar la entrevista.",
    back: "Volver al panel",
    refresh: "Verificar conexión",
    error: "No se pudo conectar. Verifique el número e inténtelo de nuevo.",
    signIn: "Inicie sesión en su portal para continuar.",
    chatOpen: "Abrir WhatsApp EPEW",
  },
};
type Status = {
  application: {
    id: number;
    business_name: string;
    questionnaire_status: string;
  };
  connection: { phone: string; verified_at: string | null } | null;
  readiness: { messaging: boolean; calling: boolean };
  sender: string | null;
};
export default function WhatsAppInterview() {
  const { language } = useEpewLanguage();
  const t = words[language] ?? words.en;
  const [status, setStatus] = useState<Status | null>(null);
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function endpoint() {
    const id = new URLSearchParams(window.location.search).get("applicationId");
    return `/api/entrepreneurs/whatsapp-interview${id ? `?applicationId=${encodeURIComponent(id)}` : ""}`;
  }
  async function load() {
    try {
      const r = await fetch(endpoint(), { cache: "no-store" });
      if (!r.ok) {
        setError(r.status === 401 ? t.signIn : t.error);
        return;
      }
      const data = await r.json();
      setStatus(data);
      setPhone(data.connection?.phone ?? "");
    } catch {
      setError(t.error);
    }
  }
  useEffect(() => {
    let active = true;
    fetch(endpoint(), { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 ? t.signIn : t.error);
        return r.json();
      })
      .then((data) => {
        if (active) {
          setStatus(data);
          setPhone(data.connection?.phone ?? "");
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [t.error, t.signIn]);
  async function connect() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, consent }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error();
      setUrl(data.url);
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }
  const ready = status?.readiness.messaging;
  const complete = status?.application.questionnaire_status === "completed";
  return (
    <main className="mx-auto max-w-4xl p-6 md:p-10 text-[#06245c]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/entrepreneurs/dashboard" className="underline">
          {t.back}
        </Link>
        <LanguageSelector />
      </div>
      <h1 className="mt-8 text-4xl md:text-5xl font-extrabold">{t.title}</h1>
      <p className="mt-4 text-xl">{t.intro}</p>
      {status && (
        <p className="mt-3 font-bold">{status.application.business_name}</p>
      )}
      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {status && !ready && (
        <p className="mt-6 rounded-xl bg-amber-50 p-5 text-amber-900">
          {t.pending}
        </p>
      )}
      {status && !complete && <p className="mt-5">{t.questionnaire}</p>}
      {ready && complete && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void connect();
          }}
          className="mt-7 space-y-5 rounded-2xl border p-6"
        >
          <label className="block font-bold">
            {t.phone}
            <input
              type="tel"
              required
              placeholder="+509…"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setUrl("");
              }}
              className="mt-2 block w-full rounded-xl border p-3"
            />
          </label>
          <label className="flex gap-3">
            <input
              required
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>{t.consent}</span>
          </label>
          <button
            disabled={busy || !consent}
            className="rounded-xl bg-green-700 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {t.connect}
          </button>
          {url && (
            <div>
              <p className="mb-3">{t.verify}</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
              >
                {t.open}
              </a>
            </div>
          )}
          {status?.connection?.verified_at && (
            <p className="font-bold text-green-800">
              {t.linked}: {status.connection.phone}
            </p>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="block underline"
          >
            {t.refresh}
          </button>
        </form>
      )}
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-bold">{t.chat}</h2>
          <p className="mt-3">{t.chatHelp}</p>
          {ready && status?.connection?.verified_at && status.sender && (
            <a
              href={`https://wa.me/${status.sender.slice(1)}?text=REPEAT`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block font-bold underline"
            >
              {t.chatOpen}
            </a>
          )}
        </section>
        <section className="rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-bold">{t.live}</h2>
          <p className="mt-3">
            {status?.readiness.calling ? t.liveHelp : t.pending}
          </p>
        </section>
      </div>
    </main>
  );
}
