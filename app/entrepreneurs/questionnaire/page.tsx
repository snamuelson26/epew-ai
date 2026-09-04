"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LanguageSelector, useEpewLanguage } from "@/app/components/EpewLanguage";

const questions = {
  en: [
    "Describe your business idea and explain why you want to start this business.",
    "What language are you most comfortable using during your interview and coaching sessions? (English, Haitian Creole, French, Spanish, Tagalog, or another language)",
    "What do you expect from the EPEW team and your assigned coach?",
    "Where do you see yourself and your business in five years?",
    "What problem does your business solve?",
    "Who are your target customers?",
    "What industry are you entering? (Retail, Technology, Food, Consulting, Services, Nonprofit, Education, etc.)",
    "Are you starting completely from scratch, buying an existing business, or expanding an existing business?",
    "What product or service will you offer?",
    "How much funding do you need and why?",
    "How will you use the funding received?",
    "How will your business generate income?",
    "How much time can you commit weekly to building this business?",
    "Who will help you promote or support your business?",
    "Do you currently have a profession or specialized skills? Please describe them.",
    "Are you currently employed or self-employed?",
    "Approximately how much income do you earn per year?",
    "What experience or skills do you have that will help you succeed in this business?",
    "Are you prepared for the possibility of failure, changes, or business pivots?",
    "What are your next three steps before launching?"
  ],
  ht: [
    "Dekri lide biznis ou epi eksplike poukisa ou vle kòmanse biznis sa a.",
    "Ki lang ou pi alèz itilize pandan entèvyou ou ak sesyon antrenman yo? (Angle, Kreyòl Ayisyen, Franse, Panyòl, Tagalog, oswa yon lòt lang)",
    "Kisa ou espere nan men ekip EPEW la ak antrenè yo asiyen pou ou a?",
    "Ki kote ou wè tèt ou ak biznis ou nan senk ane?",
    "Ki pwoblèm biznis ou rezoud?",
    "Ki moun ki kliyan ou vize yo?",
    "Nan ki sektè ou pral antre? (Komès Detay, Teknoloji, Manje, Konsiltasyon, Sèvis, Òganizasyon San Bi Likratif, Edikasyon, elatriye)",
    "Èske w ap kòmanse nèt depi nan kòmansman, achte yon biznis ki deja egziste, oswa elaji yon biznis ki deja egziste?",
    "Ki pwodwi oswa sèvis ou pral ofri?",
    "Konbyen finansman ou bezwen epi poukisa?",
    "Kijan ou pral itilize finansman ou resevwa a?",
    "Kijan biznis ou pral jenere revni?",
    "Konbyen tan ou kapab konsakre chak semèn pou devlope biznis sa a?",
    "Ki moun ki pral ede ou fè pwomosyon oswa sipòte biznis ou?",
    "Èske ou genyen yon pwofesyon oswa konpetans espesyalize kounye a? Tanpri dekri yo.",
    "Èske ou travay pou yon anplwayè oswa èske ou travay pou tèt ou kounye a?",
    "Apeprè konbyen revni ou touche chak ane?",
    "Ki eksperyans oswa konpetans ou genyen ki pral ede ou reyisi nan biznis sa a?",
    "Èske ou prepare pou posiblite echèk, chanjman, oswa pou adapte direksyon biznis la?",
    "Ki twa pwochen etap ou anvan lansman an?"
  ],
  fr: [
    "Décrivez votre idée d’entreprise et expliquez pourquoi vous souhaitez lancer cette entreprise.",
    "Dans quelle langue êtes-vous le plus à l’aise pendant votre entretien et vos séances de coaching ? (anglais, créole haïtien, français, espagnol, tagalog ou autre langue)",
    "Qu’attendez-vous de l’équipe EPEW et du coach qui vous a été assigné ?",
    "Où vous voyez-vous, ainsi que votre entreprise, dans cinq ans ?",
    "Quel problème votre entreprise résout-elle ?",
    "Qui sont vos clients cibles ?",
    "Dans quel secteur allez-vous exercer ? (commerce de détail, technologie, alimentation, conseil, services, organisme à but non lucratif, éducation, etc.)",
    "Démarrez-vous entièrement de zéro, achetez-vous une entreprise existante ou développez-vous une entreprise existante ?",
    "Quel produit ou service allez-vous proposer ?",
    "De quel montant de financement avez-vous besoin et pourquoi ?",
    "Comment utiliserez-vous le financement reçu ?",
    "Comment votre entreprise générera-t-elle des revenus ?",
    "Combien de temps pouvez-vous consacrer chaque semaine au développement de cette entreprise ?",
    "Qui vous aidera à promouvoir ou à soutenir votre entreprise ?",
    "Avez-vous actuellement une profession ou des compétences spécialisées ? Veuillez les décrire.",
    "Êtes-vous actuellement salarié ou travailleur indépendant ?",
    "Quel est approximativement votre revenu annuel ?",
    "Quelle expérience ou quelles compétences possédez-vous qui vous aideront à réussir dans cette entreprise ?",
    "Êtes-vous prêt à faire face à la possibilité d’un échec, de changements ou d’une réorientation de l’entreprise ?",
    "Quelles sont vos trois prochaines étapes avant le lancement ?"
  ],
  es: [
    "Describa su idea de negocio y explique por qué desea iniciar este negocio.",
    "¿En qué idioma se siente más cómodo durante su entrevista y sus sesiones de coaching? (inglés, criollo haitiano, francés, español, tagalo u otro idioma)",
    "¿Qué espera del equipo de EPEW y del coach que se le ha asignado?",
    "¿Dónde se ve usted y su negocio dentro de cinco años?",
    "¿Qué problema resuelve su negocio?",
    "¿Quiénes son sus clientes objetivo?",
    "¿En qué sector va a ingresar? (comercio minorista, tecnología, alimentos, consultoría, servicios, organización sin fines de lucro, educación, etc.)",
    "¿Está comenzando completamente desde cero, comprando un negocio existente o expandiendo un negocio existente?",
    "¿Qué producto o servicio ofrecerá?",
    "¿Cuánto financiamiento necesita y por qué?",
    "¿Cómo utilizará el financiamiento recibido?",
    "¿Cómo generará ingresos su negocio?",
    "¿Cuánto tiempo puede dedicar cada semana al desarrollo de este negocio?",
    "¿Quién le ayudará a promocionar o apoyar su negocio?",
    "¿Actualmente tiene una profesión o habilidades especializadas? Descríbalas.",
    "¿Actualmente trabaja como empleado o por cuenta propia?",
    "Aproximadamente, ¿cuántos ingresos obtiene al año?",
    "¿Qué experiencia o habilidades tiene que le ayudarán a tener éxito en este negocio?",
    "¿Está preparado para la posibilidad de fracaso, cambios o ajustes en la dirección del negocio?",
    "¿Cuáles son sus próximos tres pasos antes del lanzamiento?"
  ]
};

