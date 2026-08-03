"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const categories = [
  "Business Registration",
  "Business License",
  "Rent",
  "Equipment",
  "Inventory",
  "Marketing",
  "Working Capital",
  "Other",
];

export default function AdminFundingAllocationPage() {
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: entrepreneurData, error: entrepreneurError } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (entrepreneurError) {
      console.log(entrepreneurError);
      alert("Unable to load entrepreneurs.");
      setLoading(false);
      return;
    }

    const { data: allocationData, error: allocationError } = await supabase
      .from("funding_allocations")
      .select("*")
      .order("created_at", { ascending: true });

    if (allocationError) {
      console.log(allocationError);
      alert("Unable to load funding allocations.");
      setLoading(false);
      return;
    }

    setEntrepreneurs(entrepreneurData || []);
    setAllocations(allocationData || []);
    setLoading(false);
  }

  function getAllocationsForEntrepreneur(id: number) {
    return allocations.filter((item) => Number(item.entrepreneur_id) === Number(id));
  }

  async function createDefaultAllocations(entrepreneurId: number) {
    setSavingId(String(entrepreneurId));

    const existing = getAllocationsForEntrepreneur(entrepreneurId);

    if (existing.length > 0) {
      setSavingId(null);
      alert("Funding allocation records already exist for this entrepreneur.");
      return;
    }

    const rows = categories.map((category) => ({
      entrepreneur_id: entrepreneurId,
      category,
      requested_amount: 0,
      approved_amount: 0,
      released_amount: 0,
      status: "Pending",
    }));

    const { error } = await supabase.from("funding_allocations").insert(rows);

    setSavingId(null);

    if (error) {
      console.log(error);
      alert("Unable to create funding allocation records.");
      return;
    }

    loadData();
  }

  async function updateAllocation(id: string, updates: any) {
    setSavingId(id);

    const { error } = await supabase
      .from("funding_allocations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      console.log(error);
      alert("Unable to update funding allocation.");
      return;
    }

    loadData();
  }

  function money(value: any) {
    return `$${Number(value || 0).toLocaleString()}`;
  }

  function total(list: any[], field: string) {
    return list.reduce((sum, item) => sum + Number(item[field] || 0), 0);
  }

  const allApproved = total(allocations, "approved_amount");
  const allReleased = total(allocations, "released_amount");
  const pendingCount = allocations.filter((a) => a.status !== "Completed").length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Loading Funding Allocation Center...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-2xl p-12 mb-10">
        <h1 className="text-6xl font-extrabold mb-5">
          Funding Allocation Center
        </h1>

        <p className="text-2xl text-gray-700 leading-relaxed">
          Track entrepreneur category progress, coach verification, admin approval,
          working capital requests, notes, and fund release decisions.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-6 mb-10">
        <Card title="Entrepreneurs" value={entrepreneurs.length} />
        <Card title="Total Approved" value={money(allApproved)} />
        <Card title="Total Released" value={money(allReleased)} />
        <Card title="Remaining" value={money(allApproved - allReleased)} />
        <Card title="Pending Categories" value={pendingCount} />
      </div>

      <div className="grid gap-10">
        {entrepreneurs.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <p className="text-2xl font-bold">No entrepreneurs found.</p>
          </div>
        ) : (
          entrepreneurs.map((entrepreneur) => {
            const list = getAllocationsForEntrepreneur(entrepreneur.id);
            const approved = total(list, "approved_amount");
            const released = total(list, "released_amount");
            const remaining = approved - released;

            return (
              <div key={entrepreneur.id} className="bg-white rounded-3xl shadow-2xl p-10">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-8">
                  <div>
                    <h2 className="text-4xl font-extrabold mb-3">
                      {entrepreneur.full_name || "Unnamed Entrepreneur"}
                    </h2>

                    <p className="text-2xl text-gray-700">
                      {entrepreneur.business_name || "Business name pending"}
                    </p>

                    <p className="text-xl text-gray-600 mt-2">
                      Entrepreneur ID: {entrepreneur.entrepreneur_id || "Pending"}
                    </p>

                    <p className="text-xl text-green-700 font-bold mt-2">
                      Status: {entrepreneur.status || "Pending"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={savingId === String(entrepreneur.id)}
                    onClick={() => createDefaultAllocations(entrepreneur.id)}
                    className="bg-[#06245c] text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
                  >
                    Create Funding Categories
                  </button>
                </div>

                <div className="grid md:grid-cols-4 gap-5 mb-8">
                  <MiniCard title="Approved" value={money(approved)} />
                  <MiniCard title="Released" value={money(released)} />
                  <MiniCard title="Remaining" value={money(remaining)} />
                  <MiniCard
                    title="Progress"
                    value={approved > 0 ? `${Math.round((released / approved) * 100)}%` : "0%"}
                  />
                </div>

                {list.length === 0 ? (
                  <div className="bg-yellow-50 border-l-8 border-yellow-500 rounded-2xl p-6">
                    <p className="text-xl font-bold">
                      Funding categories have not been created yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full min-w-[1200px] border-collapse">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-4">Category</th>
                          <th className="p-4">Requested</th>
                          <th className="p-4">Approved</th>
                          <th className="p-4">Released</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Notes</th>
                          <th className="p-4">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {list.map((item) => (
                          <tr key={item.id} className="border-b align-top">
                            <td className="p-4 font-bold">{item.category}</td>

                            <td className="p-4">
                              <input
                                type="number"
                                defaultValue={item.requested_amount || 0}
                                onBlur={(e) =>
                                  updateAllocation(item.id, {
                                    requested_amount: Number(e.target.value || 0),
                                  })
                                }
                                className="border rounded-xl p-3 w-32"
                              />
                            </td>

                            <td className="p-4">
                              <input
                                type="number"
                                defaultValue={item.approved_amount || 0}
                                onBlur={(e) =>
                                  updateAllocation(item.id, {
                                    approved_amount: Number(e.target.value || 0),
                                  })
                                }
                                className="border rounded-xl p-3 w-32"
                              />
                            </td>

                            <td className="p-4">
                              <input
                                type="number"
                                defaultValue={item.released_amount || 0}
                                onBlur={(e) =>
                                  updateAllocation(item.id, {
                                    released_amount: Number(e.target.value || 0),
                                  })
                                }
                                className="border rounded-xl p-3 w-32"
                              />
                            </td>

                            <td className="p-4">
                              <span className="font-bold text-green-700">
                                {item.status || "Pending"}
                              </span>
                            </td>

                            <td className="p-4">
                              <textarea
                                defaultValue={item.notes || ""}
                                onBlur={(e) =>
                                  updateAllocation(item.id, {
                                    notes: e.target.value,
                                  })
                                }
                                className="border rounded-xl p-3 w-64 min-h-[90px]"
                                placeholder="Add notes..."
                              />
                            </td>

                            <td className="p-4">
                              <div className="grid gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAllocation(item.id, {
                                      coach_verified: true,
                                      status: "Coach Verified",
                                    })
                                  }
                                  className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold"
                                >
                                  Coach Verified
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAllocation(item.id, {
                                      admin_approved: true,
                                      status: "Admin Approved",
                                    })
                                  }
                                  className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold"
                                >
                                  Admin Approved
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAllocation(item.id, {
                                      funds_released: true,
                                      status: "Funds Released",
                                    })
                                  }
                                  className="bg-[#06245c] text-white px-4 py-3 rounded-xl font-bold"
                                >
                                  Funds Released
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAllocation(item.id, {
                                      status: "Completed",
                                    })
                                  }
                                  className="border-2 border-green-600 text-green-700 px-4 py-3 rounded-xl font-bold"
                                >
                                  Completed
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <p className="text-lg font-bold text-gray-600 mb-3">{title}</p>
      <p className="text-3xl font-extrabold text-green-700">{value}</p>
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-[#f5f7fb] rounded-2xl p-5 text-center">
      <p className="text-lg font-bold text-gray-600 mb-2">{title}</p>
      <p className="text-2xl font-extrabold text-[#06245c]">{value}</p>
    </div>
  );
}