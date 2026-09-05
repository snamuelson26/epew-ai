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
        setEnabled(false);
        return;
      }

      const isFoodFans =
        Number(data?.id) === 27 ||
        data?.business_name?.trim().toLowerCase() === "food fans restaurant";

      setEnabled(Boolean(isFoodFans));
    }

    void verifyFoodFans();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const selected = copy[(locale in copy ? locale : "en") as keyof typeof copy];

    const setTextIfNeeded = (element: Element | null, value: string) => {
      if (element && element.textContent !== value) {
        element.textContent = value;
      }
    };

    const apply = () => {
      const oldLink = document.querySelector<HTMLAnchorElement>('a[href="/entrepreneurs/questionnaire"]');
      const communicationLink = document.querySelector<HTMLAnchorElement>('a[href="/entrepreneurs/communication"]');
      const link = oldLink || communicationLink;
      if (!link) return;

      const card = link.closest("div.rounded-3xl") || link.parentElement;
      if (!card) return;

      setTextIfNeeded(card.querySelector("h2"), selected.heading);

      let title = card.querySelector<HTMLElement>("[data-epew-support-title]");
      if (!title) {
        title = document.createElement("p");
        title.dataset.epewSupportTitle = "true";
        title.className = "mt-4 text-lg font-extrabold text-green-700";
        const firstParagraph = card.querySelector("p");
        card.insertBefore(title, firstParagraph || link);
      }
      setTextIfNeeded(title, selected.title);

      const paragraphs = Array.from(card.querySelectorAll("p")).filter((p) => p !== title);
      setTextIfNeeded(paragraphs[0] || null, selected.body);

      if (link.getAttribute("href") !== "/entrepreneurs/communication") {
        link.setAttribute("href", "/entrepreneurs/communication");
      }
      setTextIfNeeded(link, selected.button);
    };

    apply();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(apply);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [enabled, locale]);

  return null;
}
