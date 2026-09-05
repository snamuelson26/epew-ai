"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LanguageSelector, useLocale } from "@/app/components/enterprise/language";

type Entrepreneur = {
  id: string | number;
  user_id?: string | null;
  entrepreneur_code?: string | null;
  business_code?: string | null;
  business_name?: string | null;
  full_name?: string | null;
};

type Contact = {
  id: string;
  prospect_name: string;
  phone: string | null;
  email: string | null;
  preferred_language: string;
  relationship: string | null;
  conversation_notes: string | null;
  status: string;
  weekly_follow_up_enabled: boolean;
  created_at: string;
};

const text = {
  en: {
    title: "Entrepreneur Communication System",
    subtitle: "Build real relationships around your business journey.",
    start: "Start Building Your Support Community",
    intro: "Begin reaching out to family, friends, business contacts, community members, and others who believe in you and your vision. Tell them about the business you are preparing to build with EPEW, explain the benefits of participation, and make it clear that participation is completely voluntary.",
    identify: "Now begin identifying the people who may be ready to support you during your campaign. As soon as you speak with someone who shows interest, add that person here. EPEW will help prepare personalized messages in the supporter’s preferred language. The messages are written in your voice, not as EPEW messages.",
    add: "Add a Potential Supporter",
    name: "Name",
    phone: "Phone Number",
    email: "Email Address",
    language: "Preferred Language",
    relationship: "Relationship to Entrepreneur",
    notes: "Notes From the Conversation",
    save: "Add Potential Supporter",
    list: "My Potential Supporter List",
    empty: "No potential supporters have been added yet.",
    preview: "Personal Message Preview",
    weekly: "Weekly follow-up enabled",
    back: "Back to Entrepreneur Dashboard",
    required: "Please enter the name, phone number, and email address.",
    saved: "Potential supporter added successfully.",
  },
  ht: {
    title: "Sistèm Kominikasyon Antreprenè",
    subtitle: "Bati relasyon reyèl toutotou pakou biznis ou.",
    start: "Kòmanse Bati Kominote Sipò Ou",
    intro: "Kòmanse kontakte fanmi, zanmi, kontak biznis, manm kominote a, ak lòt moun ki kwè nan ou ak vizyon ou. Pale yo de biznis w ap prepare pou bati ak EPEW, eksplike avantaj patisipasyon yo, epi fè yo konnen patisipasyon an konplètman volontè.",
    identify: "Kounye a idantifye moun ki ka pare pou sipòte ou pandan kanpay ou. Depi ou pale ak yon moun ki montre enterè, ajoute moun sa a isit la. EPEW ap ede prepare mesaj pèsonalize nan lang sipòtè a prefere. Mesaj yo ekri nan vwa pa ou, yo pa mesaj EPEW.",
    add: "Ajoute yon Sipòtè Potansyèl",
    name: "Non",
    phone: "Nimewo Telefòn",
    email: "Adrès Imèl",
    language: "Lang Prefere",
    relationship: "Relasyon ak Antreprenè a",
    notes: "Nòt Sou Konvèsasyon an",
    save: "Ajoute Sipòtè Potansyèl",
    list: "Lis Sipòtè Potansyèl Mwen",
    empty: "Ou poko ajoute okenn sipòtè potansyèl.",
    preview: "Aperçu Mesaj Pèsonèl",
    weekly: "Swivi chak semèn aktive",
    back: "Retounen nan Tablo Bò Antreprenè",
    required: "Tanpri antre non, nimewo telefòn, ak adrès imèl la.",
    saved: "Sipòtè potansyèl la ajoute avèk siksè.",
  },
  fr: {
    title: "Système de Communication Entrepreneur",
    subtitle: "Construisez de vraies relations autour de votre parcours entrepreneurial.",
    start: "Commencez à Construire Votre Communauté de Soutien",
    intro: "Commencez à contacter votre famille, vos amis, vos contacts professionnels, les membres de votre communauté et d’autres personnes qui croient en vous et en votre vision. Présentez-leur l’entreprise que vous préparez avec EPEW, expliquez les avantages de la participation et précisez que la participation est entièrement volontaire.",
    identify: "Identifiez maintenant les personnes qui pourraient être prêtes à vous soutenir pendant votre campagne. Dès qu’une personne manifeste de l’intérêt, ajoutez-la ici. EPEW vous aidera à préparer des messages personnalisés dans la langue préférée du supporter. Les messages sont rédigés dans votre voix et non comme des messages d’EPEW.",
    add: "Ajouter un Supporter Potentiel",
    name: "Nom",
    phone: "Numéro de Téléphone",
    email: "Adresse E-mail",
    language: "Langue Préférée",
    relationship: "Relation avec l’Entrepreneur",
    notes: "Notes de la Conversation",
    save: "Ajouter le Supporter Potentiel",
    list: "Ma Liste de Supporters Potentiels",
    empty: "Aucun supporter potentiel n’a encore été ajouté.",
    preview: "Aperçu du Message Personnel",
    weekly: "Suivi hebdomadaire activé",
    back: "Retour au Tableau de Bord Entrepreneur",
    required: "Veuillez saisir le nom, le numéro de téléphone et l’adresse e-mail.",
    saved: "Supporter potentiel ajouté avec succès.",
  },
  es: {
    title: "Sistema de Comunicación del Emprendedor",
    subtitle: "Construya relaciones reales alrededor de su trayectoria empresarial.",
    start: "Comience a Construir Su Comunidad de Apoyo",
    intro: "Comience a comunicarse con familiares, amigos, contactos comerciales, miembros de la comunidad y otras personas que creen en usted y en su visión. Hábleles sobre el negocio que está preparando con EPEW, explique los beneficios de la participación y deje claro que la participación es completamente voluntaria.",
    identify: "Ahora identifique a las personas que podrían estar listas para apoyarlo durante su campaña. Tan pronto como alguien muestre interés, agréguelo aquí. EPEW le ayudará a preparar mensajes personalizados en el idioma preferido del supporter. Los mensajes se escriben con su voz, no como mensajes de EPEW.",
    add: "Agregar un Posible Supporter",
    name: "Nombre",
    phone: "Número de Teléfono",
    email: "Correo Electrónico",
    language: "Idioma Preferido",
    relationship: "Relación con el Emprendedor",
    notes: "Notas de la Conversación",
    save: "Agregar Posible Supporter",
    list: "Mi Lista de Posibles Supporters",
    empty: "Todavía no se han agregado posibles supporters.",
    preview: "Vista Previa del Mensaje Personal",
    weekly: "Seguimiento semanal activado",
    back: "Volver al Panel del Emprendedor",
    required: "Ingrese el nombre, número de teléfono y correo electrónico.",
    saved: "Posible supporter agregado correctamente.",
  },
} as const;

