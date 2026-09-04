"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useEpewLanguage } from "@/app/components/EpewLanguage";

const countries = ["United States","Haiti","Canada","Dominican Republic","France","Mexico","Brazil","Colombia","Jamaica","Bahamas","United Kingdom","Germany","Spain","Philippines","Italy","Nigeria","Ghana","South Africa","Other"];

const copy = {
  en: { loading:"Loading settings...", title:"Settings", intro:"Manage your supporter profile, contact information, and account preferences.", profile:"Profile Information", fullName:"Full Name", phone:"Phone", citizenship:"Country of Citizenship", birthPlace:"Place of Birth", country:"Country", street:"Street Address", city:"City", state:"State / Province", zip:"Zip Code", saving:"Saving...", save:"Save Profile", account:"Account Details", supporterId:"Supporter ID", status:"Status", email:"Email", memberSince:"Member Since", password:"Password", resetBody:"Send a password reset link to your registered email address.", reset:"Send Password Reset Email", notAssigned:"Not Assigned", notAvailable:"Not Available", active:"active" },
  ht: { loading:"Paramèt yo ap chaje...", title:"Paramèt", intro:"Jere pwofil sipòtè ou, enfòmasyon kontak ou, ak preferans kont ou.", profile:"Enfòmasyon Pwofil", fullName:"Non Konplè", phone:"Telefòn", citizenship:"Peyi Sitwayènte", birthPlace:"Kote ou Fèt", country:"Peyi", street:"Adrès", city:"Vil", state:"Eta / Pwovens", zip:"Kòd Postal", saving:"Ap sove...", save:"Sove Pwofil", account:"Detay Kont", supporterId:"ID Sipòtè", status:"Estati", email:"Imèl", memberSince:"Manm Depi", password:"Modpas", resetBody:"Voye yon lyen pou reyajiste modpas la nan adrès imèl ki anrejistre sou kont ou.", reset:"Voye Imèl pou Reyajiste Modpas", notAssigned:"Poko Asiyen", notAvailable:"Pa Disponib", active:"aktif" },
  fr: { loading:"Chargement des paramètres...", title:"Paramètres", intro:"Gérez votre profil de soutien, vos coordonnées et les préférences de votre compte.", profile:"Informations du Profil", fullName:"Nom Complet", phone:"Téléphone", citizenship:"Pays de Citoyenneté", birthPlace:"Lieu de Naissance", country:"Pays", street:"Adresse", city:"Ville", state:"État / Province", zip:"Code Postal", saving:"Enregistrement...", save:"Enregistrer le Profil", account:"Détails du Compte", supporterId:"Identifiant du Soutien", status:"Statut", email:"E-mail", memberSince:"Membre Depuis", password:"Mot de Passe", resetBody:"Envoyez un lien de réinitialisation du mot de passe à votre adresse e-mail enregistrée.", reset:"Envoyer l’E-mail de Réinitialisation du Mot de Passe", notAssigned:"Non Attribué", notAvailable:"Non Disponible", active:"actif" },
  es: { loading:"Cargando configuración...", title:"Configuración", intro:"Administre su perfil de colaborador, su información de contacto y las preferencias de su cuenta.", profile:"Información del Perfil", fullName:"Nombre Completo", phone:"Teléfono", citizenship:"País de Ciudadanía", birthPlace:"Lugar de Nacimiento", country:"País", street:"Dirección", city:"Ciudad", state:"Estado / Provincia", zip:"Código Postal", saving:"Guardando...", save:"Guardar Perfil", account:"Detalles de la Cuenta", supporterId:"ID del Colaborador", status:"Estado", email:"Correo Electrónico", memberSince:"Miembro Desde", password:"Contraseña", resetBody:"Envíe un enlace para restablecer la contraseña a su correo electrónico registrado.", reset:"Enviar Correo para Restablecer la Contraseña", notAssigned:"No Asignado", notAvailable:"No Disponible", active:"activo" }
};