const copy = {
  en: { title:"Entrepreneur Questionnaire", intro:"Answer these questions to help your coach understand your business, evaluate your readiness, and prepare your funding journey.", answered:"Questions Answered", readiness:"Readiness Score", completed:"Completed", progress:"In Progress", status:"Questionnaire Status", interview:"Interview Questions", placeholder:"Write your answer here...", saving:"Saving...", save:"Save Questionnaire", back:"Return to Entrepreneur Dashboard", evaluation:"Coach Evaluation", evaluationBody:"Your coach will review your answers, add evaluation notes, and help determine whether you are ready for the funding preparation stage.", notes:"Coach Notes:", noNotes:"No coach evaluation added yet.", loading:"Loading questionnaire...", thank:"Thank You for Submitting Your Questionnaire", submitted:"Your Entrepreneur Questionnaire has been successfully submitted.", next:"Your Next Step", nextBody:"You are set to have a Personal Coach assigned to you within approximately 3 to 15 days.", nextDetail:"Your Personal Coach will review your application and questionnaire, contact you, and guide you through the next stage of your EPEW Entrepreneur Development journey." },
  ht: { title:"Kesyonè Antreprenè", intro:"Reponn kesyon sa yo pou ede antrenè ou konprann biznis ou, evalye preparasyon ou, epi prepare pakou finansman ou.", answered:"Kesyon Reponn", readiness:"Nòt Preparasyon", completed:"Konplete", progress:"An Pwogrè", status:"Estati Kesyonè", interview:"Kesyon Entèvyou", placeholder:"Ekri repons ou isit la...", saving:"Ap sove...", save:"Sove Kesyonè a", back:"Retounen nan Tablo Bò Antreprenè a", evaluation:"Evalyasyon Antrenè", evaluationBody:"Antrenè ou pral revize repons ou yo, ajoute nòt evalyasyon, epi ede detèmine si ou pare pou etap preparasyon finansman an.", notes:"Nòt Antrenè:", noNotes:"Pa gen okenn evalyasyon antrenè ki ajoute pou kounye a.", loading:"Kesyonè a ap chaje...", thank:"Mèsi paske ou Soumèt Kesyonè ou", submitted:"Kesyonè Antreprenè ou a soumèt avèk siksè.", next:"Pwochen Etap Ou", nextBody:"Yo pral asiyen yon Antrenè Pèsonèl pou ou nan anviwon 3 a 15 jou.", nextDetail:"Antrenè Pèsonèl ou pral revize aplikasyon ak kesyonè ou, kontakte ou, epi gide ou nan pwochen etap pakou Devlopman Antreprenè EPEW la." },
  fr: { title:"Questionnaire Entrepreneur", intro:"Répondez à ces questions afin d’aider votre coach à comprendre votre entreprise, à évaluer votre niveau de préparation et à préparer votre parcours de financement.", answered:"Questions Répondues", readiness:"Score de Préparation", completed:"Terminé", progress:"En Cours", status:"Statut du Questionnaire", interview:"Questions d’Entretien", placeholder:"Écrivez votre réponse ici...", saving:"Enregistrement...", save:"Enregistrer le Questionnaire", back:"Retourner au Tableau de Bord Entrepreneur", evaluation:"Évaluation du Coach", evaluationBody:"Votre coach examinera vos réponses, ajoutera des notes d’évaluation et aidera à déterminer si vous êtes prêt pour l’étape de préparation au financement.", notes:"Notes du Coach :", noNotes:"Aucune évaluation du coach n’a encore été ajoutée.", loading:"Chargement du questionnaire...", thank:"Merci d’avoir Soumis Votre Questionnaire", submitted:"Votre Questionnaire Entrepreneur a été soumis avec succès.", next:"Votre Prochaine Étape", nextBody:"Un Coach Personnel vous sera attribué dans un délai d’environ 3 à 15 jours.", nextDetail:"Votre Coach Personnel examinera votre demande et votre questionnaire, vous contactera et vous guidera dans la prochaine étape de votre parcours de Développement Entrepreneurial EPEW." },
  es: { title:"Cuestionario del Emprendedor", intro:"Responda estas preguntas para ayudar a su coach a comprender su negocio, evaluar su nivel de preparación y preparar su recorrido de financiamiento.", answered:"Preguntas Respondidas", readiness:"Puntuación de Preparación", completed:"Completado", progress:"En Progreso", status:"Estado del Cuestionario", interview:"Preguntas de la Entrevista", placeholder:"Escriba su respuesta aquí...", saving:"Guardando...", save:"Guardar Cuestionario", back:"Volver al Panel del Emprendedor", evaluation:"Evaluación del Coach", evaluationBody:"Su coach revisará sus respuestas, añadirá notas de evaluación y ayudará a determinar si está preparado para la etapa de preparación del financiamiento.", notes:"Notas del Coach:", noNotes:"Aún no se ha agregado ninguna evaluación del coach.", loading:"Cargando cuestionario...", thank:"Gracias por Enviar su Cuestionario", submitted:"Su Cuestionario del Emprendedor se envió correctamente.", next:"Su Próximo Paso", nextBody:"Se le asignará un Coach Personal dentro de aproximadamente 3 a 15 días.", nextDetail:"Su Coach Personal revisará su solicitud y cuestionario, se comunicará con usted y le guiará durante la siguiente etapa de su recorrido de Desarrollo de Emprendedores EPEW." }
};

