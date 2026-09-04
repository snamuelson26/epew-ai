"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LanguageSelector,
  useLocale,
  type SupportedLocale,
} from "@/app/components/enterprise/language";

const FUNDING_GOAL = 100_000;
const TOTAL_UNITS_AVAILABLE = 20;
const ANNUAL_SUPPORT_PER_UNIT = 5_200;
const PARTICIPATION_BENEFIT_RATE = 8;

const copy: Record<
  SupportedLocale,
  {
    loading: string;
    businessNotFound: string;
    selectedBusinessNotFound: string;
    returnMarketplace: string;
    annualSupport: string;
    supportBusinessPrefix: string;
    entrepreneur: string;
    fundingGoal: string;
    unitsAvailable: string;
    unitPrice: string;
    participationBenefit: string;
    upTo: string;
    supportOptions: string;
    annualPaidOnly: string;
    annualPaidOnlyBody: string;
    chooseSupport: string;
    annualSupportUnits: string;
    selectUnits: string;
    unit: string;
    units: string;
    noUnits: string;
    totalSupportToday: string;
    annualSupportUnit: string;
    annualSupportUnitsLower: string;
    oneTimePayment: string;
    unitsRemaining: string;
    fundingProgress: string;
    referredQuestion: string;
    referredHelp: string;
    referrerName: string;
    referrerBusiness: string;
    optional: string;
    oneTimeAnnualPayment: string;
    annualPaymentBody: string;
    agreementEntrepreneurReview: string;
    agreementEntrepreneurOpen: string;
    agreementEntrepreneurAcceptance: (units: number) => string;
    agreementEpewReview: string;
    agreementEpewOpen: string;
    agreementEpewAcceptanceStart: string;
    agreementEpewAcceptanceEnd: string;
    openingPayment: string;
    continuePayment: string;
    stripeSecure: string;
    businessLoadError: string;
    checkoutLoadError: string;
    supporterNotFound: string;
    allUnitsSupported: string;
    selectBetween: (remaining: number) => string;
    acceptEntrepreneurAgreement: string;
    acceptEpewAgreement: string;
  }