export default function SupporterSettingsPage() {
  const { language } = useEpewLanguage(); const t = copy[language];
  const [loading,setLoading]=useState(true), [saving,setSaving]=useState(false), [supporter,setSupporter]=useState<any>(null);
  const [fullName,setFullName]=useState(""), [phone,setPhone]=useState(""), [countryOfCitizenship,setCountryOfCitizenship]=useState(""), [dateOfBirth,setDateOfBirth]=useState(""), [placeOfBirth,setPlaceOfBirth]=useState(""), [country,setCountry]=useState(""), [streetAddress,setStreetAddress]=useState(""), [city,setCity]=useState(""), [stateName,setStateName]=useState(""), [zipCode,setZipCode]=useState("");

  useEffect(()=>{ void loadSettings(); },[]);
  async function loadSettings(){ const {data:{user}}=await supabase.auth.getUser(); if(!user){window.location.href="/supporters/login";return;} const {data}=await supabase.from("supporters").select("*").eq("user_id",user.id).single(); if(!data){window.location.href="/supporters/login";return;} setSupporter(data); setFullName(data.full_name||""); setPhone(data.phone||""); setCountryOfCitizenship(data.country_of_citizenship||""); setDateOfBirth(data.date_of_birth||""); setPlaceOfBirth(data.place_of_birth||""); setCountry(data.country||""); setStreetAddress(data.street_address||""); setCity(data.city||""); setStateName(data.state||""); setZipCode(data.zip_code||""); setLoading(false); }
  async function saveProfile(){ if(!supporter)return; setSaving(true); const {error}=await supabase.from("supporters").update({full_name:fullName,phone,country_of_citizenship:countryOfCitizenship,date_of_birth:dateOfBirth,place_of_birth:placeOfBirth,country,address_country:country,street_address:streetAddress,city,state:stateName,zip_code:zipCode}).eq("id",supporter.id); setSaving(false); if(error){alert(error.message);return;} window.location.reload(); }
  async function handlePasswordReset(){ if(!supporter?.email)return; const {error}=await supabase.auth.resetPasswordForEmail(supporter.email,{redirectTo:`${window.location.origin}/supporters/update-password`}); if(error){alert(error.message);return;} alert(t.reset); }
  if(loading)return <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]"><p className="text-2xl font-bold">{t.loading}</p></main>;

  return <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
    <div className="bg-white rounded-3xl shadow-xl p-10 mb-8"><h1 className="text-5xl font-extrabold mb-3">{t.title}</h1><p className="text-xl text-gray-700">{t.intro}</p></div>
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8">
      <div className="bg-white rounded-3xl shadow-xl p-10"><h2 className="text-3xl font-bold mb-6">{t.profile}</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder={t.fullName} className="border rounded-2xl p-4 text-lg"/><input value={supporter?.email||""} disabled className="border rounded-2xl p-4 text-lg bg-gray-100"/>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder={t.phone} className="border rounded-2xl p-4 text-lg"/>
          <select value={countryOfCitizenship} onChange={e=>setCountryOfCitizenship(e.target.value)} className="border rounded-2xl p-4 text-lg"><option value="">{t.citizenship}</option>{countries.map(item=><option key={item}>{item}</option>)}</select>
          <input type="date" value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)} className="border rounded-2xl p-4 text-lg"/><input value={placeOfBirth} onChange={e=>setPlaceOfBirth(e.target.value)} placeholder={t.birthPlace} className="border rounded-2xl p-4 text-lg"/>
          <select value={country} onChange={e=>setCountry(e.target.value)} className="border rounded-2xl p-4 text-lg"><option value="">{t.country}</option>{countries.map(item=><option key={item}>{item}</option>)}</select>
          <input value={streetAddress} onChange={e=>setStreetAddress(e.target.value)} placeholder={t.street} className="border rounded-2xl p-4 text-lg"/><input value={city} onChange={e=>setCity(e.target.value)} placeholder={t.city} className="border rounded-2xl p-4 text-lg"/><input value={stateName} onChange={e=>setStateName(e.target.value)} placeholder={t.state} className="border rounded-2xl p-4 text-lg"/><input value={zipCode} onChange={e=>setZipCode(e.target.value)} placeholder={t.zip} className="border rounded-2xl p-4 text-lg"/>
        </div><button type="button" onClick={saveProfile} disabled={saving} className="mt-8 bg-green-700 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c] transition">{saving?t.saving:t.save}</button>
      </div>
      <div className="space-y-8">
        <div className="bg-white rounded-3xl shadow-xl p-10"><h2 className="text-3xl font-bold mb-6">{t.account}</h2><div className="space-y-4 text-lg"><p><strong>{t.supporterId}:</strong> {supporter?.supporter_id||t.notAssigned}</p><p><strong>{t.status}:</strong> {supporter?.status||t.active}</p><p><strong>{t.email}:</strong> {supporter?.email}</p><p><strong>{t.memberSince}:</strong> {supporter?.created_at?new Date(supporter.created_at).toLocaleDateString():t.notAvailable}</p></div></div>
        <div className="bg-white rounded-3xl shadow-xl p-10"><h2 className="text-3xl font-bold mb-6">{t.password}</h2><p className="text-lg text-gray-700 mb-6">{t.resetBody}</p><button type="button" onClick={handlePasswordReset} className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold">{t.reset}</button></div>
      </div>
    </div>
  </main>;
}
