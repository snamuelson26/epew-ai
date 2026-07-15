"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BUSINESS_ID = 2;

export default function BusinessProfileManagerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [business, setBusiness] = useState<any>({
    business_name: "",
    business_category: "",
    business_description: "",
    city: "",
    state: "",
    business_phone: "",
    business_email: "",
    business_website: "",
    business_hours: "",
    business_photo_url: "",
    entrepreneur_photo_url: "",
    business_photo_1: "",
    business_photo_2: "",
    business_photo_3: "",
    business_photo_4: "",
  });

  useEffect(() => {
    loadBusiness();
  }, []);

  async function loadBusiness() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .eq("id", BUSINESS_ID)
      .single();

    if (error) {
      console.log(error);
      alert("Unable to load business profile.");
      setLoading(false);
      return;
    }

    setBusiness(data);
    setLoading(false);
  }

  function updateField(field: string, value: string) {
    setBusiness((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveProfile() {
    setSaving(true);

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        business_name: business.business_name,
        business_category: business.business_category,
        business_description: business.business_description,
        city: business.city,
        state: business.state,
        business_phone: business.business_phone,
        business_email: business.business_email,
        business_website: business.business_website,
        business_hours: business.business_hours,
        business_photo_url: business.business_photo_url,
        entrepreneur_photo_url: business.entrepreneur_photo_url,
        business_photo_1: business.business_photo_1,
        business_photo_2: business.business_photo_2,
        business_photo_3: business.business_photo_3,
        business_photo_4: business.business_photo_4,
      })
      .eq("id", BUSINESS_ID);

    setSaving(false);

    if (error) {
      console.log(error);
      alert("Unable to save profile.");
      return;
    }

    alert("Business profile saved successfully.");
  }

  async function uploadImage(
    file: File,
    bucket: string,
    field: string
  ) {
    const fileName = `${BUSINESS_ID}-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.log(error);
      alert("Upload failed.");
      return;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    updateField(field, data.publicUrl);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <p className="text-2xl font-bold">Loading Business Profile Manager...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">
          Business Profile Manager
        </h1>

        <p className="text-xl text-gray-700">
          Update your public EPEW business profile.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h2 className="text-3xl font-bold mb-6">Business Information</h2>

        <div className="grid md:grid-cols-2 gap-5">
          <input className="border rounded-xl p-4" placeholder="Business Name" value={business.business_name || ""} onChange={(e) => updateField("business_name", e.target.value)} />
          <input className="border rounded-xl p-4" placeholder="Category" value={business.business_category || ""} onChange={(e) => updateField("business_category", e.target.value)} />
          <input className="border rounded-xl p-4" placeholder="City" value={business.city || ""} onChange={(e) => updateField("city", e.target.value)} />
          <input className="border rounded-xl p-4" placeholder="State" value={business.state || ""} onChange={(e) => updateField("state", e.target.value)} />
          <input className="border rounded-xl p-4" placeholder="Phone" value={business.business_phone || ""} onChange={(e) => updateField("business_phone", e.target.value)} />
          <input className="border rounded-xl p-4" placeholder="Email" value={business.business_email || ""} onChange={(e) => updateField("business_email", e.target.value)} />
          <input className="border rounded-xl p-4" placeholder="Website" value={business.business_website || ""} onChange={(e) => updateField("business_website", e.target.value)} />
          <input className="border rounded-xl p-4" placeholder="Business Hours" value={business.business_hours || ""} onChange={(e) => updateField("business_hours", e.target.value)} />
        </div>

        <textarea
          className="border rounded-xl p-4 w-full mt-5 h-40"
          placeholder="Business Description"
          value={business.business_description || ""}
          onChange={(e) => updateField("business_description", e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h2 className="text-3xl font-bold mb-6">Upload Photos</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="font-bold mb-2">Business Photo</p>
            <input type="file" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "business-photos", "business_photo_url")} />
          </div>

          <div>
            <p className="font-bold mb-2">Entrepreneur Photo</p>
            <input type="file" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "entrepreneur-photos", "entrepreneur_photo_url")} />
          </div>

          {[1, 2, 3, 4].map((num) => (
            <div key={num}>
              <p className="font-bold mb-2">Gallery Photo {num}</p>
              <input
                type="file"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  uploadImage(
                    e.target.files[0],
                    "business-gallery",
                    `business_photo_${num}`
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={saveProfile}
          className="bg-green-700 text-white px-8 py-4 rounded-2xl text-xl font-bold"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>

        <a
          href={`/business/${BUSINESS_ID}`}
          target="_blank"
          className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold"
        >
          Preview Public Profile
        </a>
      </div>
    </main>
  );
}