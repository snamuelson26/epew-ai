"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FundedBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFundedBusinesses();
  }, []);

  async function loadFundedBusinesses() {
    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .in("status", ["Business Opened", "Quarterly Reporting"])
      .order("business_opening_date", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setBusinesses(data || []);
    setLoading(false);
  }

  if (loading) {
    return <div className="p-10 text-2xl font-bold">Loading Funded Businesses...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Funded Businesses
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        View EPEW businesses that have opened and are now in quarterly reporting.
      </p>

      {businesses.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          No funded businesses yet.
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Business</th>
                <th className="text-left p-4">Entrepreneur</th>
                <th className="text-left p-4">Funding Status</th>
                <th className="text-left p-4">Approved Amount</th>
                <th className="text-left p-4">Opening Date</th>
                <th className="text-left p-4">Quarterly Status</th>
              </tr>
            </thead>

            <tbody>
              {businesses.map((business) => (
                <tr key={business.id} className="border-b">
                  <td className="p-4 font-bold">
                    {business.business_name || "Unnamed Business"}
                  </td>

                  <td className="p-4">
                    {business.full_name || "Unnamed Entrepreneur"}
                  </td>

                  <td className="p-4">
                    {business.status || "Business Opened"}
                  </td>

                  <td className="p-4">
                    {business.approved_amount
                      ? `$${Number(business.approved_amount).toLocaleString()}`
                      : "-"}
                  </td>

                  <td className="p-4">
                    {business.business_opening_date || "-"}
                  </td>

                  <td className="p-4">
                    {business.quarterly_report_status || "Pending"}
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