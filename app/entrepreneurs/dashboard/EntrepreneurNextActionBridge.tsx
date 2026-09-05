"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/components/enterprise/language";

const copy = {
  en: {
    heading: "Your Next Action",
    title: "Start Building Your Support Community",
    body: "Begin reaching out to family, friends, business contacts, community members, and others who believe in you and your vision. Tell them about the business you are preparing to build with EPEW, explain the benefits of participation, and make it clear that participation is completely voluntary. Now begin identifying the people who may be ready to support you during your campaign. As soon as you speak with someone who shows interest, add that person to your Potential Supporter List. EPEW will help prepare personalized messages in the supporter’s preferred language. The messages are written in your voice, not as EPEW messages.",
    button: "Add a Potential Supporter",
  },
  ht: {
    heading: "Pwochen Aksyon Ou",
    title: "Kòmanse Bati Kominote Sipò Ou",
    body: "Kòmanse kontakte fanmi, zanmi, kontak biznis, manm kominote a, ak lòt moun ki kwè nan ou ak vizyon ou. Pale yo de biznis w ap prepare pou bati ak EPEW, eksplike avantaj patisipasyon yo, epi fè yo konnen patisipasyon an konplètman volontè. Kounye a idantifye moun ki ka pare pou sipòte ou pandan kanpay ou. Depi ou pale ak yon moun ki montre enterè, ajoute moun sa a nan Lis Sipòtè Potansyèl ou. EPEW ap ede prepare mesaj pèsonalize nan lang sipòtè a prefere. Mesaj yo ekri nan vwa pa ou, yo pa mesaj EPEW.",
    button: "Ajoute yon Sipòtè Potansyèl",
  },
  fr: {
    heading: "Votre Prochaine Action",
    title: "Commencez à Construire Votre Communauté de Soutien",
    body: "Commencez à contacter votre famille, vos amis, vos contacts professionnels, les membres de votre communauté et d’autres personnes qui croient en vous et en votre vision. Présentez-leur l’entreprise que vous préparez avec EPEW, expliquez les avantages de la participation et précisez que la participation est entièrement volontaire. Identifiez maintenant les personnes qui pourraient être prêtes à vous soutenir pendant votre campagne. Dès qu’une personne manifeste de l’intérêt, ajoutez-la à votre Liste de Supporters Potentiels. EPEW vous aidera à préparer des messages personnalisés dans la langue préférée du supporter. Les messages sont rédigés dans votre voix et non comme des messages d’EPEW.",
    button: "Ajouter un Supporter Potentiel",
  },
  es: {
    heading: "Su Próxima Acción",
    title: "Comience a Construir Su Comunidad de Apoyo",
    body: "Comience a comunicarse con familiares, amigos, contactos comerciales, miembros de la comunidad y otras personas que creen en usted y en su visión. Hábleles sobre el negocio que está preparando con EPEW, explique los beneficios de la participación y deje claro que la participación es completamente voluntaria. Ahora identifique a las personas que podrían estar listas para apoyarlo durante su campaña. Tan pronto como alguien muestre interés, agréguelo a su Lista de Posibles Supporters. EPEW le ayudará a preparar mensajes personalizados en el idioma preferido del supporter. Los mensajes se escriben con su voz, no como mensajes de EPEW.",
    button: "Agregar un Posible Supporter",
  },
} as const;

const GENERATED_ID = "epew-support-community-next-action";

export default function EntrepreneurNextActionBridge() {
  const { locale } = useLocale();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyFoodFans() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user || cancelled) return;

      const { data, error } = await supabase
        .from("entrepreneur_applications")
        .select("id,business_name")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Unable to verify entrepreneur next action:", error);
        return;
      }

      setEnabled(
        Number(data?.id) === 27 ||
          data?.business_name?.trim().toLowerCase() === "food fans restaurant",
      );
    }

    void verifyFoodFans();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const selected = copy[(locale in copy ? locale : "en") as keyof typeof copy];
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const install = () => {
      const oldLink = document.querySelector<HTMLAnchorElement>(
        'a[href="/entrepreneurs/questionnaire"]',
      );
      const oldCard = oldLink?.closest("div.rounded-3xl") as HTMLElement | null;

      if (!oldCard) {
        attempts += 1;
        if (attempts < 20) timer = setTimeout(install, 150);
        return;
      }

      oldCard.style.display = "none";

      document.getElementById(GENERATED_ID)?.remove();

      const card = document.createElement("div");
      card.id = GENERATED_ID;
      card.className = "rounded-3xl bg-white p-6 shadow";

      const heading = document.createElement("h2");
      heading.className = "text-2xl font-extrabold text-[#10246f]";
      heading.textContent = selected.heading;

      const title = document.createElement("p");
      title.className = "mt-4 text-lg font-extrabold text-green-700";
      title.textContent = selected.title;

      const body = document.createElement("p");
      body.className = "mt-3 leading-relaxed text-gray-700";
      body.textContent = selected.body;

      const link = document.createElement("a");
      link.href = "/entrepreneurs/communication";
      link.className =
        "mt-6 inline-flex rounded-xl bg-[#10246f] px-6 py-3 font-bold text-white transition hover:bg-green-700";
      link.textContent = selected.button;

      card.append(heading, title, body, link);
      oldCard.insertAdjacentElement("afterend", card);
    };

    install();

    return () => {
      if (timer) clearTimeout(timer);
      document.getElementById(GENERATED_ID)?.remove();
      const oldLink = document.querySelector<HTMLAnchorElement>(
        'a[href="/entrepreneurs/questionnaire"]',
      );
      const oldCard = oldLink?.closest("div.rounded-3xl") as HTMLElement | null;
      if (oldCard) oldCard.style.display = "";
    };
  }, [enabled, locale]);

  return null;
}
