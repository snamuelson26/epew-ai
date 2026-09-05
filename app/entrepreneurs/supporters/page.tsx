"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ht", label: "Kreyòl Ayisyen" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
];

type Profile = {
  id: number | string;
  user_id: string;
  full_name: string | null;
  business_name: string | null;
};

type Business = {
  public_business_id: string | null;
  business_name: string | null;
  business_website_url: string | null;
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
};

function messageFor(
  language: string,
  prospect: string,
  entrepreneurName: string,
  businessName: string,
  website: string,
  supportLink: string,
  businessCode: string,
) {
  if (language === "fr") {
    return `Bonjour ${prospect},\n\nMerci d’avoir pris le temps de m’écouter au sujet de ma nouvelle entreprise, ${businessName}. Je vous écris pour vous rappeler mon parcours entrepreneurial avec EPEW et vous inviter à rester en contact avec moi pendant que j’avance.\n\nVous pouvez visiter le site de ${businessName} à ${website} pour en savoir plus sur mon entreprise.\n\nSi vous êtes prêt(e) à me soutenir, vous pouvez utiliser mon lien personnel de soutien :\n${supportLink}\n\nLa participation est entièrement volontaire.\n\nPendant que vous réfléchissez à la possibilité de me soutenir financièrement et de faire travailler votre argent par l’intermédiaire de mon entreprise, vos idées et vos encouragements sont également très importants pour moi. N’hésitez pas à me faire part de tout conseil, suggestion, contact professionnel, recommandation ou idée qui pourrait aider ${businessName} à réussir. Je vous en serais très reconnaissant.\n\nMerci encore de croire en mon parcours et de prendre le temps de rester en contact avec moi.\n\n${entrepreneurName}\n${businessName}\n${businessCode}`;
  }

  if (language === "ht") {
    return `Bonjou ${prospect},\n\nMèsi paske ou te pran tan pou koute m pale sou nouvo antrepriz mwen an, ${businessName}. M ap suiv avèk ou pou raple ou de pakou biznis mwen avèk EPEW epi pou envite ou rete konekte avè m pandan m ap avanse.\n\nOu ka vizite sit entènèt ${businessName} lan nan ${website} pou aprann plis sou biznis la.\n\nSi ou pare pou sipòte m, ou ka itilize lyen sipò pèsonèl mwen an :\n${supportLink}\n\nPatisipasyon an konplètman volontè.\n\nPandan w ap reflechi sou posiblite pou sipòte m finansyèman epi mete lajan ou travay pou ou atravè biznis mwen an, lide ou ak ankourajman ou enpòtan anpil pou mwen tou. Tanpri pataje nenpòt konsèy, sijesyon, koneksyon biznis, referans oswa lide ki ta ka ede ${businessName} reyisi. Mwen ta apresye sa anpil.\n\nMèsi ankò paske ou kwè nan pakou mwen epi paske ou pran tan pou rete konekte avè m.\n\n${entrepreneurName}\n${businessName}\n${businessCode}`;
  }

  if (language === "es") {
    return `Hola ${prospect},\n\nGracias por tomarse el tiempo para escucharme acerca de mi nueva empresa, ${businessName}. Le escribo para recordarle mi trayectoria empresarial con EPEW e invitarle a mantenerse en contacto conmigo mientras sigo avanzando.\n\nPuede visitar el sitio web de ${businessName} en ${website} para conocer más sobre la empresa.\n\nSi está listo(a) para apoyarme, puede usar mi enlace personal de apoyo:\n${supportLink}\n\nLa participación es completamente voluntaria.\n\nMientras considera apoyarme financieramente y poner su dinero a trabajar por medio de mi empresa, sus ideas y palabras de ánimo también son muy importantes para mí. Le agradecería mucho cualquier consejo, sugerencia, conexión comercial, referencia o idea que pudiera ayudar a ${businessName} a tener éxito.\n\nGracias nuevamente por creer en mi trayectoria y por tomarse el tiempo para mantenerse en contacto conmigo.\n\n${entrepreneurName}\n${businessName}\n${businessCode}`;
  }

  return `Hello ${prospect},\n\nThank you for taking the time to listen to me regarding my new venture, ${businessName}. I am following up to remind you about my business journey with EPEW and to invite you to stay connected with me as I move forward.\n\nYou can visit the ${businessName} website at ${website} to learn more about the business.\n\nIf you are ready to support me, you can use my personal support link:\n${supportLink}\n\nParticipation is completely voluntary.\n\nWhile you are thinking about supporting me financially and putting your money to work for you through my business, your ideas and encouragement are also very important to me. Please share any advice, suggestion, business connection, referral, or idea that could help ${businessName} succeed. I would truly appreciate hearing from you.\n\nThank you again for believing in my journey and taking the time to stay connected with me.\n\n${entrepreneurName}\n${businessName}\n${businessCode}`;
}

