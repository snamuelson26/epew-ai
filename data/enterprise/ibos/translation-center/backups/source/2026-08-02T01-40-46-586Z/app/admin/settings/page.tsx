"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [settingName, setSettingName] = useState("");
  const [settingValue, setSettingValue] = useState("");
  const [category, setCategory] = useState("Funding Rules");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setSettings([]);
      setLoading(false);
      return;
    }

    setSettings(data || []);
    setLoading(false);
  }

  async function createSetting() {
    if (!settingName || !settingValue) {
      alert("Please enter setting name and value.");
      return;
    }

    const { error } = await supabase.from("admin_settings").insert([
      {
        setting_name: settingName,
        setting_value: settingValue,
        category,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setSettingName("");
    setSettingValue("");
    setCategory("Funding Rules");

    loadSettings();
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Settings Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Settings Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage EPEW platform rules, funding structure, business categories,
        languages, status steps, and system configuration.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Funding Rule
          </h2>

          <p className="text-3xl font-extrabold text-[#06245c] mt-4">
            20 Units
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Weekly Unit
          </h2>

          <p className="text-3xl font-extrabold text-green-700 mt-4">
            $100
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Funding Cycle
          </h2>

          <p className="text-3xl font-extrabold text-red-700 mt-4">
            52 Weeks
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Weekly Funding
          </h2>

          <p className="text-3xl font-extrabold text-blue-700 mt-4">
            $100,000
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Platform Fee
          </h2>

          <p className="text-3xl font-extrabold text-purple-700 mt-4">
            $4,000
          </p>
        </div>

      </div>

      <div className="bg-green-50 border-l-8 border-green-600 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          Public Funding Message
        </h2>

        <p className="mt-2 text-gray-700">
          Each entrepreneur is supported by 20 contribution units.
          Each unit contributes $100 per week over a 52-week funding cycle.
          Fifty participants supporting 20 units each generate approximately
          $100,000 in business funding for one participant every week,
          creating a continuous cycle of entrepreneurship, community
          participation, and wealth creation.
        </p>
      </div>

      <div className="bg-yellow-50 border-l-8 border-yellow-500 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          Internal Admin Rule
        </h2>

        <p className="mt-2 text-gray-700">
          Weeks 1 and 2 are reserved for EPEW platform preparation and are not
          displayed to entrepreneurs.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Add Platform Setting
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

          <input
            className="border rounded-xl p-4"
            placeholder="Setting Name"
            value={settingName}
            onChange={(e) => setSettingName(e.target.value)}
          />

          <input
            className="border rounded-xl p-4"
            placeholder="Setting Value"
            value={settingValue}
            onChange={(e) => setSettingValue(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Funding Rules</option>
            <option>Status Steps</option>
            <option>Business Categories</option>
            <option>Languages</option>
            <option>Platform Configuration</option>
            <option>Compliance Rules</option>
          </select>

        </div>

        <button
          onClick={createSetting}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Setting
        </button>
      </div>

      {settings.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No custom settings added yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">

          <table className="w-full">

            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Setting Name</th>
                <th className="text-left p-4">Setting Value</th>
                <th className="text-left p-4">Created</th>
              </tr>
            </thead>

            <tbody>

              {settings.map((setting) => (

                <tr key={setting.id} className="border-b">

                  <td className="p-4 font-bold">
                    {setting.category || "-"}
                  </td>

                  <td className="p-4">
                    {setting.setting_name || "-"}
                  </td>

                  <td className="p-4">
                    {setting.setting_value || "-"}
                  </td>

                  <td className="p-4">
                    {setting.created_at
                      ? new Date(setting.created_at).toLocaleDateString()
                      : "-"}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}
    </main>
  );
}