"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminMarketplacePage() {
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketplace();
  }, []);

  async function loadMarketplace() {
    setLoading(true);

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setEntrepreneurs([]);
      setLoading(false);
      return;
    }

    setEntrepreneurs(data || []);
    setLoading(false);
  }

  async function updateMarketplaceField(id: number, field: string, value: string) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadMarketplace();
  }

  function statusColor(status: string) {
    if (status === "Approved" || status === "Visible")
      return "bg-green-100 text-green-800";
    if (status === "Pending") return "bg-yellow-100 text-yellow-800";
    if (status === "Rejected" || status === "Hidden")
      return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Marketplace Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Marketplace Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage entrepreneur marketplace visibility, presentation approval, video
        approval, featured businesses, and hidden businesses.
      </p>

      {entrepreneurs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No entrepreneurs available for marketplace review yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Business</th>
                <th className="text-left p-4">Entrepreneur</th>
                <th className="text-left p-4">Presentation</th>
                <th className="text-left p-4">Video</th>
                <th className="text-left p-4">Visibility</th>
                <th className="text-left p-4">Featured</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {entrepreneurs.map((app) => (
                <tr key={app.id} className="border-b">
                  <td className="p-4 font-bold">
                    {app.business_name || "Unnamed Business"}
                  </td>

                  <td className="p-4">{app.full_name || "-"}</td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                        app.presentation_status
                      )}`}
                    >
                      {app.presentation_status || "Pending"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                        app.video_status
                      )}`}
                    >
                      {app.video_status || "Pending"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                        app.marketplace_visibility
                      )}`}
                    >
                      {app.marketplace_visibility || "Hidden"}
                    </span>
                  </td>

                  <td className="p-4">
                    {app.featured_business === "Yes" ? "Yes" : "No"}
                  </td>

                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        updateMarketplaceField(
                          app.id,
                          "presentation_status",
                          "Approved"
                        )
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Approve Presentation
                    </button>

                    <button
                      onClick={() =>
                        updateMarketplaceField(app.id, "video_status", "Approved")
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                    >
                      Approve Video
                    </button>

                    <button
                      onClick={() =>
                        updateMarketplaceField(
                          app.id,
                          "marketplace_visibility",
                          "Visible"
                        )
                      }
                      className="bg-purple-600 text-white px-4 py-2 rounded-xl"
                    >
                      Show
                    </button>

                    <button
                      onClick={() =>
                        updateMarketplaceField(
                          app.id,
                          "marketplace_visibility",
                          "Hidden"
                        )
                      }
                      className="bg-gray-700 text-white px-4 py-2 rounded-xl"
                    >
                      Hide
                    </button>

                    <button
                      onClick={() =>
                        updateMarketplaceField(app.id, "featured_business", "Yes")
                      }
                      className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
                    >
                      Feature
                    </button>
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