export default function EntrepreneurQuestionnairePage() {
  const router = useRouter();
  const { language } = useEpewLanguage();
  const t = copy[language];
  const visibleQuestions = questions[language];
  const [loading,setLoading]=useState(true), [application,setApplication]=useState<any>(null), [answers,setAnswers]=useState<string[]>(Array(20).fill("")), [saving,setSaving]=useState(false), [message,setMessage]=useState(""), [submitted,setSubmitted]=useState(false);

  useEffect(()=>{ void loadQuestionnaire(); },[]);
  async function loadQuestionnaire(){ const {data:{user}}=await supabase.auth.getUser(); if(!user){router.push("/entrepreneurs/login");return;} const {data,error}=await supabase.from("entrepreneur_applications").select("*").eq("user_id",user.id).maybeSingle(); if(error){console.log(error);setLoading(false);return;} setApplication(data); if(data?.questionnaire_answers)setAnswers(data.questionnaire_answers); setLoading(false); }
  async function saveQuestionnaire(){ setSaving(true);setMessage(""); const completed=answers.filter(a=>a.trim()!==""); const score=Math.round((completed.length/20)*100); try{ const response=await fetch("/api/entrepreneurs/questionnaire",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId:application.id,answers,readinessScore:score})}); const result=await response.json(); if(!response.ok||!result.success)setMessage(result.message||"Unable to save questionnaire."); else{setMessage(score===100?t.completed:t.save);setApplication((current:any)=>current?{...current,questionnaire_answers:answers,readiness_score:score,questionnaire_status:result.questionnaireStatus}:current);} }catch(error){console.log(error);setMessage("Unable to save questionnaire.");} setSaving(false); }

  const completedAnswers=answers.filter(a=>a.trim()!==""); const readinessScore=Math.round((completedAnswers.length/20)*100);
  if(loading)return <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center"><p className="text-3xl font-bold text-[#06245c]">{t.loading}</p></main>;
  if(submitted)return <main className="min-h-screen bg-[#f5f7fb] px-6 py-16 text-[#06245c]"><div className="mx-auto max-w-5xl"><div className="mb-6 flex justify-end"><LanguageSelector className="w-56"/></div><div className="rounded-3xl bg-white p-10 text-center shadow-2xl md:p-16"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl font-extrabold text-green-700">✓</div><p className="mt-8 text-lg font-extrabold uppercase tracking-[0.18em] text-green-600">EPEW Entrepreneur Portal</p><h1 className="mt-5 text-4xl font-extrabold md:text-6xl">{t.thank}</h1><p className="mx-auto mt-8 max-w-3xl text-2xl leading-relaxed text-gray-700">{t.submitted}</p><div className="mx-auto mt-10 max-w-3xl rounded-3xl bg-green-50 p-8"><h2 className="text-3xl font-extrabold text-green-800">{t.next}</h2><p className="mt-5 text-2xl leading-relaxed text-gray-800">{t.nextBody}</p><p className="mt-5 text-xl leading-relaxed text-gray-700">{t.nextDetail}</p></div><button type="button" onClick={()=>router.push("/entrepreneurs/dashboard")} className="mt-10 rounded-2xl bg-[#06245c] px-10 py-5 text-xl font-extrabold text-white hover:bg-green-700">{t.back}</button></div></div></main>;

  return <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]"><div className="max-w-7xl mx-auto space-y-10"><div className="flex justify-end"><LanguageSelector className="w-56"/></div><div className="bg-white rounded-3xl shadow-2xl p-10"><h1 className="text-6xl font-extrabold mb-5">{t.title}</h1><p className="text-2xl text-gray-700">{t.intro}</p></div><div className="grid md:grid-cols-3 gap-8"><Stat value={`${completedAnswers.length}/20`} label={t.answered}/><Stat value={`${readinessScore}%`} label={t.readiness}/><Stat value={readinessScore===100?t.completed:t.progress} label={t.status}/></div><div className="bg-white rounded-3xl shadow-2xl p-10"><h2 className="text-4xl font-bold mb-8">{t.interview}</h2><div className="space-y-8">{visibleQuestions.map((question,index)=><div key={index}><label className="block text-2xl font-bold mb-3">{index+1}. {question}</label><textarea value={answers[index]||""} onChange={e=>{const updated=[...answers];updated[index]=e.target.value;setAnswers(updated);}} className="w-full min-h-[130px] rounded-2xl border border-gray-300 p-5 text-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-green-200" placeholder={t.placeholder}/></div>)}</div><button onClick={saveQuestionnaire} disabled={saving||!application} className="mt-10 bg-green-700 hover:bg-green-800 text-white text-2xl font-bold px-10 py-4 rounded-2xl disabled:opacity-50">{saving?t.saving:t.save}</button>{message&&<p className="mt-6 text-2xl font-bold text-green-700">{message}</p>}<button type="button" onClick={()=>router.push("/entrepreneurs/dashboard")} className="mt-8 ml-4 rounded-2xl bg-[#06245c] px-10 py-4 text-2xl font-bold text-white hover:bg-green-700">{t.back}</button></div><div className="bg-[#06245c] text-white rounded-3xl shadow-2xl p-10"><h2 className="text-4xl font-bold mb-6">{t.evaluation}</h2><p className="text-2xl text-gray-200">{t.evaluationBody}</p><div className="bg-white text-[#06245c] rounded-2xl p-6 mt-8"><p className="text-2xl"><strong>{t.notes}</strong> {application?.coach_notes||t.noNotes}</p></div></div></div></main>;
}

function Stat({value,label}:{value:string;label:string}){return <div className="bg-white rounded-3xl shadow-xl p-8 text-center"><p className="text-5xl font-bold text-green-700">{value}</p><p className="text-xl font-bold text-gray-700 mt-3">{label}</p></div>}