function personalMessage(language: string, prospect: string, entrepreneur: string, business: string) {
  const firstName = entrepreneur?.trim().split(/\s+/)[0] || "";
  const b = business || "my business";
  if (language === "ht") return `Bonjou ${prospect}, se ${firstName}. M ap travay pou devlope ${b} avèk EPEW. Mwen ta renmen pataje vizyon mwen avèk ou. Patisipasyon ou konplètman volontè. Menm si ou poko pare pou sipòte m finansyèman kounye a, lide ou ak ankourajman ou ka toujou ede m. Èske ou gen nenpòt konsèy, sijesyon, koneksyon, oswa lide ki ta ka ede m avanse nan pakou biznis mwen?`;
  if (language === "fr") return `Bonjour ${prospect}, c’est ${firstName}. Je travaille au développement de ${b} avec EPEW et j’aimerais partager ma vision avec vous. Votre participation est entièrement volontaire. Même si vous n’êtes pas encore prêt(e) à me soutenir financièrement, vos idées et vos encouragements peuvent toujours m’aider. Avez-vous un conseil, une suggestion, un contact ou une idée qui pourrait m’aider à avancer dans mon parcours entrepreneurial ?`;
  if (language === "es") return `Hola ${prospect}, soy ${firstName}. Estoy trabajando para desarrollar ${b} con EPEW y me gustaría compartir mi visión con usted. Su participación es completamente voluntaria. Aunque todavía no esté listo para apoyarme financieramente, sus ideas y palabras de ánimo también pueden ayudarme. ¿Tiene algún consejo, sugerencia, contacto o idea que pueda ayudarme a avanzar en mi trayectoria empresarial?`;
  return `Hello ${prospect}, this is ${firstName}. I am working to build ${b} with EPEW and I would like to share my vision with you. Your participation is completely voluntary. Even if you are not ready to support me financially right now, your ideas and encouragement can still help me. Is there any advice, suggestion, connection, or idea you would like to share that could help me move forward with my business journey?`;
}

