"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [vendorName, setVendorName] = useState("");
  const [vendorType, setVendorType] = useState("Business Setup");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Approved");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_vendors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setVendors([]);
      setLoading(false);
      return;
    }

    setVendors(data || []);
    setLoading(false);
  }

  async function createVendor() {
    if (!vendorName) {
      alert("Please enter vendor name.");
      return;
    }

    const { error } = await supabase.from("admin_vendors").insert([
      {
        vendor_name: vendorName,
        vendor_type: vendorType,
        contact_name: contactName,
        email,
        phone,
        status,
        notes,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setVendorName("");
    setVendorType("Business Setup");
    setContactName("");
    setEmail("");
    setPhone("");
    setStatus("Approved");
    setNotes("");

    loadVendors();
  }

  async function updateStatus(id: number, newStatus: string) {
    const { error } = await supabase
      .from("admin_vendors")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadVendors();
  }

  function statusColor(vendorStatus: string) {
    if (vendorStatus === "Approved") return "bg-green-100 text-green-800";
    if (vendorStatus === "Pending Review") return "bg-yellow-100 text-yellow-800";
    if (vendorStatus === "Suspended") return "bg-red-100 text-red-800";
    if (vendorStatus === "Archived") return "bg-gray-200 text-gray-800";
    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Vendors Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Vendors Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage approved EPEW vendors and payees for business setup, promotion,
        rent, equipment, inventory, and other approved services.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">Total Vendors</h2>
          <p className="text-4xl font-extrabold text-[#06245c] mt-4">
            {vendors.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">Approved</h2>
          <p className="text-4xl font-extrabold text-green-700 mt-4">
            {vendors.filter((v) => v.status === "Approved").length}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">Pending Review</h2>
          <p className="text-4xl font-extrabold text-yellow-700 mt-4">
            {vendors.filter((v) => v.status === "Pending Review").length}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">Suspended</h2>
          <p className="text-4xl font-extrabold text-red-700 mt-4">
            {vendors.filter((v) => v.status === "Suspended").length}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-8 border-blue-600 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          Vendor Payment Rule
        </h2>

        <p className="mt-2 text-gray-700">
          EPEW may pay approved vendors directly instead of releasing all funds
          to the entrepreneur at once. This protects the business launch process
          and supports proper use of funds.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Add Vendor / Payee
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            className="border rounded-xl p-4"
            placeholder="Vendor / Payee Name"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={vendorType}
            onChange={(e) => setVendorType(e.target.value)}
          >
            <option>Business Setup</option>
            <option>Promotion</option>
            <option>Rent</option>
            <option>Equipment</option>
            <option>Inventory</option>
            <option>Working Capital</option>
            <option>Other</option>
          </select>

          <input
            className="border rounded-xl p-4"
            placeholder="Contact Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />

          <input
            className="border rounded-xl p-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border rounded-xl p-4"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Approved</option>
            <option>Pending Review</option>
            <option>Suspended</option>
            <option>Archived</option>
          </select>
        </div>

        <textarea
          className="border rounded-xl p-4 w-full min-h-[140px] mb-6"
          placeholder="Vendor notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={createVendor}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Vendor
        </button>
      </div>

      {vendors.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No vendors added yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Vendor / Payee</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Contact</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Phone</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Notes</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b align-top">
                  <td className="p-4 font-bold">
                    {vendor.vendor_name || "-"}
                  </td>

                  <td className="p-4">{vendor.vendor_type || "-"}</td>

                  <td className="p-4">{vendor.contact_name || "-"}</td>

                  <td className="p-4">{vendor.email || "-"}</td>

                  <td className="p-4">{vendor.phone || "-"}</td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                        vendor.status
                      )}`}
                    >
                      {vendor.status || "Pending Review"}
                    </span>
                  </td>

                  <td className="p-4 max-w-[350px]">
                    {vendor.notes || "-"}
                  </td>

                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(vendor.id, "Approved")}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => updateStatus(vendor.id, "Pending Review")}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
                    >
                      Review
                    </button>

                    <button
                      onClick={() => updateStatus(vendor.id, "Suspended")}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl"
                    >
                      Suspend
                    </button>

                    <button
                      onClick={() => updateStatus(vendor.id, "Archived")}
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