> = {
  en: {
    loading: "Loading EPEW Annual Support...",
    businessNotFound: "Business Not Found",
    selectedBusinessNotFound: "The selected business could not be found.",
    returnMarketplace: "Return to Marketplace",
    annualSupport: "EPEW ANNUAL SUPPORT",
    supportBusinessPrefix: "Support",
    entrepreneur: "Entrepreneur",
    fundingGoal: "Funding Goal",
    unitsAvailable: "Units Available",
    unitPrice: "Unit Price",
    participationBenefit: "Participation Benefit",
    upTo: "Up to",
    supportOptions: "SUPPORT OPTIONS FOR THIS ENTREPRENEUR",
    annualPaidOnly: "Annual Paid-in-Full Support Only",
    annualPaidOnlyBody:
      "This entrepreneur does not accept Weekly or Monthly support. Only full Annual Support Units are available for this support transaction.",
    chooseSupport: "CHOOSE YOUR SUPPORT",
    annualSupportUnits: "Annual Support Units",
    selectUnits:
      "Select the number of annual support units you would like to provide for this business.",
    unit: "Unit",
    units: "Units",
    noUnits: "No units remain available.",
    totalSupportToday: "TOTAL SUPPORT TODAY",
    annualSupportUnit: "annual support unit",
    annualSupportUnitsLower: "annual support units",
    oneTimePayment: "One-time payment",
    unitsRemaining: "Units Remaining",
    fundingProgress: "Funding Progress",
    referredQuestion: "Were You Referred to EPEW?",
    referredHelp: "Optional — complete this only if someone referred you.",
    referrerName: "Referrer's Name",
    referrerBusiness: "Referrer's Business",
    optional: "Optional",
    oneTimeAnnualPayment: "One-Time Annual Payment",
    annualPaymentBody:
      "Your selected Support Units are paid in one payment for the full one-year support period. There is no weekly or monthly billing and no automatic renewal for this support.",
    agreementEntrepreneurReview:
      "Review the approved Supporter–Entrepreneur agreement before accepting.",
    agreementEntrepreneurOpen:
      "Open Supporter–Entrepreneur Participation Agreement",
    agreementEntrepreneurAcceptance: (units) =>
      `I have reviewed and agree to the Supporter–Entrepreneur Participation Agreement. I understand that I am selecting ${units} full annual Support Unit${units === 1 ? "" : "s"} at $5,200 per unit as a one-time payment, with an annual participation benefit of up to 8%. Participation benefits are not guaranteed and depend on applicable program terms and business performance.`,
    agreementEpewReview:
      "Review the agreement between you and EPEW before accepting.",
    agreementEpewOpen:
      "Open EPEW Supporter Platform Participation Agreement",
    agreementEpewAcceptanceStart:
      "I have reviewed and agree to the EPEW Supporter Platform Participation Agreement with",
    agreementEpewAcceptanceEnd:
      ". I understand EPEW's platform, administrative, payment-coordination, recordkeeping, and mediation roles, and I understand that EPEW does not assume the Entrepreneur's restitution, repayment, or other contractual obligations.",
    openingPayment: "Opening Secure Payment...",
    continuePayment: "Continue to Payment",
    stripeSecure: "Secure payment is processed by Stripe.",
    businessLoadError: "Business not found.",
    checkoutLoadError: "Unable to load the checkout page.",
    supporterNotFound: "Your supporter profile could not be found.",
    allUnitsSupported:
      "All available units for this entrepreneur have already been supported.",
    selectBetween: (remaining) =>
      `Please select between 1 and ${remaining} available unit${remaining === 1 ? "" : "s"}.`,
    acceptEntrepreneurAgreement:
      "Please review and accept the Supporter–Entrepreneur Participation Agreement before continuing.",
    acceptEpewAgreement:
      "Please review and accept the EPEW Supporter Platform Participation Agreement before continuing.",
  },
  ht: {
    loading: "Ap chaje Sipò Anyèl EPEW...",
    businessNotFound: "Biznis Pa Jwenn",
    selectedBusinessNotFound: "Nou pa t kapab jwenn biznis ou chwazi a.",
    returnMarketplace: "Retounen nan Mache a",
    annualSupport: "SIPÒ ANYÈL EPEW",
    supportBusinessPrefix: "Sipòte",
    entrepreneur: "Antreprenè",
    fundingGoal: "Objektif Finansman",
    unitsAvailable: "Inite Disponib",
    unitPrice: "Pri Inite",
    participationBenefit: "Benefis Patisipasyon",
    upTo: "Jiska",
    supportOptions: "OPSYON SIPÒ POU ANTREPRENÈ SA A",
    annualPaidOnly: "Sipò Anyèl Peye Anplen Sèlman",
    annualPaidOnlyBody:
      "Antreprenè sa a pa aksepte sipò chak semèn oswa chak mwa. Se sèlman Inite Sipò Anyèl ki peye anplen ki disponib pou tranzaksyon sipò sa a.",
    chooseSupport: "CHWAZI SIPÒ OU",
    annualSupportUnits: "Inite Sipò Anyèl",
    selectUnits:
      "Chwazi kantite Inite Sipò Anyèl ou ta renmen bay biznis sa a.",
    unit: "Inite",
    units: "Inite",
    noUnits: "Pa gen okenn inite ki rete disponib.",
    totalSupportToday: "TOTAL SIPÒ JODI A",
    annualSupportUnit: "inite sipò anyèl",
    annualSupportUnitsLower: "inite sipò anyèl",
    oneTimePayment: "Yon sèl peman",
    unitsRemaining: "Inite ki Rete",
    fundingProgress: "Pwogrè Finansman",
    referredQuestion: "Èske Yon Moun Te Rekòmande EPEW Ba Ou?",
    referredHelp: "Opsyonèl — ranpli sa sèlman si yon moun te refere ou.",
    referrerName: "Non Moun ki Refere Ou a",
    referrerBusiness: "Biznis Moun ki Refere Ou a",
    optional: "Opsyonèl",
    oneTimeAnnualPayment: "Yon Sèl Peman Anyèl",
    annualPaymentBody:
      "Inite Sipò ou chwazi yo peye nan yon sèl peman pou tout peryòd sipò yon ane a. Pa gen okenn bòdwo chak semèn oswa chak mwa, epi sipò sa a pa renouvle otomatikman.",
    agreementEntrepreneurReview:
      "Revize Akò Sipòtè–Antreprenè ki apwouve a anvan ou aksepte.",
    agreementEntrepreneurOpen:
      "Louvri Akò Patisipasyon Sipòtè–Antreprenè",
    agreementEntrepreneurAcceptance: (units) =>
      `Mwen revize epi mwen dakò ak Akò Patisipasyon Sipòtè–Antreprenè a. Mwen konprann mwen chwazi ${units} Inite Sipò Anyèl konplè a $5,200 pou chak inite kòm yon sèl peman, avèk yon benefis patisipasyon anyèl jiska 8%. Benefis patisipasyon yo pa garanti epi yo depann de kondisyon pwogram ki aplikab yo ak pèfòmans biznis la.`,
    agreementEpewReview:
      "Revize akò ki genyen ant ou menm ak EPEW anvan ou aksepte.",
    agreementEpewOpen:
      "Louvri Akò Patisipasyon Sipòtè sou Platfòm EPEW",
    agreementEpewAcceptanceStart:
      "Mwen revize epi mwen dakò ak Akò Patisipasyon Sipòtè sou Platfòm EPEW avèk",
    agreementEpewAcceptanceEnd:
      ". Mwen konprann wòl EPEW nan platfòm nan, administrasyon, kowòdinasyon peman, kenbe dosye, ak medyasyon, epi mwen konprann EPEW pa pran responsablite pou restitisyon, ranbousman, oswa lòt obligasyon kontra Antreprenè a.",
    openingPayment: "Ap Louvri Peman Sekirize...",
    continuePayment: "Kontinye pou Peman",
    stripeSecure: "Stripe trete peman an an sekirite.",
    businessLoadError: "Biznis pa jwenn.",
    checkoutLoadError: "Nou pa kapab chaje paj peman an.",
    supporterNotFound: "Nou pa t kapab jwenn pwofil sipòtè ou.",
    allUnitsSupported:
      "Tout inite ki te disponib pou antreprenè sa a deja jwenn sipò.",
    selectBetween: (remaining) =>
      `Tanpri chwazi ant 1 ak ${remaining} inite ki disponib.`,
    acceptEntrepreneurAgreement:
      "Tanpri revize epi aksepte Akò Patisipasyon Sipòtè–Antreprenè a anvan ou kontinye.",
    acceptEpewAgreement:
      "Tanpri revize epi aksepte Akò Patisipasyon Sipòtè sou Platfòm EPEW anvan ou kontinye.",
  },
  fr: {
    loading: "Chargement du Soutien Annuel EPEW...",
    businessNotFound: "Entreprise Introuvable",
    selectedBusinessNotFound: "L’entreprise sélectionnée est introuvable.",
    returnMarketplace: "Retourner à la Place de Marché",
    annualSupport: "SOUTIEN ANNUEL EPEW",
    supportBusinessPrefix: "Soutenez",
    entrepreneur: "Entrepreneur",
    fundingGoal: "Objectif de Financement",
    unitsAvailable: "Unités Disponibles",
    unitPrice: "Prix par Unité",
    participationBenefit: "Avantage de Participation",
    upTo: "Jusqu’à",
    supportOptions: "OPTIONS DE SOUTIEN POUR CET ENTREPRENEUR",
    annualPaidOnly: "Soutien Annuel Payé Intégralement Uniquement",
    annualPaidOnlyBody:
      "Cet entrepreneur n’accepte pas de soutien hebdomadaire ou mensuel. Seules les Unités de Soutien Annuel payées intégralement sont disponibles pour cette transaction.",
    chooseSupport: "CHOISISSEZ VOTRE SOUTIEN",
    annualSupportUnits: "Unités de Soutien Annuel",
    selectUnits:
      "Sélectionnez le nombre d’Unités de Soutien Annuel que vous souhaitez fournir à cette entreprise.",
    unit: "Unité",
    units: "Unités",
    noUnits: "Aucune unité ne reste disponible.",
    totalSupportToday: "SOUTIEN TOTAL AUJOURD’HUI",
    annualSupportUnit: "unité de soutien annuel",
    annualSupportUnitsLower: "unités de soutien annuel",
    oneTimePayment: "Paiement unique",
    unitsRemaining: "Unités Restantes",
    fundingProgress: "Progression du Financement",
    referredQuestion: "Avez-vous été Recommandé à EPEW ?",
    referredHelp:
      "Facultatif — remplissez cette section uniquement si quelqu’un vous a recommandé.",
    referrerName: "Nom de la Personne qui vous a Recommandé",
    referrerBusiness: "Entreprise de la Personne qui vous a Recommandé",
    optional: "Facultatif",
    oneTimeAnnualPayment: "Paiement Annuel Unique",
    annualPaymentBody:
      "Les Unités de Soutien sélectionnées sont payées en un seul paiement pour toute la période de soutien d’un an. Il n’y a aucune facturation hebdomadaire ou mensuelle et aucun renouvellement automatique pour ce soutien.",
    agreementEntrepreneurReview:
      "Examinez l’Accord Soutien–Entrepreneur approuvé avant de l’accepter.",
    agreementEntrepreneurOpen:
      "Ouvrir l’Accord de Participation Soutien–Entrepreneur",
    agreementEntrepreneurAcceptance: (units) =>
      `J’ai examiné et j’accepte l’Accord de Participation Soutien–Entrepreneur. Je comprends que je sélectionne ${units} Unité${units === 1 ? "" : "s"} de Soutien Annuel complète${units === 1 ? "" : "s"} à 5 200 $ par unité, payée${units === 1 ? "" : "s"} en une seule fois, avec un avantage annuel de participation pouvant atteindre 8 %. Les avantages de participation ne sont pas garantis et dépendent des conditions applicables du programme et de la performance de l’entreprise.`,
    agreementEpewReview:
      "Examinez l’accord entre vous et EPEW avant de l’accepter.",
    agreementEpewOpen:
      "Ouvrir l’Accord de Participation du Soutien à la Plateforme EPEW",
    agreementEpewAcceptanceStart:
      "J’ai examiné et j’accepte l’Accord de Participation du Soutien à la Plateforme EPEW avec",
    agreementEpewAcceptanceEnd:
      ". Je comprends les rôles d’EPEW concernant la plateforme, l’administration, la coordination des paiements, la tenue des dossiers et la médiation, et je comprends qu’EPEW n’assume aucune obligation de restitution, de remboursement ou autre obligation contractuelle de l’Entrepreneur.",
    openingPayment: "Ouverture du Paiement Sécurisé...",
    continuePayment: "Continuer vers le Paiement",
    stripeSecure: "Le paiement sécurisé est traité par Stripe.",
    businessLoadError: "Entreprise introuvable.",
    checkoutLoadError: "Impossible de charger la page de paiement.",
    supporterNotFound: "Votre profil de soutien est introuvable.",
    allUnitsSupported:
      "Toutes les unités disponibles pour cet entrepreneur ont déjà été soutenues.",
    selectBetween: (remaining) =>
      `Veuillez sélectionner entre 1 et ${remaining} unité${remaining === 1 ? "" : "s"} disponible${remaining === 1 ? "" : "s"}.`,
    acceptEntrepreneurAgreement:
      "Veuillez examiner et accepter l’Accord de Participation Soutien–Entrepreneur avant de continuer.",
    acceptEpewAgreement:
      "Veuillez examiner et accepter l’Accord de Participation du Soutien à la Plateforme EPEW avant de continuer.",
  },
  es: {
    loading: "Cargando el Apoyo Anual EPEW...",
    businessNotFound: "Negocio No Encontrado",
    selectedBusinessNotFound: "No se pudo encontrar el negocio seleccionado.",
    returnMarketplace: "Volver al Mercado",
    annualSupport: "APOYO ANUAL EPEW",
    supportBusinessPrefix: "Apoye a",
    entrepreneur: "Emprendedor",
    fundingGoal: "Meta de Financiamiento",
    unitsAvailable: "Unidades Disponibles",
    unitPrice: "Precio por Unidad",
    participationBenefit: "Beneficio de Participación",
    upTo: "Hasta",
    supportOptions: "OPCIONES DE APOYO PARA ESTE EMPRENDEDOR",
    annualPaidOnly: "Solo Apoyo Anual Pagado en su Totalidad",
    annualPaidOnlyBody:
      "Este emprendedor no acepta apoyo semanal ni mensual. Solo están disponibles Unidades de Apoyo Anual pagadas en su totalidad para esta transacción.",
    chooseSupport: "ELIJA SU APOYO",
    annualSupportUnits: "Unidades de Apoyo Anual",
    selectUnits:
      "Seleccione la cantidad de Unidades de Apoyo Anual que desea aportar a este negocio.",
    unit: "Unidad",
    units: "Unidades",
    noUnits: "No quedan unidades disponibles.",
    totalSupportToday: "APOYO TOTAL HOY",
    annualSupportUnit: "unidad de apoyo anual",
    annualSupportUnitsLower: "unidades de apoyo anual",
    oneTimePayment: "Pago único",
    unitsRemaining: "Unidades Restantes",
    fundingProgress: "Progreso del Financiamiento",
    referredQuestion: "¿Alguien lo Refirió a EPEW?",
    referredHelp: "Opcional — complete esta sección solo si alguien lo refirió.",
    referrerName: "Nombre de la Persona que lo Refirió",
    referrerBusiness: "Negocio de la Persona que lo Refirió",
    optional: "Opcional",
    oneTimeAnnualPayment: "Pago Anual Único",
    annualPaymentBody:
      "Las Unidades de Apoyo seleccionadas se pagan en un solo pago por todo el período de apoyo de un año. No hay facturación semanal ni mensual ni renovación automática para este apoyo.",
    agreementEntrepreneurReview:
      "Revise el Acuerdo Colaborador–Emprendedor aprobado antes de aceptarlo.",
    agreementEntrepreneurOpen:
      "Abrir el Acuerdo de Participación Colaborador–Emprendedor",
    agreementEntrepreneurAcceptance: (units) =>
      `He revisado y acepto el Acuerdo de Participación Colaborador–Emprendedor. Entiendo que estoy seleccionando ${units} Unidad${units === 1 ? "" : "es"} de Apoyo Anual completa${units === 1 ? "" : "s"} a $5,200 por unidad como pago único, con un beneficio anual de participación de hasta 8 %. Los beneficios de participación no están garantizados y dependen de los términos aplicables del programa y del desempeño del negocio.`,
    agreementEpewReview:
      "Revise el acuerdo entre usted y EPEW antes de aceptarlo.",
    agreementEpewOpen:
      "Abrir el Acuerdo de Participación del Colaborador en la Plataforma EPEW",
    agreementEpewAcceptanceStart:
      "He revisado y acepto el Acuerdo de Participación del Colaborador en la Plataforma EPEW con",
    agreementEpewAcceptanceEnd:
      ". Entiendo las funciones de EPEW relacionadas con la plataforma, la administración, la coordinación de pagos, el mantenimiento de registros y la mediación, y entiendo que EPEW no asume las obligaciones de restitución, reembolso u otras obligaciones contractuales del Emprendedor.",
    openingPayment: "Abriendo Pago Seguro...",
    continuePayment: "Continuar al Pago",
    stripeSecure: "El pago seguro es procesado por Stripe.",
    businessLoadError: "Negocio no encontrado.",
    checkoutLoadError: "No se pudo cargar la página de pago.",
    supporterNotFound: "No se pudo encontrar su perfil de colaborador.",
    allUnitsSupported:
      "Todas las unidades disponibles para este emprendedor ya han recibido apoyo.",
    selectBetween: (remaining) =>
      `Seleccione entre 1 y ${remaining} unidad${remaining === 1 ? "" : "es"} disponible${remaining === 1 ? "" : "s"}.`,
    acceptEntrepreneurAgreement:
      "Revise y acepte el Acuerdo de Participación Colaborador–Emprendedor antes de continuar.",
    acceptEpewAgreement:
      "Revise y acepte el Acuerdo de Participación del Colaborador en la Plataforma EPEW antes de continuar.",
  },
};