export default function EntrepreneurCommunicationPage() {
  const { locale } = useLocale();
  const t = text[(locale in text ? locale : "en") as keyof typeof text];
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("en");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) { window.location.href = "/entrepreneurs/login"; return; }

    const { data: profile } = await supabase
      .from("entrepreneur_applications")
      .select("id,user_id,entrepreneur_code,business_code,business_name,full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) { setLoading(false); setNotice("Unable to load entrepreneur profile."); return; }
    setEntrepreneur(profile as Entrepreneur);

    const { data } = await supabase
      .from("epew_entrepreneur_communication_contacts")
      .select("id,prospect_name,phone,email,preferred_language,relationship,conversation_notes,status,weekly_follow_up_enabled,created_at")
      .eq("entrepreneur_user_id", user.id)
      .order("created_at", { ascending: false });
    setContacts((data || []) as Contact[]);
    setLoading(false);
  }

  const preview = useMemo(() => personalMessage(language, name || "Friend", entrepreneur?.full_name || "", entrepreneur?.business_name || "my business"), [language, name, entrepreneur]);

  async function addContact(e: FormEvent) {
    e.preventDefault();
    setNotice("");
    if (!name.trim() || !phone.trim() || !email.trim()) { setNotice(t.required); return; }

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user || !entrepreneur) return;
    setSaving(true);

    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + 7);

    const { data: contact, error } = await supabase
      .from("epew_entrepreneur_communication_contacts")
      .insert({
        entrepreneur_user_id: user.id,
        entrepreneur_application_id: String(entrepreneur.id),
        entrepreneur_code: entrepreneur.entrepreneur_code,
        business_code: entrepreneur.business_code,
        business_name: entrepreneur.business_name,
        prospect_name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        preferred_language: language,
        relationship: relationship.trim() || null,
        conversation_notes: notes.trim() || null,
        status: "potential_supporter",
        weekly_follow_up_enabled: true,
        next_follow_up_at: nextFollowUp.toISOString(),
      })
      .select("id")
      .single();

    if (error || !contact) { setNotice(error?.message || "Unable to add potential supporter."); setSaving(false); return; }

    await supabase.from("epew_entrepreneur_communication_messages").insert({
      entrepreneur_user_id: user.id,
      contact_id: contact.id,
      business_code: entrepreneur.business_code,
      message_type: "introduction",
      language,
      body: personalMessage(language, name.trim(), entrepreneur.full_name || "", entrepreneur.business_name || "my business"),
      sender_voice: "entrepreneur",
      delivery_status: "draft",
    });

    setName(""); setPhone(""); setEmail(""); setLanguage("en"); setRelationship(""); setNotes("");
    setNotice(t.saved);
    setSaving(false);
    await load();
  }

  if (loading) return <main className="min-h-screen bg-slate-100 p-8">Loading...</main>;

  const code = entrepreneur?.business_code || entrepreneur?.entrepreneur_code || "EPEW";
  const isFoodFans = code === "FFR-001";

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-5 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="text-sm font-extrabold uppercase tracking-[0.2em] text-green-700">EPEW</p><h1 className="text-3xl font-extrabold text-[#10246f] md:text-5xl">{t.title}</h1><p className="mt-2 text-lg text-slate-600">{t.subtitle}</p></div>
          <LanguageSelector compact showEnglishName={false} />
        </header>

        <section className="rounded-3xl bg-gradient-to-r from-[#10246f] to-green-700 p-7 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-widest text-lime-300">Active Entrepreneur</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-3xl font-extrabold">{entrepreneur?.business_name || "Your Business"}</h2><p className="mt-1 text-white/90">{entrepreneur?.full_name}</p></div><div className="rounded-2xl bg-white/15 px-5 py-3 text-xl font-extrabold">{code}</div></div>
          {isFoodFans && <p className="mt-5 rounded-xl bg-white/10 p-4 font-semibold">Food Fans Restaurant · FFR-001 is the first entrepreneur activated in the Entrepreneur Communication System.</p>}
        </section>

        <section className="rounded-3xl bg-white p-7 shadow"><h2 className="text-2xl font-extrabold text-[#10246f]">{t.start}</h2><p className="mt-4 text-lg leading-relaxed text-slate-700">{t.intro}</p><p className="mt-3 text-lg leading-relaxed text-slate-700">{t.identify}</p></section>
        {notice && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 font-semibold text-blue-800">{notice}</div>}

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <form onSubmit={addContact} className="rounded-3xl bg-white p-7 shadow">
            <h2 className="text-2xl font-extrabold text-[#10246f]">{t.add}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="font-bold text-slate-700">{t.name}<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>
              <label className="font-bold text-slate-700">{t.language}<select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal"><option value="en">English</option><option value="ht">Kreyòl Ayisyen</option><option value="fr">Français</option><option value="es">Español</option></select></label>
              <label className="font-bold text-slate-700">{t.phone}<input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>
              <label className="font-bold text-slate-700">{t.email}<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>
              <label className="font-bold text-slate-700 md:col-span-2">{t.relationship}<input value={relationship} onChange={(e) => setRelationship(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>
              <label className="font-bold text-slate-700 md:col-span-2">{t.notes}<textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>
            </div>
            <button disabled={saving} className="mt-6 rounded-xl bg-green-700 px-6 py-3 text-lg font-extrabold text-white hover:bg-green-800 disabled:opacity-60">{saving ? "Saving..." : t.save}</button>
          </form>

          <div className="space-y-6">
            <section className="rounded-3xl border-2 border-green-200 bg-green-50 p-7 shadow"><h2 className="text-xl font-extrabold text-green-900">{t.preview}</h2><p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-800">{preview}</p><p className="mt-4 text-sm font-bold text-green-800">✓ {t.weekly}</p></section>
            <Link href="/entrepreneurs/dashboard" className="inline-flex rounded-xl bg-[#10246f] px-5 py-3 font-bold text-white">{t.back}</Link>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow"><h2 className="text-2xl font-extrabold text-[#10246f]">{t.list}</h2>{contacts.length === 0 ? <p className="mt-4 text-slate-600">{t.empty}</p> : <div className="mt-5 grid gap-4 md:grid-cols-2">{contacts.map((c) => <article key={c.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-xl font-extrabold text-slate-900">{c.prospect_name}</h3><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">{c.status.replaceAll("_", " ")}</span></div><p className="mt-3 text-sm text-slate-600">{c.phone}</p><p className="text-sm text-slate-600">{c.email}</p>{c.relationship && <p className="mt-2 text-sm font-semibold text-slate-700">{c.relationship}</p>}<p className="mt-3 text-xs font-bold uppercase tracking-wide text-green-700">{c.weekly_follow_up_enabled ? t.weekly : ""}</p></article>)}</div>}</section>
      </div>
    </main>
  );
}
