"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminCompliancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("Supporter Disclaimer");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    loadComplianceItems();
  }, []);

  async function loadComplianceItems() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_compliance")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(data || []);
    setLoading(false);
  }

  async function createComplianceItem() {
    if (!title || !description) {
      alert("Please enter title and description.");
      return;
    }

    const { error } = await supabase.from("admin_compliance").insert([
      {
        category,
        title,
        description,
        status,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setCategory("Supporter Disclaimer");
    setTitle("");
    setDescription("");
    setStatus("Active");

    loadComplianceItems();
  }

  async function updateStatus(id: number, newStatus: string) {
    const { error } = await supabase
      .from("admin_compliance")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadComplianceItems();
  }

  function statusColor(itemStatus: string) {
    if (itemStatus === "Active") return "bg-green-100 text-green-800";
    if (itemStatus === "Review Needed") return "bg-yellow-100 text-yellow-800";
    if (itemStatus === "Archived") return "bg-gray-200 text-gray-800";
    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Compliance Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Compliance Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage EPEW compliance rules, supporter disclaimers, entrepreneur
        obligations, funding readiness, reporting compliance, and platform risk
        notices.
      </p>

      <div className="bg-red-50 border-l-8 border-red-600 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          Core EPEW Compliance Language
        </h2>

        <p className="mt-2 text-gray-700">
          EPEW is not an investment platform. Contributions are structured as
          community participation. Benefits are not guaranteed and depend on
          business performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Supporter Rule
          </h2>
          <p className="text-xl font-extrabold text-[#06245c] mt-4">
            Contribution, Not Investment
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Benefit Rule
          </h2>
          <p className="text-xl font-extrabold text-green-700 mt-4">
            Not Guaranteed
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Entrepreneur Rule
          </h2>
          <p className="text-xl font-extrabold text-blue-700 mt-4">
            Quarterly Reports Required
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Funding Rule
          </h2>
          <p className="text-xl font-extrabold text-purple-700 mt-4">
            Readiness Review Required
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Add Compliance Item
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <select
            className="border rounded-xl p-4"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Supporter Disclaimer</option>
            <option>Entrepreneur Obligation</option>
            <option>Funding Readiness</option>
            <option>Quarterly Reporting</option>
            <option>Platform Risk Notice</option>
            <option>Coach Review</option>
            <option>Partner Compliance</option>
          </select>

          <select
            className="border rounded-xl p-4"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Active</option>
            <option>Review Needed</option>
            <option>Archived</option>
          </select>

          <input
            className="border rounded-xl p-4"
            placeholder="Compliance Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <textarea
          className="border rounded-xl p-4 w-full min-h-[180px] mb-6"
          placeholder="Compliance description or rule..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={createComplianceItem}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Compliance Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No compliance items added yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-4 font-bold">
                    {item.category || "-"}
                  </td>

                  <td className="p-4">{item.title || "-"}</td>

                  <td className="p-4 max-w-[500px]">
                    {item.description || "-"}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                        item.status
                      )}`}
                    >
                      {item.status || "Active"}
                    </span>
                  </td>

                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(item.id, "Active")}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Active
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "Review Needed")}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
                    >
                      Review
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "Archived")}
                      className="bg-gray-700 text-white px-4 py-2 rounded-xl"
                    >
                      Archive
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