export default function SupportCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
  const t = copy[locale];

  const businessId = Array.isArray(params.slug)
    ? params.slug[0]
    : String(params.slug || "");

  const [business, setBusiness] = useState<any>(null);
  const [supporter, setSupporter] = useState<any>(null);
  const [units, setUnits] = useState(1);
  const [referrerName, setReferrerName] = useState("");
  const [referrerBusinessName, setReferrerBusinessName] = useState("");
  const [entrepreneurAgreementAccepted, setEntrepreneurAgreementAccepted] =
    useState(false);
  const [epewAgreementAccepted, setEpewAgreementAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (businessId) {
      void loadCheckout();
    }
  }, [businessId]);

  async function loadCheckout() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        const nextPath = encodeURIComponent(`/support/${businessId}/checkout`);
        router.push(`/supporters/login?next=${nextPath}`);
        return;
      }

      const {
        data: supporterData,
        error: supporterError,
      } = await supabase
        .from("supporters")
        .select("*")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (supporterError) {
        throw new Error(
          `Unable to load supporter profile: ${supporterError.message}`
        );
      }

      if (!supporterData) {
        const nextPath = encodeURIComponent(`/support/${businessId}/checkout`);
        router.push(
          `/supporters/register?business_id=${businessId}&next=${nextPath}`
        );
        return;
      }

      setSupporter(supporterData);

      const {
        data: businessData,
        error: businessError,
      } = await supabase
        .from("entrepreneurs")
        .select("*")
        .eq("public_business_id", businessId)
        .maybeSingle();

      if (businessError) {
        throw new Error(`Unable to load business: ${businessError.message}`);
      }

      if (!businessData) {
        setBusiness(null);
        setErrorMessage(t.businessLoadError);
        return;
      }

      setBusiness(businessData);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.checkoutLoadError;
      console.error("Annual support checkout load error:", error);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  const businessName = business?.business_name || "Business";
  const entrepreneurName =
    business?.full_name || business?.name || "EPEW Entrepreneur";
  const entrepreneurPhoto =
    business?.entrepreneur_photo ||
    business?.entrepreneur_photo_url ||
    business?.photo_url ||
    business?.profile_photo_url ||
    "";
  const businessLogo =
    business?.business_logo ||
    business?.business_logo_url ||
    business?.logo_url ||
    "";

  const unitsAvailable =
    Number(business?.units_required || 0) > 0
      ? Number(business.units_required)
      : TOTAL_UNITS_AVAILABLE;
  const unitsSupported = Math.max(Number(business?.units_supported || 0), 0);
  const unitsRemaining = Math.max(unitsAvailable - unitsSupported, 0);

  useEffect(() => {
    if (unitsRemaining > 0 && units > unitsRemaining) {
      setUnits(unitsRemaining);
    }
  }, [unitsRemaining, units]);

  const totalAnnualSupport = useMemo(
    () => Math.max(units, 0) * ANNUAL_SUPPORT_PER_UNIT,
    [units]
  );
  const unitsRemainingAfterSelection = Math.max(unitsRemaining - units, 0);
  const totalUnitsAfterSelection = unitsSupported + units;
  const supportTotalAfterSelection =
    totalUnitsAfterSelection * ANNUAL_SUPPORT_PER_UNIT;
  const fundingProgressAfterSelection = Math.min(
    (supportTotalAfterSelection / FUNDING_GOAL) * 100,
    100
  );

  const supportReturnPath = `/support/${businessId}/checkout`;
  const encodedSupportReturnPath = encodeURIComponent(supportReturnPath);

  useEffect(() => {
    try {
      if (
        window.sessionStorage.getItem(
          `epew_supporter_entrepreneur_agreement:${supportReturnPath}`
        ) === "accepted"
      ) {
        setEntrepreneurAgreementAccepted(true);
      }
      if (
        window.sessionStorage.getItem(
          `epew_supporter_platform_agreement:${supportReturnPath}`
        ) === "accepted"
      ) {
        setEpewAgreementAccepted(true);
      }
    } catch {
      // Direct acceptance remains available on this page.
    }
  }, [supportReturnPath]);

  function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function continueToStripeCheckout() {
    setErrorMessage("");

    if (!business) {
      setErrorMessage(t.selectedBusinessNotFound);
      return;
    }
    if (!supporter) {
      setErrorMessage(t.supporterNotFound);
      return;
    }
    if (unitsRemaining < 1) {
      setErrorMessage(t.allUnitsSupported);
      return;
    }
    if (!Number.isInteger(units) || units < 1 || units > unitsRemaining) {
      setErrorMessage(t.selectBetween(unitsRemaining));
      return;
    }
    if (!entrepreneurAgreementAccepted) {
      setErrorMessage(t.acceptEntrepreneurAgreement);
      return;
    }
    if (!epewAgreementAccepted) {
      setErrorMessage(t.acceptEpewAgreement);
      return;
    }

    setSubmitting(true);

    try {
      const agreementResponse = await fetch(
        "/api/supporters/platform-participation-agreement/accept",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accepted: true }),
        }
      );

      const agreementText = await agreementResponse.text();
      let agreementResult: { error?: string } = {};
      try {
        agreementResult = agreementText ? JSON.parse(agreementText) : {};
      } catch {
        throw new Error("The agreement server returned an invalid response.");
      }
      if (!agreementResponse.ok) {
        throw new Error(
          agreementResult.error ||
            "Unable to record the EPEW Supporter Platform Participation Agreement acceptance."
        );
      }

      const response = await fetch("/api/supporters/annual-support/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supporterId: supporter.id,
          units,
          selectionMethod: "self_selected",
          allocationPreference: "one_business",
          selectedEntrepreneurId: String(business.id),
          referrerName: referrerName.trim() || undefined,
          referredBusinessName: referrerBusinessName.trim() || undefined,
          referralSource:
            referrerName.trim() || referrerBusinessName.trim()
              ? "supporter_entered"
              : undefined,
        }),
      });

      const responseText = await response.text();
      let result: {
        checkoutUrl?: string;
        sessionId?: string;
        supportIntentId?: string;
        error?: string;
      } = {};
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("The checkout server returned an invalid response.");
      }
      if (!response.ok) {
        throw new Error(result.error || "Unable to create the annual support checkout.");
      }
      if (!result.checkoutUrl) {
        throw new Error("Stripe did not return a secure checkout URL.");
      }
      window.location.href = result.checkoutUrl;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to open Stripe Checkout.";
      console.error("Annual Stripe checkout error:", error);
      setErrorMessage(message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-8">
        <h1 className="text-4xl font-extrabold text-[#06245c]">{t.loading}</h1>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-xl">
          <div className="mb-6 flex justify-center">
            <LanguageSelector compact showEnglishName={false} />
          </div>
          <h1 className="text-4xl font-extrabold">{t.businessNotFound}</h1>
          <p className="mt-5 text-xl text-gray-700">
            {errorMessage || t.selectedBusinessNotFound}
          </p>
          <button
            type="button"
            onClick={() => router.push("/supporters/marketplace")}
            className="mt-8 rounded-2xl bg-[#06245c] px-8 py-4 text-xl font-bold text-white"
          >
            {t.returnMarketplace}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fa] px-4 py-8 text-[#06245c] md:py-12">
      <section className="mx-auto max-w-4xl">
        <div className="mb-4 flex justify-end">
          <LanguageSelector compact showEnglishName={false} />
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="bg-[#06245c] px-6 py-8 text-center text-white md:px-10">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-lime-300 md:text-base">
              {t.annualSupport}
            </p>

            <div className="mt-6 flex items-center justify-center gap-5 md:gap-8">
              {entrepreneurPhoto ? (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-xl md:h-36 md:w-36">
                  <img
                    src={entrepreneurPhoto}
                    alt={entrepreneurName}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              {businessLogo ? (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-xl md:h-36 md:w-36">
                  <img
                    src={businessLogo}
                    alt={`${businessName} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : null}
            </div>

            <h1 className="mt-6 text-3xl font-black md:text-5xl">
              {t.supportBusinessPrefix} {businessName}
            </h1>
            <p className="mt-2 text-lg text-blue-100 md:text-xl">
              {t.entrepreneur}:{" "}
              <span className="font-black text-white">{entrepreneurName}</span>
            </p>
          </div>

          <div className="px-5 py-7 md:px-10 md:py-10">
            {errorMessage && (
              <div className="mb-7 rounded-2xl border-2 border-red-300 bg-red-50 p-5 text-center font-bold text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t.fundingGoal}</p>
                <p className="mt-2 text-xl font-black md:text-2xl">$100,000</p>
              </div>
              <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t.unitsAvailable}</p>
                <p className="mt-2 text-xl font-black md:text-2xl">{unitsAvailable}</p>
              </div>
              <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t.unitPrice}</p>
                <p className="mt-2 text-xl font-black md:text-2xl">$5,200</p>
              </div>
              <div className="rounded-2xl bg-green-50 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700">{t.participationBenefit}</p>
                <p className="mt-2 text-xl font-black text-green-700 md:text-2xl">
                  {t.upTo} {PARTICIPATION_BENEFIT_RATE}%
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">{t.supportOptions}</p>
              <p className="mt-2 text-2xl font-black text-[#06245c]">{t.annualPaidOnly}</p>
              <p className="mx-auto mt-2 max-w-2xl font-semibold text-gray-700">{t.annualPaidOnlyBody}</p>
            </div>

            <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg md:p-8">
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">{t.chooseSupport}</p>
                <h2 className="mt-2 text-3xl font-black md:text-4xl">{t.annualSupportUnits}</h2>
                <p className="mx-auto mt-3 max-w-xl leading-relaxed text-gray-600">{t.selectUnits}</p>
              </div>

              <div className="mx-auto mt-7 max-w-xl">
                {unitsRemaining > 0 ? (
                  <select
                    id="units"
                    value={units}
                    onChange={(event) => {
                      setUnits(Number(event.target.value));
                      setErrorMessage("");
                    }}
                    className="w-full rounded-2xl border-2 border-gray-300 bg-white p-4 text-center text-xl font-black outline-none transition focus:border-green-600"
                  >
                    {Array.from({ length: unitsRemaining }, (_, index) => index + 1).map(
                      (unitOption) => (
                        <option key={unitOption} value={unitOption}>
                          {unitOption} {unitOption === 1 ? t.unit : t.units}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <div className="rounded-2xl bg-red-50 p-5 text-center font-bold text-red-700">{t.noUnits}</div>
                )}
              </div>

              <div className="mx-auto mt-7 max-w-xl rounded-3xl bg-[#06245c] px-6 py-7 text-center text-white shadow-lg">
                <p className="text-sm font-bold uppercase tracking-wider text-blue-200">{t.totalSupportToday}</p>
                <p className="mt-2 text-4xl font-black md:text-5xl">{formatCurrency(totalAnnualSupport)}</p>
                <p className="mt-3 text-blue-100">
                  {units} {units === 1 ? t.annualSupportUnit : t.annualSupportUnitsLower} • {t.oneTimePayment}
                </p>
              </div>

              <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                  <p className="text-xs font-bold uppercase text-gray-500">{t.unitsRemaining}</p>
                  <p className="mt-1 text-2xl font-black">{unitsRemainingAfterSelection}</p>
                </div>
                <div className="rounded-2xl bg-[#f5f7fb] p-4 text-center">
                  <p className="text-xs font-bold uppercase text-gray-500">{t.fundingProgress}</p>
                  <p className="mt-1 text-2xl font-black">{fundingProgressAfterSelection.toFixed(2)}%</p>
                </div>
              </div>

              <div className="mx-auto mt-4 max-w-xl overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-green-600 transition-all"
                  style={{ width: `${fundingProgressAfterSelection}%` }}
                />
              </div>
            </section>

            <section className="mt-7 rounded-3xl border border-blue-200 bg-blue-50 p-6 md:p-7">
              <h3 className="text-xl font-black">{t.referredQuestion}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{t.referredHelp}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="referrerName" className="block text-sm font-bold">{t.referrerName}</label>
                  <input
                    id="referrerName"
                    type="text"
                    value={referrerName}
                    onChange={(event) => setReferrerName(event.target.value)}
                    placeholder={t.optional}
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-white p-4 outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label htmlFor="referrerBusinessName" className="block text-sm font-bold">{t.referrerBusiness}</label>
                  <input
                    id="referrerBusinessName"
                    type="text"
                    value={referrerBusinessName}
                    onChange={(event) => setReferrerBusinessName(event.target.value)}
                    placeholder={t.optional}
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-white p-4 outline-none focus:border-green-600"
                  />
                </div>
              </div>
            </section>

            <div className="mt-7 rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
              <h3 className="text-xl font-black">{t.oneTimeAnnualPayment}</h3>
              <p className="mx-auto mt-2 max-w-2xl leading-relaxed text-gray-700">{t.annualPaymentBody}</p>
            </div>

            <div className="mt-7 rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 rounded-2xl bg-blue-50 p-5 text-center">
                <p className="font-black text-[#06245c]">{t.agreementEntrepreneurReview}</p>
                <a
                  href={`/supporters/supporter-entrepreneur-participation-agreement?returnTo=${encodedSupportReturnPath}`}
                  className="mt-3 inline-block font-black text-blue-700 underline underline-offset-4 hover:text-green-700"
                >
                  {t.agreementEntrepreneurOpen}
                </a>
              </div>
              <label className="flex cursor-pointer items-start gap-4">
                <input
                  type="checkbox"
                  checked={entrepreneurAgreementAccepted}
                  onChange={(event) => {
                    setEntrepreneurAgreementAccepted(event.target.checked);
                    setErrorMessage("");
                  }}
                  className="mt-1 h-6 w-6 shrink-0"
                />
                <span className="leading-relaxed text-gray-700">{t.agreementEntrepreneurAcceptance(units)}</span>
              </label>
            </div>

            <div className="mt-7 rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 rounded-2xl bg-green-50 p-5 text-center">
                <p className="font-black text-[#06245c]">{t.agreementEpewReview}</p>
                <a
                  href={`/supporters/platform-participation-agreement?returnTo=${encodedSupportReturnPath}`}
                  className="mt-3 inline-block font-black text-blue-700 underline underline-offset-4 hover:text-green-700"
                >
                  {t.agreementEpewOpen}
                </a>
              </div>
              <label className="flex cursor-pointer items-start gap-4">
                <input
                  type="checkbox"
                  checked={epewAgreementAccepted}
                  onChange={(event) => {
                    setEpewAgreementAccepted(event.target.checked);
                    setErrorMessage("");
                  }}
                  className="mt-1 h-6 w-6 shrink-0"
                />
                <span className="leading-relaxed text-gray-700">
                  {t.agreementEpewAcceptanceStart}{" "}
                  <strong>EPEW (EKERO Partners Empower Wealth LLC)</strong>
                  {t.agreementEpewAcceptanceEnd}
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={continueToStripeCheckout}
              disabled={
                submitting ||
                !entrepreneurAgreementAccepted ||
                !epewAgreementAccepted ||
                unitsRemaining < 1
              }
              className="mt-7 w-full rounded-2xl bg-green-700 px-6 py-5 text-xl font-black text-white shadow-xl transition hover:bg-[#06245c] disabled:cursor-not-allowed disabled:bg-gray-400 md:text-2xl"
            >
              {submitting
                ? t.openingPayment
                : `${t.continuePayment} — ${formatCurrency(totalAnnualSupport)}`}
            </button>

            <p className="mt-4 text-center text-sm font-semibold text-gray-500">{t.stripeSecure}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
