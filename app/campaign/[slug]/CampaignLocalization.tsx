"use client";

import { useEffect } from "react";
import {
  LanguageSelector,
  useLocale,
  type SupportedLocale,
} from "@/app/components/enterprise/language";

const translations: Record<SupportedLocale, Record<string, string>> = {
  en: {},
  ht: {
    "Back to Entrepreneur Portal": "Retounen nan Pòtal Antreprenè a",
    "Communication Center": "Sant Kominikasyon",
    "EPEW Campaign": "Kanpay EPEW",
    "Led by": "Dirije pa",
    "This entrepreneur is building more than a business. They are building a community, creating opportunity, and moving toward lasting wealth.": "Antreprenè sa a ap bati plis pase yon biznis. Li ap bati yon kominote, kreye opòtinite, epi avanse pou bati richès dirab.",
    "Become a Founding Supporter": "Vin yon Sipòtè Fondatè",
    "Every successful business begins with someone who believes before the doors open.": "Chak biznis ki reyisi kòmanse ak yon moun ki kwè ladan l anvan pòt yo louvri.",
    "Supported": "Sipò Resevwa",
    "Required": "Obligatwa",
    "Remaining": "Rete",
    "Community Support Units": "Inite Sipò Kominotè",
    "Private Entrepreneur View": "Zòn Prive Antreprenè a",
    "My Potential Supporters": "Sipòtè Potansyèl Mwen yo",
    "People you personally contacted and added to your campaign message list. This section is visible only to you.": "Moun ou kontakte pèsonèlman epi ajoute nan lis mesaj kanpay ou. Se sèlman ou ki ka wè seksyon sa a.",
    "+ Add Potential Supporter": "+ Ajoute yon Sipòtè Potansyèl",
    "Loading your contact list...": "Lis kontak ou ap chaje...",
    "No potential supporters have been added to your campaign list yet.": "Ou poko ajoute okenn sipòtè potansyèl nan lis kanpay ou.",
    "Name": "Non",
    "Contact": "Kontak",
    "Language": "Lang",
    "Relationship": "Relasyon",
    "Support Status": "Estati Sipò",
    "Message Status": "Estati Mesaj",
    "Community Leadership Goal": "Objektif Lidèchip Kominotè",
    "20 Community Support Units before funding management.": "20 Inite Sipò Kominotè anvan jesyon finansman an.",
    "Entrepreneur Story": "Istwa Antreprenè a",
    "Building Credit. Building Business. Building Wealth.": "Bati Kredi. Bati Biznis. Bati Richès.",
    "Business Category": "Kategori Biznis",
    "Location": "Kote",
    "Funding Approval": "Apwobasyon Finansman",
    "Campaign Status": "Estati Kanpay",
    "Goal Achieved": "Objektif Reyalize",
    "Active": "Aktif",
    "Why Become a Founding Supporter?": "Poukisa Vin yon Sipòtè Fondatè?",
    "You become part of this entrepreneur's success story.": "Ou vin yon pati nan istwa siksè antreprenè sa a.",
    "You will be recognized as a Founding Supporter and be part of their journey and legacy.": "Y ap rekonèt ou kòm yon Sipòtè Fondatè epi ou pral fè pati pakou ak eritaj li.",
    "You help launch a real business that serves its community.": "Ou ede lanse yon vrè biznis ki sèvi kominote li.",
    "Your support helps turn a vision into a business that creates value, serves people, and builds opportunity.": "Sipò ou ede transfòme yon vizyon an yon biznis ki kreye valè, sèvi moun, epi kreye opòtinite.",
    "You may receive participation benefits of up to 6% annually,": "Ou ka resevwa benefis patisipasyon jiska 6% pa ane,",
    "subject to business performance and EPEW policies.": "selon pèfòmans biznis la ak règleman EPEW yo.",
    "Your support creates jobs, strengthens communities, and helps build the next generation of entrepreneurs.": "Sipò ou kreye travay, ranfòse kominote yo, epi ede bati pwochen jenerasyon antreprenè yo.",
    "The EPEW Community Pledge": "Angajman Kominotè EPEW",
    "✅ I believe in this entrepreneur's vision.": "✅ Mwen kwè nan vizyon antreprenè sa a.",
    "✅ I believe successful businesses are built through community.": "✅ Mwen kwè biznis ki reyisi bati atravè kominote.",
    "✅ I believe my support can help create opportunity.": "✅ Mwen kwè sipò mwen ka ede kreye opòtinite.",
    "Learn About Becoming a Founding Supporter →": "Aprann Kijan Pou Vin yon Sipòtè Fondatè →",
    "🔒 Secure • Simple • Impactful": "🔒 Sekirize • Senp • Gen Enpak",
    "Your campaign source is connected to this entrepreneur.": "Sous kanpay ou konekte ak antreprenè sa a.",
    "Mission Accomplished — Support Continues": "Misyon Akonpli — Sipò a Kontinye",
    "Build Your Community. Build Your Business. Build Your Wealth.": "Bati Kominote Ou. Bati Biznis Ou. Bati Richès Ou.",
    "Powered by IBOS — I Am My Own Boss.": "Fonksyone ak IBOS — Mwen Se Pwòp Patwon Mwen.",
  },
  fr: {
    "Back to Entrepreneur Portal": "Retour au Portail Entrepreneur",
    "Communication Center": "Centre de Communication",
    "EPEW Campaign": "Campagne EPEW",
    "Led by": "Dirigée par",
    "This entrepreneur is building more than a business. They are building a community, creating opportunity, and moving toward lasting wealth.": "Cet entrepreneur construit bien plus qu’une entreprise. Il construit une communauté, crée des opportunités et progresse vers une prospérité durable.",
    "Become a Founding Supporter": "Devenir un Soutien Fondateur",
    "Every successful business begins with someone who believes before the doors open.": "Toute entreprise prospère commence avec une personne qui y croit avant même l’ouverture des portes.",
    "Supported": "Soutenu",
    "Required": "Requis",
    "Remaining": "Restant",
    "Community Support Units": "Unités de Soutien Communautaire",
    "Private Entrepreneur View": "Vue Privée de l’Entrepreneur",
    "My Potential Supporters": "Mes Soutiens Potentiels",
    "People you personally contacted and added to your campaign message list. This section is visible only to you.": "Les personnes que vous avez personnellement contactées et ajoutées à votre liste de messages de campagne. Cette section n’est visible que par vous.",
    "+ Add Potential Supporter": "+ Ajouter un Soutien Potentiel",
    "Loading your contact list...": "Chargement de votre liste de contacts...",
    "No potential supporters have been added to your campaign list yet.": "Aucun soutien potentiel n’a encore été ajouté à votre liste de campagne.",
    "Name": "Nom",
    "Contact": "Contact",
    "Language": "Langue",
    "Relationship": "Relation",
    "Support Status": "Statut du Soutien",
    "Message Status": "Statut du Message",
    "Community Leadership Goal": "Objectif de Leadership Communautaire",
    "20 Community Support Units before funding management.": "20 unités de soutien communautaire avant la gestion du financement.",
    "Entrepreneur Story": "Histoire de l’Entrepreneur",
    "Building Credit. Building Business. Building Wealth.": "Construire son Crédit. Construire son Entreprise. Construire son Patrimoine.",
    "Business Category": "Catégorie d’Entreprise",
    "Location": "Localisation",
    "Funding Approval": "Approbation du Financement",
    "Campaign Status": "Statut de la Campagne",
    "Goal Achieved": "Objectif Atteint",
    "Active": "Active",
    "Why Become a Founding Supporter?": "Pourquoi Devenir un Soutien Fondateur ?",
    "You become part of this entrepreneur's success story.": "Vous devenez une partie de l’histoire de réussite de cet entrepreneur.",
    "You will be recognized as a Founding Supporter and be part of their journey and legacy.": "Vous serez reconnu comme Soutien Fondateur et ferez partie de son parcours et de son héritage.",
    "You help launch a real business that serves its community.": "Vous contribuez au lancement d’une véritable entreprise au service de sa communauté.",
    "Your support helps turn a vision into a business that creates value, serves people, and builds opportunity.": "Votre soutien aide à transformer une vision en une entreprise qui crée de la valeur, sert les gens et crée des opportunités.",
    "You may receive participation benefits of up to 6% annually,": "Vous pouvez recevoir des avantages de participation allant jusqu’à 6 % par an,",
    "subject to business performance and EPEW policies.": "selon la performance de l’entreprise et les politiques d’EPEW.",
    "Your support creates jobs, strengthens communities, and helps build the next generation of entrepreneurs.": "Votre soutien crée des emplois, renforce les communautés et contribue à bâtir la prochaine génération d’entrepreneurs.",
    "The EPEW Community Pledge": "L’Engagement Communautaire EPEW",
    "✅ I believe in this entrepreneur's vision.": "✅ Je crois en la vision de cet entrepreneur.",
    "✅ I believe successful businesses are built through community.": "✅ Je crois que les entreprises prospères se construisent grâce à la communauté.",
    "✅ I believe my support can help create opportunity.": "✅ Je crois que mon soutien peut contribuer à créer des opportunités.",
    "Learn About Becoming a Founding Supporter →": "Découvrir Comment Devenir un Soutien Fondateur →",
    "🔒 Secure • Simple • Impactful": "🔒 Sécurisé • Simple • Impactant",
    "Your campaign source is connected to this entrepreneur.": "La source de votre campagne est associée à cet entrepreneur.",
    "Mission Accomplished — Support Continues": "Mission Accomplie — Le Soutien Continue",
    "Build Your Community. Build Your Business. Build Your Wealth.": "Construisez Votre Communauté. Construisez Votre Entreprise. Construisez Votre Patrimoine.",
    "Powered by IBOS — I Am My Own Boss.": "Propulsé par IBOS — Je Suis Mon Propre Patron.",
  },
  es: {
    "Back to Entrepreneur Portal": "Volver al Portal del Emprendedor",
    "Communication Center": "Centro de Comunicación",
    "EPEW Campaign": "Campaña EPEW",
    "Led by": "Dirigida por",
    "This entrepreneur is building more than a business. They are building a community, creating opportunity, and moving toward lasting wealth.": "Este emprendedor está construyendo más que un negocio. Está construyendo una comunidad, creando oportunidades y avanzando hacia una prosperidad duradera.",
    "Become a Founding Supporter": "Convertirse en Colaborador Fundador",
    "Every successful business begins with someone who believes before the doors open.": "Todo negocio exitoso comienza con alguien que cree antes de que se abran las puertas.",
    "Supported": "Apoyado",
    "Required": "Requerido",
    "Remaining": "Restante",
    "Community Support Units": "Unidades de Apoyo Comunitario",
    "Private Entrepreneur View": "Vista Privada del Emprendedor",
    "My Potential Supporters": "Mis Colaboradores Potenciales",
    "People you personally contacted and added to your campaign message list. This section is visible only to you.": "Personas que usted contactó personalmente y agregó a su lista de mensajes de campaña. Esta sección solo es visible para usted.",
    "+ Add Potential Supporter": "+ Agregar Colaborador Potencial",
    "Loading your contact list...": "Cargando su lista de contactos...",
    "No potential supporters have been added to your campaign list yet.": "Aún no se han agregado colaboradores potenciales a su lista de campaña.",
    "Name": "Nombre",
    "Contact": "Contacto",
    "Language": "Idioma",
    "Relationship": "Relación",
    "Support Status": "Estado del Apoyo",
    "Message Status": "Estado del Mensaje",
    "Community Leadership Goal": "Meta de Liderazgo Comunitario",
    "20 Community Support Units before funding management.": "20 unidades de apoyo comunitario antes de la gestión del financiamiento.",
    "Entrepreneur Story": "Historia del Emprendedor",
    "Building Credit. Building Business. Building Wealth.": "Construyendo Crédito. Construyendo Negocio. Construyendo Patrimonio.",
    "Business Category": "Categoría del Negocio",
    "Location": "Ubicación",
    "Funding Approval": "Aprobación de Financiamiento",
    "Campaign Status": "Estado de la Campaña",
    "Goal Achieved": "Meta Alcanzada",
    "Active": "Activa",
    "Why Become a Founding Supporter?": "¿Por Qué Convertirse en Colaborador Fundador?",
    "You become part of this entrepreneur's success story.": "Usted se convierte en parte de la historia de éxito de este emprendedor.",
    "You will be recognized as a Founding Supporter and be part of their journey and legacy.": "Será reconocido como Colaborador Fundador y formará parte de su trayectoria y legado.",
    "You help launch a real business that serves its community.": "Usted ayuda a lanzar un negocio real que sirve a su comunidad.",
    "Your support helps turn a vision into a business that creates value, serves people, and builds opportunity.": "Su apoyo ayuda a convertir una visión en un negocio que crea valor, sirve a las personas y genera oportunidades.",
    "You may receive participation benefits of up to 6% annually,": "Puede recibir beneficios de participación de hasta un 6 % anual,",
    "subject to business performance and EPEW policies.": "sujeto al desempeño del negocio y a las políticas de EPEW.",
    "Your support creates jobs, strengthens communities, and helps build the next generation of entrepreneurs.": "Su apoyo crea empleos, fortalece comunidades y ayuda a formar la próxima generación de emprendedores.",
    "The EPEW Community Pledge": "El Compromiso Comunitario EPEW",
    "✅ I believe in this entrepreneur's vision.": "✅ Creo en la visión de este emprendedor.",
    "✅ I believe successful businesses are built through community.": "✅ Creo que los negocios exitosos se construyen a través de la comunidad.",
    "✅ I believe my support can help create opportunity.": "✅ Creo que mi apoyo puede ayudar a crear oportunidades.",
    "Learn About Becoming a Founding Supporter →": "Conozca Cómo Convertirse en Colaborador Fundador →",
    "🔒 Secure • Simple • Impactful": "🔒 Seguro • Simple • Impactante",
    "Your campaign source is connected to this entrepreneur.": "La fuente de su campaña está conectada con este emprendedor.",
    "Mission Accomplished — Support Continues": "Misión Cumplida — El Apoyo Continúa",
    "Build Your Community. Build Your Business. Build Your Wealth.": "Construya Su Comunidad. Construya Su Negocio. Construya Su Patrimonio.",
    "Powered by IBOS — I Am My Own Boss.": "Impulsado por IBOS — Soy Mi Propio Jefe.",
  },
};

const originalText = new WeakMap<Node, string>();

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function translateTree(root: Node, locale: SupportedLocale) {
  const map = translations[locale] || {};
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const parent = node.parentElement;
    if (parent && !["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(parent.tagName)) {
      const current = node.textContent || "";
      const source = originalText.get(node) || normalize(current);
      if (!originalText.has(node)) originalText.set(node, source);
      const translated = locale === "en" ? source : map[source] || source;
      if (normalize(current) !== translated) node.textContent = translated;
    }
    node = walker.nextNode();
  }
}

export default function CampaignLocalization({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();

  useEffect(() => {
    const root = document.getElementById("epew-campaign-localized");
    if (!root) return;

    const apply = () => translateTree(root, locale);
    apply();

    const observer = new MutationObserver(() => apply());
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  return (
    <div id="epew-campaign-localized">
      <div className="fixed right-4 top-4 z-[120] rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur">
        <LanguageSelector compact showEnglishName={false} />
      </div>
      {children}
    </div>
  );
}
