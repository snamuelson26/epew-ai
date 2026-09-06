"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useEpewLanguage, type EpewLanguage } from "@/app/components/EpewLanguage";

const scripts: Record<EpewLanguage, Record<string, string>> = {
  en: {
    "supporter-hero.png": "Supporters help entrepreneurs turn a business vision into a real opportunity through community participation and encouragement.",
    "why-supporters-matter.png": "Why supporters matter: Your support helps entrepreneurs launch businesses, create jobs, serve communities, and build long-term opportunity.",
    "how-supporters-participate.png": "How supporters participate: Register, choose your support, complete your contribution, follow the business, and see the impact your support helps create.",
    "supporters-ecosystem.png": "The EPEW ecosystem: Supporters help strengthen business preparation, development, launch, and long-term growth across the EPEW community.",
    "supporters-impact.png": "Community impact: Your support can create opportunity, strengthen families and communities, and help build sustainable businesses.",
  },
  ht: {
    "supporter-hero.png": "Sipòtè yo ede antreprenè yo transfòme yon vizyon biznis an yon opòtinite reyèl atravè patisipasyon kominotè ak ankourajman.",
    "why-supporters-matter.png": "Poukisa sipòtè yo enpòtan: Sipò ou ede antreprenè yo lanse biznis, kreye travay, sèvi kominote yo, epi bati opòtinite alontèm.",
    "how-supporters-participate.png": "Kijan sipòtè yo patisipe: Enskri, chwazi sipò ou, finalize kontribisyon ou, suiv biznis la, epi wè enpak sipò ou ede kreye.",
    "supporters-ecosystem.png": "Ekosistèm EPEW la: Sipòtè yo ede ranfòse preparasyon biznis, devlopman, lansman, ak kwasans alontèm nan kominote EPEW la.",
    "supporters-impact.png": "Enpak kominotè: Sipò ou ka kreye opòtinite, ranfòse fanmi ak kominote yo, epi ede bati biznis ki dirab.",
  },
  fr: {
    "supporter-hero.png": "Les soutiens aident les entrepreneurs à transformer une vision d’entreprise en une véritable opportunité grâce à la participation communautaire et aux encouragements.",
    "why-supporters-matter.png": "Pourquoi les soutiens sont importants : votre soutien aide les entrepreneurs à lancer des entreprises, créer des emplois, servir les communautés et bâtir des possibilités à long terme.",
    "how-supporters-participate.png": "Comment les soutiens participent : inscrivez-vous, choisissez votre soutien, complétez votre contribution, suivez l’entreprise et constatez l’impact que votre soutien aide à créer.",
    "supporters-ecosystem.png": "L’écosystème EPEW : les soutiens contribuent à renforcer la préparation, le développement, le lancement et la croissance à long terme des entreprises au sein de la communauté EPEW.",
    "supporters-impact.png": "Impact communautaire : votre soutien peut créer des possibilités, renforcer les familles et les communautés et aider à bâtir des entreprises durables.",
  },
  es: {
    "supporter-hero.png": "Los colaboradores ayudan a los emprendedores a convertir una visión de negocio en una oportunidad real mediante la participación comunitaria y el apoyo.",
    "why-supporters-matter.png": "Por qué importan los colaboradores: su apoyo ayuda a los emprendedores a lanzar negocios, crear empleos, servir a las comunidades y construir oportunidades a largo plazo.",
    "how-supporters-participate.png": "Cómo participan los colaboradores: regístrese, elija su apoyo, complete su contribución, siga el negocio y vea el impacto que su apoyo ayuda a crear.",
    "supporters-ecosystem.png": "El ecosistema EPEW: los colaboradores ayudan a fortalecer la preparación, el desarrollo, el lanzamiento y el crecimiento a largo plazo de los negocios dentro de la comunidad EPEW.",
    "supporters-impact.png": "Impacto comunitario: su apoyo puede crear oportunidades, fortalecer a las familias y comunidades y ayudar a construir negocios sostenibles.",
  },
};

const imageNames = Object.keys(scripts.en);

export default function SupporterImageTranslations() {
  const pathname = usePathname();
  const { language } = useEpewLanguage();

  useEffect(() => {
    if (pathname !== "/supporters") return;

    const applyScripts = () => {
      imageNames.forEach((imageName) => {
        const image = Array.from(document.querySelectorAll<HTMLImageElement>("img")).find((img) => {
          const src = img.getAttribute("src") || "";
          return src.includes(imageName);
        });

        if (!image) return;

        const key = `epew-image-script-${imageName.replace(/[^a-z0-9]/gi, "-")}`;
        let caption = document.getElementById(key);

        if (!caption) {
          caption = document.createElement("div");
          caption.id = key;
          caption.dataset.epewImageScript = "true";
          caption.className =
            "mx-auto mt-4 max-w-5xl rounded-2xl border border-blue-100 bg-white px-5 py-4 text-center text-lg font-semibold leading-relaxed text-slate-700 shadow-sm md:text-xl";
          image.insertAdjacentElement("afterend", caption);
        }

        caption.textContent = scripts[language]?.[imageName] || scripts.en[imageName];
        caption.setAttribute("lang", language);
        caption.setAttribute("aria-label", "Translated image script");
      });
    };

    applyScripts();
    const timeout = window.setTimeout(applyScripts, 400);

    return () => window.clearTimeout(timeout);
  }, [pathname, language]);

  return null;
}
