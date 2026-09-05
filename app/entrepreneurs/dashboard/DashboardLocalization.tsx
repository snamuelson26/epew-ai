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
    "WELCOME TO THE EPEW-EDE-IBOS PROGRAM": "BYENVINI NAN PWOGRAM EPEW-EDE-IBOS LA",
    "Your Entrepreneur Development Ecosystem (EDE) Journey": "Pakou ou nan Ekosistèm Devlopman Antreprenè (EDE)",
    "Your application has been received successfully and is currently under review. Please allow approximately 3 to 15 days for a Personal Coach to be assigned and guide you through the next steps.": "Nou resevwa aplikasyon ou avèk siksè epi li aktyèlman anba revizyon. Tanpri pèmèt anviwon 3 a 15 jou pou yo asiyen yon Antrenè Pèsonèl pou gide ou nan pwochen etap yo.",
    "Logout": "Dekonekte",
    "Your Current Journey": "Pakou Ou Kounye a",
    "Application Received": "Aplikasyon Resevwa",
    "Application Under Review": "Aplikasyon Anba Revizyon",
    "Personal Coach Assigned": "Antrenè Pèsonèl Asiyen",
    "Coach Assigned": "Antrenè Pèsonèl Asiyen",
    "Interview Scheduled": "Entèvyou Pwograme",
    "Business Idea Development": "Devlopman Lide Biznis",
    "Qualification Review": "Revizyon Kalifikasyon",
    "Campaign Activated": "Kanpay Aktive",
    "Invitation Link Available": "Lyen Envitasyon Disponib",
    "Your Appointment": "Randevou Ou",
    "EPEW Establishment Meeting": "Reyinyon Etablisman EPEW",
    "Personal Coach:": "Antrenè Pèsonèl:",
    "Meeting Status:": "Estati Reyinyon an:",
    "Scheduled": "Pwograme",
    "Completed": "Konplete",
    "Rescheduling": "Reyapwograme",
    "Scheduling in Progress": "Pwogramasyon an Ap Fèt",
    "Being Prepared": "An Preparasyon",
    "Missed / No Show": "Rate / Pa Prezante",
    "Missed — Action Required": "Rate — Aksyon Obligatwa",
    "Loading your appointment...": "Randevou ou ap chaje...",
    "Your Establishment Meeting is being prepared.": "Reyinyon Etablisman ou ap prepare.",
    "When your appointment is scheduled, the date, time, Personal Coach, meeting status, and available actions will appear here automatically.": "Lè randevou ou pwograme, dat, lè, Antrenè Pèsonèl, estati reyinyon an, ak aksyon ki disponib yo ap parèt isit la otomatikman.",
    "Join Meeting": "Antre nan Reyinyon an",
    "Change Appointment": "Chanje Randevou",
    "Reschedule Appointment": "Reyapwograme Randevou",
    "Your Current Status": "Estati Ou Kounye a",
    "Our team is reviewing your application and verification documents.": "Ekip nou an ap revize aplikasyon ou ak dokiman verifikasyon ou yo.",
    "Your Next Action": "Pwochen Aksyon Ou",
    "Complete your Entrepreneur Questionnaire and begin thinking about your business idea, your goals, and the impact you want to create.": "Ranpli Kesyonè Antreprenè ou epi kòmanse reflechi sou lide biznis ou, objektif ou, ak enpak ou vle kreye.",
    "Complete Entrepreneur Questionnaire": "Ranpli Kesyonè Antreprenè a",
    "Invitation Link": "Lyen Envitasyon",
    "Your personal invitation link will become available after your interview and successful qualification.": "Lyen envitasyon pèsonèl ou ap disponib apre entèvyou ou ak lè ou kalifye avèk siksè.",
    "While You Wait": "Pandan W ap Tann",
    "Explore Your Dashboard": "Eksplore Tablo Bò Ou",
    "Review your current application status and follow the progress of your journey.": "Revize estati aplikasyon ou kounye a epi suiv pwogrè pakou ou.",
    "Develop Your Vision": "Devlope Vizyon Ou",
    "Begin organizing your business idea, goals, customers, and community impact.": "Kòmanse òganize lide biznis ou, objektif ou, kliyan ou, ak enpak ou sou kominote a.",
    "Prepare for Your Interview": "Prepare pou Entèvyou Ou",
    "Your Personal Coach will guide you through your first interview and qualification process.": "Antrenè Pèsonèl ou ap gide ou pandan premye entèvyou ou ak pwosesis kalifikasyon an.",
    "Entrepreneur Dashboard": "Tablo Bò Antreprenè",
    "Login to Your Entrepreneur Portal": "Konekte nan Pòtal Antreprenè Ou",
    "Loading entrepreneur dashboard...": "Tablo Bò Antreprenè a ap chaje...",
    "Pending Review": "An Atant Revizyon",
  },
  fr: {
    "WELCOME TO THE EPEW-EDE-IBOS PROGRAM": "BIENVENUE AU PROGRAMME EPEW-EDE-IBOS",
    "Your Entrepreneur Development Ecosystem (EDE) Journey": "Votre parcours dans l’Écosystème de Développement des Entrepreneurs (EDE)",
    "Your application has been received successfully and is currently under review. Please allow approximately 3 to 15 days for a Personal Coach to be assigned and guide you through the next steps.": "Votre demande a été reçue avec succès et est actuellement en cours d’examen. Veuillez prévoir environ 3 à 15 jours pour qu’un Coach Personnel vous soit attribué afin de vous guider dans les prochaines étapes.",
    "Logout": "Déconnexion",
    "Your Current Journey": "Votre Parcours Actuel",
    "Application Received": "Demande Reçue",
    "Application Under Review": "Demande en Cours d’Examen",
    "Personal Coach Assigned": "Coach Personnel Attribué",
    "Coach Assigned": "Coach Personnel Attribué",
    "Interview Scheduled": "Entretien Programmé",
    "Business Idea Development": "Développement de l’Idée d’Entreprise",
    "Qualification Review": "Examen de Qualification",
    "Campaign Activated": "Campagne Activée",
    "Invitation Link Available": "Lien d’Invitation Disponible",
    "Your Appointment": "Votre Rendez-vous",
    "EPEW Establishment Meeting": "Réunion d’Établissement EPEW",
    "Personal Coach:": "Coach Personnel :",
    "Meeting Status:": "Statut de la Réunion :",
    "Scheduled": "Programmée",
    "Completed": "Terminée",
    "Rescheduling": "Reprogrammation",
    "Scheduling in Progress": "Programmation en Cours",
    "Being Prepared": "En Préparation",
    "Missed / No Show": "Manqué / Absence",
    "Missed — Action Required": "Manqué — Action Requise",
    "Loading your appointment...": "Chargement de votre rendez-vous...",
    "Your Establishment Meeting is being prepared.": "Votre Réunion d’Établissement est en cours de préparation.",
    "When your appointment is scheduled, the date, time, Personal Coach, meeting status, and available actions will appear here automatically.": "Lorsque votre rendez-vous sera programmé, la date, l’heure, le Coach Personnel, le statut de la réunion et les actions disponibles apparaîtront automatiquement ici.",
    "Join Meeting": "Rejoindre la Réunion",
    "Change Appointment": "Modifier le Rendez-vous",
    "Reschedule Appointment": "Reprogrammer le Rendez-vous",
    "Your Current Status": "Votre Statut Actuel",
    "Our team is reviewing your application and verification documents.": "Notre équipe examine votre demande et vos documents de vérification.",
    "Your Next Action": "Votre Prochaine Action",
    "Complete your Entrepreneur Questionnaire and begin thinking about your business idea, your goals, and the impact you want to create.": "Remplissez votre Questionnaire Entrepreneur et commencez à réfléchir à votre idée d’entreprise, à vos objectifs et à l’impact que vous souhaitez créer.",
    "Complete Entrepreneur Questionnaire": "Remplir le Questionnaire Entrepreneur",
    "Invitation Link": "Lien d’Invitation",
    "Your personal invitation link will become available after your interview and successful qualification.": "Votre lien d’invitation personnel sera disponible après votre entretien et la réussite de votre qualification.",
    "While You Wait": "Pendant Votre Attente",
    "Explore Your Dashboard": "Explorez Votre Tableau de Bord",
    "Review your current application status and follow the progress of your journey.": "Consultez le statut actuel de votre demande et suivez l’évolution de votre parcours.",
    "Develop Your Vision": "Développez Votre Vision",
    "Begin organizing your business idea, goals, customers, and community impact.": "Commencez à organiser votre idée d’entreprise, vos objectifs, vos clients et votre impact sur la communauté.",
    "Prepare for Your Interview": "Préparez-vous à Votre Entretien",
    "Your Personal Coach will guide you through your first interview and qualification process.": "Votre Coach Personnel vous guidera tout au long de votre premier entretien et du processus de qualification.",
    "Entrepreneur Dashboard": "Tableau de Bord Entrepreneur",
    "Login to Your Entrepreneur Portal": "Connexion à Votre Portail des Entrepreneurs",
    "Loading entrepreneur dashboard...": "Chargement du tableau de bord entrepreneur...",
    "Pending Review": "En Attente d’Examen",
  },
  es: {
    "WELCOME TO THE EPEW-EDE-IBOS PROGRAM": "BIENVENIDO AL PROGRAMA EPEW-EDE-IBOS",
    "Your Entrepreneur Development Ecosystem (EDE) Journey": "Su recorrido en el Ecosistema de Desarrollo de Emprendedores (EDE)",
    "Your application has been received successfully and is currently under review. Please allow approximately 3 to 15 days for a Personal Coach to be assigned and guide you through the next steps.": "Su solicitud ha sido recibida exitosamente y actualmente está bajo revisión. Por favor, permita aproximadamente de 3 a 15 días para que se le asigne un Coach Personal que le guíe en los próximos pasos.",
    "Logout": "Cerrar sesión",
    "Your Current Journey": "Su Recorrido Actual",
    "Application Received": "Solicitud Recibida",
    "Application Under Review": "Solicitud Bajo Revisión",
    "Personal Coach Assigned": "Coach Personal Asignado",
    "Coach Assigned": "Coach Personal Asignado",
    "Interview Scheduled": "Entrevista Programada",
    "Business Idea Development": "Desarrollo de la Idea de Negocio",
    "Qualification Review": "Revisión de Calificación",
    "Campaign Activated": "Campaña Activada",
    "Invitation Link Available": "Enlace de Invitación Disponible",
    "Your Appointment": "Su Cita",
    "EPEW Establishment Meeting": "Reunión de Establecimiento EPEW",
    "Personal Coach:": "Coach Personal:",
    "Meeting Status:": "Estado de la Reunión:",
    "Scheduled": "Programada",
    "Completed": "Completada",
    "Rescheduling": "Reprogramando",
    "Scheduling in Progress": "Programación en Curso",
    "Being Prepared": "En Preparación",
    "Missed / No Show": "Perdida / No Asistió",
    "Missed — Action Required": "Perdida — Acción Requerida",
    "Loading your appointment...": "Cargando su cita...",
    "Your Establishment Meeting is being prepared.": "Su Reunión de Establecimiento está siendo preparada.",
    "When your appointment is scheduled, the date, time, Personal Coach, meeting status, and available actions will appear here automatically.": "Cuando se programe su cita, la fecha, la hora, el Coach Personal, el estado de la reunión y las acciones disponibles aparecerán aquí automáticamente.",
    "Join Meeting": "Unirse a la Reunión",
    "Change Appointment": "Cambiar Cita",
    "Reschedule Appointment": "Reprogramar Cita",
    "Your Current Status": "Su Estado Actual",
    "Our team is reviewing your application and verification documents.": "Nuestro equipo está revisando su solicitud y sus documentos de verificación.",
    "Your Next Action": "Su Próxima Acción",
    "Complete your Entrepreneur Questionnaire and begin thinking about your business idea, your goals, and the impact you want to create.": "Complete su Cuestionario de Emprendedor y comience a pensar en su idea de negocio, sus objetivos y el impacto que desea crear.",
    "Complete Entrepreneur Questionnaire": "Completar el Cuestionario de Emprendedor",
    "Invitation Link": "Enlace de Invitación",
    "Your personal invitation link will become available after your interview and successful qualification.": "Su enlace de invitación personal estará disponible después de su entrevista y una calificación exitosa.",
    "While You Wait": "Mientras Espera",
    "Explore Your Dashboard": "Explore Su Panel",
    "Review your current application status and follow the progress of your journey.": "Revise el estado actual de su solicitud y siga el progreso de su recorrido.",
    "Develop Your Vision": "Desarrolle Su Visión",
    "Begin organizing your business idea, goals, customers, and community impact.": "Comience a organizar su idea de negocio, sus objetivos, sus clientes y el impacto en la comunidad.",
    "Prepare for Your Interview": "Prepárese para Su Entrevista",
    "Your Personal Coach will guide you through your first interview and qualification process.": "Su Coach Personal le guiará durante su primera entrevista y el proceso de calificación.",
    "Entrepreneur Dashboard": "Panel del Emprendedor",
    "Login to Your Entrepreneur Portal": "Iniciar Sesión en Su Portal de Emprendedores",
    "Loading entrepreneur dashboard...": "Cargando el panel del emprendedor...",
    "Pending Review": "Pendiente de Revisión",
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

export default function DashboardLocalization({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();

  useEffect(() => {
    const root = document.getElementById("epew-entrepreneur-dashboard-localized");
    if (!root) return;

    const apply = () => translateTree(root, locale);
    apply();

    const observer = new MutationObserver(() => apply());
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  return (
    <div id="epew-entrepreneur-dashboard-localized">
      <div className="fixed right-4 top-4 z-[100] rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur">
        <LanguageSelector compact showEnglishName={false} />
      </div>
      {children}
    </div>
  );
}
