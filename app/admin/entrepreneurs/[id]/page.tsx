"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminEntrepreneurFilePage() {
  const params = useParams();
  const id = params.id as string;

  const [entrepreneur, setEntrepreneur] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntrepreneur();
  }, [id]);

  async function loadEntrepreneur() {
    setLoading(true);

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.log(error);
      alert("Unable to load entrepreneur file: " + error.message);
      setLoading(false);
      return;
    }

    setEntrepreneur(data);
    setLoading(false);
  }

  async function updateStatus(status: string) {
  const { error } = await supabase
    .from("entrepreneur_applications")
    .update({
      status,
    })
    .eq("id", id);

  if (error) {
    console.log(error);
    alert("Unable to update status.");
    return;
  }

  // Automatically create funding categories
  if (status === "Funding Readiness Review") {
    await createFundingCategories();
  }

  loadEntrepreneur();
}

async function createFundingCategories() {
  const { data: existing, error: existingError } = await supabase
    .from("funding_allocations")
    .select("id")
    .eq("entrepreneur_id", Number(id));

  if (existingError) {
    console.log(existingError);
    return;
  }

  if (existing && existing.length > 0) {
    return;
  }

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

  const rows = categories.map((category) => ({
    entrepreneur_id: Number(id),
    category,
    requested_amount: 0,
    approved_amount: 0,
    released_amount: 0,
    status: "Pending",
  }));

  const { error } = await supabase
    .from("funding_allocations")
    .insert(rows);

  if (error) {
    console.log(error);
  }
}

  function initials(name: string) {
    if (!name) return "E";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Loading entrepreneur file...
        </p>
      </main>
    );
  }

  if (!entrepreneur) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-red-600">
          Entrepreneur file not found.
        </p>
      </main>
    );
  }

  const currentStatus = entrepreneur.status || "Application Submitted";

  const timeline = [
    "Application Submitted",
    "Coach Assigned",
    "Interview Scheduled",
    "Interview Completed",
    "Questionnaire Completed",
    "Marketplace Ready",
    "Funding Queue",
    "Annual Meeting Qualified",
    "Annual Meeting Attended",
    "Funding Approved",
    "Business Opened",
    "Quarterly Reporting",
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
          <div className="w-32 h-32 rounded-full bg-[#06245c] text-white flex items-center justify-center text-5xl font-extrabold">
            {initials(entrepreneur.full_name)}
          </div>

          <div>
            <h1 className="text-6xl font-extrabold mb-3">
              {entrepreneur.full_name || "Unnamed Entrepreneur"}
            </h1>

            <p className="text-3xl text-gray-700 mb-2">
              {entrepreneur.business_name || "Business name pending"}
            </p>

            <p className="text-xl text-gray-600">
              Entrepreneur ID: {entrepreneur.entrepreneur_id || "Pending"}
            </p>

            <p className="text-xl text-green-700 font-bold mt-2">
              Current Status: {currentStatus}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
        <StatCard
          title="Funding Goal"
          value={
            entrepreneur.funding_goal
              ? `$${Number(entrepreneur.funding_goal).toLocaleString()}`
              : "Pending"
          }
        />
        <StatCard title="Units Required" value={entrepreneur.units_required || "20"} />
        <StatCard title="Units Supported" value={entrepreneur.units_supported || "0"} />
        <StatCard title="Queue Position" value={entrepreneur.queue_position || "Pending"} />
        <StatCard title="Funding Round" value={entrepreneur.funding_round || "Pending"} />
        <StatCard title="Phase" value={currentStatus} />
      </div>

      <div className="grid lg:grid-cols-3 gap-10 mb-10">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">Entrepreneur Profile</h2>

          <div className="grid md:grid-cols-2 gap-6 text-xl text-gray-700">
            <Info label="Full Name" value={entrepreneur.full_name} />
            <Info label="Business Name" value={entrepreneur.business_name} />
            <Info label="Email" value={entrepreneur.email} />
            <Info label="Phone" value={entrepreneur.phone} />
            <Info label="Address" value={entrepreneur.address || entrepreneur.street_address} />
            <Info label="City" value={entrepreneur.city} />
            <Info label="State" value={entrepreneur.state} />
            <Info label="Zip Code" value={entrepreneur.zip_code} />
            <Info label="Business Category" value={entrepreneur.business_category || entrepreneur.category} />
            <Info label="Assigned Coach" value={entrepreneur.coach_name || entrepreneur.assigned_coach_name} />
            <Info label="Interview Date" value={entrepreneur.interview_date} />
            <Info label="Interview Time" value={entrepreneur.interview_time} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-4xl font-bold mb-8">Quick Actions</h2>

          <div className="grid gap-4">
            <Action href={`/admin/entrepreneurs/${id}/schedule-interview`} label="Schedule Interview" />
            <Action href={`/admin/entrepreneurs/${id}/questionnaire`} label="Open Questionnaire" />
            <Action href={`/admin/entrepreneurs/${id}/marketplace-review`} label="Marketplace Review" />
            <Action href="/admin/funding-readiness" label="Funding Readiness" />
            <Action href="/admin/annual-meetings" label="Annual Meeting" />
            <Action href="/admin/funding-allocation" label="Funding Allocation" />
            <Action href="/admin/disbursements" label="Open Disbursement" />
            <Action href="/admin/funded-businesses" label="Quarterly Reports" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
        <h2 className="text-4xl font-bold mb-8">Status Controls</h2>

        <div className="grid md:grid-cols-4 gap-4">
          {timeline.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => updateStatus(step)}
              className={`py-4 rounded-2xl text-lg font-bold transition ${
                currentStatus === step
                  ? "bg-green-600 text-white"
                  : "border-2 border-[#06245c] text-[#06245c] hover:bg-[#06245c] hover:text-white"
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10">
        <h2 className="text-4xl font-bold mb-8">Entrepreneur Timeline</h2>

        <div className="grid md:grid-cols-2 gap-5">
          {timeline.map((step) => {
            const active = currentStatus === step;
            return (
              <div
                key={step}
                className={`rounded-2xl p-5 border-l-8 ${
                  active
                    ? "bg-green-50 border-green-600"
                    : "bg-[#f5f7fb] border-gray-300"
                }`}
              >
                <p className="text-2xl font-bold">
                  {active ? "✅ " : "○ "}
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <p className="text-lg font-bold text-gray-600 mb-3">{title}</p>
      <p className="text-3xl font-extrabold text-green-700">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-[#f5f7fb] rounded-2xl p-5">
      <p className="font-bold text-[#06245c] mb-2">{label}</p>
      <p>{value || "Not provided"}</p>
    </div>
  );
}

function Action({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="bg-[#06245c] text-white text-center py-4 rounded-2xl text-xl font-bold hover:bg-green-600 transition"
    >
      {label}
    </a>
  );
}