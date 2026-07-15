"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DisbursementCategory = {
  label: string;
  amountField: string;
  entrepreneurField: string;
  coachField: string;
  adminField: string;
  payeeField?: string;
  defaultPayee: string;
};

export default function AdminDisbursementsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDisbursements();
  }, []);

  async function loadDisbursements() {
    setLoading(true);

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setApplications([]);
      setLoading(false);
      return;
    }

    setApplications(data || []);
    setLoading(false);
  }

  async function updateApplication(id: number, updates: any) {
    const { error } = await supabase
      .from("entrepreneur_applications")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadDisbursements();
  }

  function categories(app: any): DisbursementCategory[] {
    return [
      {
        label: "Business Setup",
        amountField: "business_setup_amount",
        entrepreneurField: "business_setup_status",
        coachField: "business_setup_coach_status",
        adminField: "business_setup_admin_status",
        payeeField: "business_setup_vendor",
        defaultPayee: "Kleernest",
      },
      {
        label: "Promotion",
        amountField: "promotion_amount",
        entrepreneurField: "promotion_status",
        coachField: "promotion_coach_status",
        adminField: "promotion_admin_status",
        payeeField: "promotion_vendor",
        defaultPayee: "ORGDH Network",
      },
      {
        label: "Rent",
        amountField: "rent_amount",
        entrepreneurField: "rent_status",
        coachField: "rent_coach_status",
        adminField: "rent_admin_status",
        payeeField: "rent_payee",
        defaultPayee: "Business Owner / Landlord",
      },
      {
        label: "Equipment",
        amountField: "equipment_amount",
        entrepreneurField: "equipment_status",
        coachField: "equipment_coach_status",
        adminField: "equipment_admin_status",
        payeeField: "equipment_payee",
        defaultPayee: "Approved Vendor",
      },
      {
        label: "Inventory",
        amountField: "inventory_amount",
        entrepreneurField: "inventory_status",
        coachField: "inventory_coach_status",
        adminField: "inventory_admin_status",
        payeeField: "inventory_payee",
        defaultPayee: "Approved Vendor",
      },
      {
        label: "Other",
        amountField: "other_amount",
        entrepreneurField: "other_status",
        coachField: "other_coach_status",
        adminField: "other_admin_status",
        payeeField: "other_payee",
        defaultPayee: "Additional Approved Expense",
      },
      {
        label: "Remaining Balance",
        amountField: "remaining_balance_amount",
        entrepreneurField: "remaining_balance_status",
        coachField: "remaining_balance_coach_status",
        adminField: "remaining_balance_admin_status",
        defaultPayee: "Final Release",
      },
    ];
  }

  function badgeColor(status: string) {
    if (status === "Fund Released" || status === "Complete" || status === "Verified") {
      return "bg-green-100 text-green-800";
    }

    if (status === "Approved" || status === "In Progress") {
      return "bg-blue-100 text-blue-800";
    }

    if (status === "Ready for Approval" || status === "Pending") {
      return "bg-yellow-100 text-yellow-800";
    }

    if (status === "Rejected" || status === "Request Rejected") {
      return "bg-red-100 text-red-800";
    }

    if (status === "Request Release") {
      return "bg-purple-100 text-purple-800";
    }

    return "bg-gray-100 text-gray-800";
  }

  function getReleasedAmount(app: any) {
    return categories(app).reduce((sum, cat) => {
      return app[cat.adminField] === "Fund Released"
        ? sum + Number(app[cat.amountField] || 0)
        : sum;
    }, 0);
  }

  const totalApproved = applications.reduce(
    (sum, app) => sum + Number(app.approved_amount || 0),
    0
  );

  const totalReleased = applications.reduce(
    (sum, app) => sum + getReleasedAmount(app),
    0
  );

  const pendingRequests = applications.reduce((sum, app) => {
    return (
      sum +
      categories(app).filter(
        (cat) =>
          app[cat.entrepreneurField] === "Complete" &&
          app[cat.coachField] === "Verified" &&
          app[cat.adminField] !== "Fund Released"
      ).length
    );
  }, 0);

  const rejectedRequests = applications.reduce((sum, app) => {
    return (
      sum +
      categories(app).filter((cat) => app[cat.adminField] === "Rejected").length
    );
  }, 0);

  if (loading) {
    return <div className="p-10 text-2xl font-bold">Loading Disbursements...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Disbursement Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage category-by-category fund releases, vendor payments, working
        capital requests, rejected requests, and remaining balances.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Card title="Approved Funding" value={`$${totalApproved.toLocaleString()}`} color="text-[#06245c]" />
        <Card title="Funds Released" value={`$${totalReleased.toLocaleString()}`} color="text-green-700" />
        <Card title="Pending Requests" value={pendingRequests} color="text-yellow-700" />
        <Card title="Rejected Requests" value={rejectedRequests} color="text-red-700" />
      </div>

      <div className="bg-blue-50 border-l-8 border-blue-600 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          Disbursement Control Rule
        </h2>

        <p className="mt-2 text-gray-700">
          Funds are released only after the entrepreneur marks the category
          complete, the coach verifies it, and admin approves the category.
          EPEW may pay vendors or payees directly instead of releasing the full
          approved amount at once.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No disbursement records available yet.
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {applications.map((app) => {
            const approvedAmount = Number(app.approved_amount || 0);
            const releasedAmount = getReleasedAmount(app);
            const remainingAmount = approvedAmount - releasedAmount;

            return (
              <div key={app.id} className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-4xl font-extrabold text-[#06245c]">
                      {app.business_name || "Unnamed Business"}
                    </h2>

                    <p className="text-lg text-gray-700 mt-2">
                      Entrepreneur:{" "}
                      <span className="font-bold">{app.full_name || "-"}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <span className="px-4 py-2 rounded-xl font-bold bg-green-100 text-green-800">
                      Approved: ${approvedAmount.toLocaleString()}
                    </span>

                    <span className="px-4 py-2 rounded-xl font-bold bg-blue-100 text-blue-800">
                      Released: ${releasedAmount.toLocaleString()}
                    </span>

                    <span className="px-4 py-2 rounded-xl font-bold bg-yellow-100 text-yellow-800">
                      Remaining: ${remainingAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="overflow-auto rounded-2xl border mb-8">
                  <table className="w-full min-w-[1200px] bg-white">
                    <thead>
                      <tr className="border-b bg-[#f5f7fb]">
                        <th className="text-left p-4">Category</th>
                        <th className="text-left p-4">Payee</th>
                        <th className="text-left p-4">Amount</th>
                        <th className="text-left p-4">Entrepreneur</th>
                        <th className="text-left p-4">Coach</th>
                        <th className="text-left p-4">Admin</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {categories(app).map((cat) => {
                        const entrepreneurStatus =
                          app[cat.entrepreneurField] || "Pending";
                        const coachStatus = app[cat.coachField] || "Pending";
                        const adminStatus = app[cat.adminField] || "Pending";
                        const payee = cat.payeeField
                          ? app[cat.payeeField] || cat.defaultPayee
                          : cat.defaultPayee;

                        const canApprove =
                          entrepreneurStatus === "Complete" &&
                          coachStatus === "Verified";

                        const canRelease =
                          canApprove && adminStatus === "Approved";

                        return (
                          <tr key={cat.label} className="border-b align-top">
                            <td className="p-4 font-bold">{cat.label}</td>
                            <td className="p-4">{payee}</td>

                            <td className="p-4">
                              <input
                                type="number"
                                defaultValue={app[cat.amountField] || 0}
                                className="border rounded-xl p-3 w-32"
                                onBlur={(e) =>
                                  updateApplication(app.id, {
                                    [cat.amountField]: Number(e.target.value || 0),
                                  })
                                }
                              />
                            </td>

                            <td className="p-4">
                              <span className={`px-4 py-2 rounded-xl font-bold ${badgeColor(entrepreneurStatus)}`}>
                                {entrepreneurStatus}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className={`px-4 py-2 rounded-xl font-bold ${badgeColor(coachStatus)}`}>
                                {coachStatus}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className={`px-4 py-2 rounded-xl font-bold ${badgeColor(adminStatus)}`}>
                                {adminStatus}
                              </span>
                            </td>

                            <td className="p-4 flex gap-2 flex-wrap">
                              <button
                                disabled={!canApprove}
                                onClick={() =>
                                  updateApplication(app.id, {
                                    [cat.adminField]: "Approved",
                                  })
                                }
                                className={`px-4 py-2 rounded-xl text-white ${
                                  canApprove
                                    ? "bg-blue-600"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                              >
                                Approve
                              </button>

                              <button
                                disabled={!canApprove}
                                onClick={() =>
                                  updateApplication(app.id, {
                                    [cat.adminField]: "Rejected",
                                  })
                                }
                                className={`px-4 py-2 rounded-xl text-white ${
                                  canApprove
                                    ? "bg-red-600"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                              >
                                Reject
                              </button>

                              <button
                                disabled={!canRelease}
                                onClick={() =>
                                  updateApplication(app.id, {
                                    [cat.adminField]: "Fund Released",
                                  })
                                }
                                className={`px-4 py-2 rounded-xl text-white ${
                                  canRelease
                                    ? "bg-green-600"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                              >
                                Release Fund
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-purple-50 border-l-8 border-purple-600 p-6 rounded-2xl">
                  <h3 className="font-bold text-xl text-[#06245c] mb-4">
                    Working Capital Requested
                  </h3>

                  <p className="text-3xl font-extrabold text-purple-700 mb-4">
                    ${Number(app.working_capital_request || 0).toLocaleString()}
                  </p>

                  <span
                    className={`px-4 py-2 rounded-xl font-bold ${badgeColor(
                      app.working_capital_status || "Pending"
                    )}`}
                  >
                    {app.working_capital_status || "Pending"}
                  </span>

                  <p className="text-gray-700 mt-4">
                    {app.working_capital_notes || "No working capital notes added."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h2 className="text-lg font-bold text-gray-600">{title}</h2>
      <p className={`text-4xl font-extrabold mt-4 ${color}`}>{value}</p>
    </div>
  );
}