export default function PotentialSupportersPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
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

  useEffect(() => { void loadPage(); }, []);

  async function loadPage() {
    setLoading(true);
    setNotice("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      window.location.href = "/entrepreneurs/login";
      return;
    }

    const { data: app, error: appError } = await supabase
      .from("entrepreneur_applications")
      .select("id,user_id,full_name,business_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (appError || !app) {
      setNotice(appError?.message || "Unable to load your entrepreneur profile.");
      setLoading(false);
      return;
    }

    setProfile(app as Profile);

    const { data: businessData } = await supabase
      .from("entrepreneurs")
      .select("public_business_id,business_name,business_website_url")
      .eq("source_application_id", app.id)
      .eq("qualified", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    setBusiness((businessData || null) as Business | null);

    const { data: contactData, error: contactError } = await supabase
      .from("epew_entrepreneur_communication_contacts")
      .select("id,prospect_name,phone,email,preferred_language,relationship,conversation_notes,status")
      .eq("entrepreneur_user_id", user.id)
      .order("created_at", { ascending: false });

    if (contactError) setNotice(contactError.message);
    setContacts((contactData || []) as Contact[]);
    setLoading(false);
  }

  const businessName = business?.business_name || profile?.business_name || "my business";
  const businessCode = business?.public_business_id || (Number(profile?.id) === 27 ? "FFR-001" : "EPEW");
  const website = business?.business_website_url || (businessCode === "FFR-001" ? "www.foodfans.org" : "");
  const displayWebsite = website.replace(/^https?:\/\//, "");
  const supportLink = `https://www.epew.us/support/${businessCode}`;

  const preview = useMemo(
    () => messageFor(
      language,
      name || "Friend",
      profile?.full_name || "Entrepreneur",
      businessName,
      displayWebsite || "your business website",
      supportLink,
      businessCode,
    ),
    [language, name, profile, businessName, displayWebsite, supportLink, businessCode],
  );

  async function addProspect(event: FormEvent) {
    event.preventDefault();
    setNotice("");

    if (!profile || !name.trim()) {
      setNotice("Please enter the supporter name.");
      return;
    }

    if (!phone.trim() && !email.trim()) {
      setNotice("Please enter at least one contact method: an email address or a phone number.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;

    setSaving(true);
    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + 7);

    const { data: contact, error } = await supabase
      .from("epew_entrepreneur_communication_contacts")
      .insert({
        entrepreneur_user_id: user.id,
        entrepreneur_application_id: String(profile.id),
        entrepreneur_code: businessCode,
        business_code: businessCode,
        business_name: businessName,
        prospect_name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        preferred_language: language,
        relationship: relationship.trim() || null,
        conversation_notes: notes.trim() || null,
        status: "potential_supporter",
        weekly_follow_up_enabled: true,
        next_follow_up_at: nextFollowUp.toISOString(),
      })
      .select("id")
      .single();

    if (error || !contact) {
      setNotice(error?.message || "Unable to add this potential supporter.");
      setSaving(false);
      return;
    }

    const { error: messageError } = await supabase
      .from("epew_entrepreneur_communication_messages")
      .insert({
        entrepreneur_user_id: user.id,
        contact_id: contact.id,
        business_code: businessCode,
        message_type: "introduction",
        language,
        subject: `A Quick Follow-Up About ${businessName}`,
        body: messageFor(
          language,
          name.trim(),
          profile.full_name || "Entrepreneur",
          businessName,
          displayWebsite || "your business website",
          supportLink,
          businessCode,
        ),
        sender_voice: "entrepreneur",
        delivery_channel: email.trim() ? "email" : null,
        delivery_status: "draft",
      });

    if (messageError) {
      setNotice(`Potential supporter saved, but the message could not be prepared: ${messageError.message}`);
      setSaving(false);
      await loadPage();
      return;
    }

    setName("");
    setPhone("");
    setEmail("");
    setLanguage("en");
    setRelationship("");
    setNotes("");
    setNotice("Potential supporter added successfully. The message has been prepared using the available contact method.");
    setSaving(false);
    await loadPage();
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-100 p-5 text-slate-700">Loading potential supporters...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-blue-950 to-green-700 p-6 text-white shadow-xl md:p-8">
          <p className="text-sm font-black uppercase tracking-widest text-lime-300">Entrepreneur Communication System</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">My Potential Supporters</h1>
          <p className="mt-2 text-white/90">Add people you have already spoken with who may support your business journey.</p>
        </header>

        {notice && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 font-semibold text-blue-800">{notice}</div>}

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={addProspect} className="rounded-3xl bg-white p-5 shadow md:p-7">
            <h2 className="text-2xl font-black text-blue-950">Add a Potential Supporter</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">Provide an email address, a phone number, or both.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="font-bold text-slate-700">Name<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 p-3 font-normal" /></label>
              <label className="font-bold text-slate-700">Preferred Language<select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 p-3 font-normal">{LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label className="font-bold text-slate-700">Phone Number <span className="font-normal text-slate-500">(optional if email is provided)</span><input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 p-3 font-normal" /></label>
              <label className="font-bold text-slate-700">Email Address <span className="font-normal text-slate-500">(optional if phone is provided)</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 p-3 font-normal" /></label>
              <label className="font-bold text-slate-700 sm:col-span-2">Relationship to Entrepreneur<input value={relationship} onChange={(e) => setRelationship(e.target.value)} className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 p-3 font-normal" /></label>
              <label className="font-bold text-slate-700 sm:col-span-2">Notes From the Conversation<textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 p-3 font-normal" /></label>
            </div>

            <button disabled={saving} className="mt-6 w-full rounded-xl bg-green-700 px-6 py-4 text-lg font-black text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto">{saving ? "Saving..." : "Add Potential Supporter"}</button>
          </form>

          <section className="rounded-3xl border-2 border-green-200 bg-green-50 p-5 shadow md:p-7">
            <h2 className="text-2xl font-black text-green-950">Official First Message Preview</h2>
            <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-slate-800">{preview}</p>
          </section>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow md:p-7">
          <h2 className="text-2xl font-black text-blue-950">Potential Supporter List</h2>
          {contacts.length === 0 ? (
            <p className="mt-4 text-slate-600">No potential supporters have been added yet.</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {contacts.map((contact) => (
                <article key={contact.id} className="min-w-0 rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="break-words text-xl font-black text-slate-900">{contact.prospect_name}</h3>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">{contact.status.replaceAll("_", " ")}</span>
                  </div>
                  {contact.phone && <p className="mt-3 break-all text-sm text-slate-600">Phone: {contact.phone}</p>}
                  {contact.email && <p className="break-all text-sm text-slate-600">Email: {contact.email}</p>}
                  {contact.relationship && <p className="mt-2 text-sm font-semibold text-slate-700">{contact.relationship}</p>}
                  {contact.conversation_notes && <p className="mt-2 text-sm text-slate-600">{contact.conversation_notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/entrepreneurs/dashboard" className="rounded-xl bg-blue-950 px-5 py-3 text-center font-bold text-white">Back to Entrepreneur Dashboard</Link>
          <Link href={supportLink.replace("https://www.epew.us", "")} className="rounded-xl bg-green-700 px-5 py-3 text-center font-bold text-white">View My Support Page</Link>
        </div>
      </div>
    </main>
  );
}
