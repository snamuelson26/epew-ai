"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type FundingCategory = {
  key: string;
  label: string;
  payee: string;
  entrepreneurField: string;
  coachField: string;
  adminField: string;
};

export default function FundingProgressionCenterPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .order("created_at", { ascending: false });

     console.log(
  "EOS IDENTIFIER RESEARCH:",
  Object.fromEntries(
    Object.entries(data?.[0] ?? {}).filter(([key]) =>
      key.includes("id") ||
      key.includes("code") ||
      key.includes("business") ||
      key.includes("entrepreneur")
    )
  )
);

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

    loadApplications();
  }

  function badgeColor(status: string) {
    if (
      status === "Complete" ||
      status === "Verified" ||
      status === "Fund Released" ||
      status === "Completed"
    ) {
      return "bg-green-100 text-green-800";
    }

    if (status === "In Progress" || status === "Approved") {
      return "bg-blue-100 text-blue-800";
    }

    if (status === "Ready for Approval" || status === "Needs Review") {
      return "bg-purple-100 text-purple-800";
    }

    if (status === "Request Release") {
  return "bg-green-100 text-green-800";
}

if (status === "Request Rejected") {
  return "bg-red-100 text-red-800";
}

    if (status === "Rejected" || status === "On Hold") {
      return "bg-red-100 text-red-800";
    }

    return "bg-yellow-100 text-yellow-800";
  }

  function getCategories(app: any): FundingCategory[] {
    return [
      {
        key: "business_setup",
        label: "Business Setup",
        payee: app.business_setup_vendor || "Kleernest",
        entrepreneurField: "business_setup_status",
        coachField: "business_setup_coach_status",
        adminField: "business_setup_admin_status",
      },
      {
        key: "promotion",
        label: "Promotion",
        payee: app.promotion_vendor || "ORGDH Network",
        entrepreneurField: "promotion_status",
        coachField: "promotion_coach_status",
        adminField: "promotion_admin_status",
      },
      {
        key: "rent",
        label: "Rent",
        payee: app.rent_payee || "Business Owner / Landlord",
        entrepreneurField: "rent_status",
        coachField: "rent_coach_status",
        adminField: "rent_admin_status",
      },
      {
        key: "equipment",
        label: "Equipment",
        payee: app.equipment_payee || "Approved Vendor",
        entrepreneurField: "equipment_status",
        coachField: "equipment_coach_status",
        adminField: "equipment_admin_status",
      },
      {
        key: "inventory",
        label: "Inventory",
        payee: app.inventory_payee || "Approved Vendor",
        entrepreneurField: "inventory_status",
        coachField: "inventory_coach_status",
        adminField: "inventory_admin_status",
      },
      {
        key: "other",
        label: "Other",
        payee: app.other_payee || "Additional Approved Expense",
        entrepreneurField: "other_status",
        coachField: "other_coach_status",
        adminField: "other_admin_status",
      },
      {
        key: "remaining_balance",
        label: "Remaining Balance",
        payee: "Final Release",
        entrepreneurField: "remaining_balance_status",
        coachField: "remaining_balance_coach_status",
        adminField: "remaining_balance_admin_status",
      },
    ];
  }

  function getCurrentStatus(app: any, cat: FundingCategory) {
    const entrepreneurStatus = app[cat.entrepreneurField] || "Pending";
    const coachStatus = app[cat.coachField] || "Pending";
    const adminStatus = app[cat.adminField] || "Pending";

    if (adminStatus === "Fund Released") return "Fund Released";
    if (adminStatus === "Rejected") return "Rejected";
    if (adminStatus === "Approved") return "Approved";
    if (coachStatus === "Verified") return "Verified";

    return entrepreneurStatus;
  }

  function getProgress(app: any) {
    const categories = getCategories(app);

    const entrepreneurComplete = categories.filter(
      (cat) => app[cat.entrepreneurField] === "Complete"
    ).length;

    const coachVerified = categories.filter(
      (cat) => app[cat.coachField] === "Verified"
    ).length;

    const fundsReleased = categories.filter(
      (cat) => app[cat.adminField] === "Fund Released"
    ).length;

    const overallPercent = Math.round((fundsReleased / categories.length) * 100);

    return {
      total: categories.length,
      entrepreneurComplete,
      coachVerified,
      fundsReleased,
      overallPercent,
    };
  }

  function StepButton({
    label,
    active,
    disabled,
    onClick,
  }: {
    label: string;
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-2 rounded-xl text-sm font-bold border ${
          active
            ? badgeColor(label)
            : disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        {label}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Funding Allocation Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Funding Allocation Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage funding allocation by category, entrepreneur completion,
        coach verification, admin approval, vendor payments, working
        capital requests, and release readiness before disbursement.

      </p>

      <div className="bg-blue-50 border-l-8 border-blue-600 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          EPEW Funding Control Rule
        </h2>

        <p className="mt-2 text-gray-700">
          Entrepreneur completes each category first. The coach verifies it.
          Admin approves or rejects the category. Funds are released only after
          completion, verification, and approval.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No applications available for funding progression yet.
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {applications.map((app) => {
            const approvedAmount = Number(app.approved_amount || 0);
            const categories = getCategories(app);
            const progress = getProgress(app);

            return (
              <div key={app.id} className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
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
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${badgeColor(
                        app.status
                      )}`}
                    >
                      {app.status || "Pending"}
                    </span>

                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${badgeColor(
                        app.committee_recommendation
                      )}`}
                    >
                      {app.committee_recommendation || "Pending"}
                    </span>

                    <span className="px-4 py-2 rounded-xl font-bold bg-green-100 text-green-800">
                      ${approvedAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <h3 className="font-bold text-gray-600">Approved Amount</h3>
                    <p className="text-3xl font-extrabold text-green-700 mt-3">
                      ${approvedAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <h3 className="font-bold text-gray-600">Platform Fee</h3>
                    <p className="text-3xl font-extrabold text-purple-700 mt-3">
                      ${Number(app.platform_fee || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <h3 className="font-bold text-gray-600">
                      Working Capital Request
                    </h3>
                    <p className="text-3xl font-extrabold text-blue-700 mt-3">
                      ${Number(app.working_capital_request || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <h3 className="font-bold text-gray-600">Coach Verified</h3>
                    <p className="text-3xl font-extrabold text-[#06245c] mt-3">
                      {progress.coachVerified}/{progress.total}
                    </p>
                  </div>

                  <div className="bg-[#f5f7fb] rounded-2xl p-6">
                    <h3 className="font-bold text-gray-600">Funds Released</h3>
                    <p className="text-3xl font-extrabold text-green-700 mt-3">
                      {progress.fundsReleased}/{progress.total}
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-[#06245c] mb-3">
                    Overall Funding Progress
                  </h3>

                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-green-600 h-8 text-white font-bold text-center"
                      style={{ width: `${progress.overallPercent}%` }}
                    >
                      {progress.overallPercent}%
                    </div>
                  </div>
                </div>

                <div className="overflow-auto rounded-2xl border mb-8">
                  <table className="w-full bg-white min-w-[1200px]">
                    <thead>
                      <tr className="border-b bg-[#f5f7fb]">
                        <th className="text-left p-4">Category</th>
                        <th className="text-left p-4">Payee</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Entrepreneur Action</th>
                        <th className="text-left p-4">Coach Action</th>
                        <th className="text-left p-4">Admin Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {categories.map((cat) => {
                        const entrepreneurStatus =
                          app[cat.entrepreneurField] || "Pending";
                        const coachStatus = app[cat.coachField] || "Pending";
                        const adminStatus = app[cat.adminField] || "Pending";
                        const currentStatus = getCurrentStatus(app, cat);

                        const canCoachReview =
                          entrepreneurStatus === "Ready for Approval" ||
                          entrepreneurStatus === "Complete";

                        const canCoachVerify = entrepreneurStatus === "Complete";

                        const canAdminApprove =
                          entrepreneurStatus === "Complete" &&
                          coachStatus === "Verified";

                        const canReleaseFund =
                          entrepreneurStatus === "Complete" &&
                          coachStatus === "Verified" &&
                          adminStatus === "Approved";

                        return (
                          <tr key={cat.key} className="border-b align-top">
                            <td className="p-4 font-bold">{cat.label}</td>

                            <td className="p-4">{cat.payee}</td>

                            <td className="p-4">
                              <span
                                className={`px-4 py-2 rounded-xl font-bold ${badgeColor(
                                  currentStatus
                                )}`}
                              >
                                {currentStatus}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex flex-wrap gap-2">
                                {[
                                  "Pending",
                                  "In Progress",
                                  "Ready for Approval",
                                  "Complete",
                                ].map((step) => (
                                  <StepButton
                                    key={step}
                                    label={step}
                                    active={entrepreneurStatus === step}
                                    onClick={() =>
                                      updateApplication(app.id, {
                                        [cat.entrepreneurField]: step,
                                      })
                                    }
                                  />
                                ))}
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="flex flex-wrap gap-2">
                                <StepButton
                                  label="Review"
                                  active={coachStatus === "Review"}
                                  disabled={!canCoachReview}
                                  onClick={() =>
                                    updateApplication(app.id, {
                                      [cat.coachField]: "Review",
                                    })
                                  }
                                />

                                <StepButton
                                  label="Verified"
                                  active={coachStatus === "Verified"}
                                  disabled={!canCoachVerify}
                                  onClick={() =>
                                    updateApplication(app.id, {
                                      [cat.coachField]: "Verified",
                                    })
                                  }
                                />
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="flex flex-wrap gap-2">
                                <StepButton
                                  label="Approved"
                                  active={adminStatus === "Approved"}
                                  disabled={!canAdminApprove}
                                  onClick={() =>
                                    updateApplication(app.id, {
                                      [cat.adminField]: "Approved",
                                      disbursement_status: "In Progress",
                                    })
                                  }
                                />

                                <StepButton
                                  label="Rejected"
                                  active={adminStatus === "Rejected"}
                                  disabled={!canAdminApprove}
                                  onClick={() =>
                                    updateApplication(app.id, {
                                      [cat.adminField]: "Rejected",
                                    })
                                  }
                                />

                                <StepButton
                                  label="Fund Released"
                                  active={adminStatus === "Fund Released"}
                                  disabled={!canReleaseFund}
                                  onClick={() =>
                                    updateApplication(app.id, {
                                      [cat.adminField]: "Fund Released",
                                      disbursement_status: "In Progress",
                                    })
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-yellow-50 border-l-8 border-yellow-500 p-6 rounded-2xl">
                    <h3 className="font-bold text-xl text-[#06245c] mb-4">
                      Funding Notes
                    </h3>

                    <textarea
                      id={`notes-${app.id}`}
                      className="border rounded-xl p-4 w-full min-h-[180px]"
                      defaultValue={app.funding_notes || ""}
                      placeholder="Committee comments, vendor observations, missing documents, special conditions, working capital remarks..."
                    />

                    <button
                      onClick={() => {
                        const input = document.getElementById(
                          `notes-${app.id}`
                        ) as HTMLTextAreaElement;

                        updateApplication(app.id, {
                          funding_notes: input.value,
                        });
                      }}
                      className="bg-[#06245c] text-white px-6 py-3 rounded-xl font-bold mt-4"
                    >
                      Save Notes
                    </button>
                  </div>

                  <div className="bg-blue-50 border-l-8 border-blue-600 p-6 rounded-2xl">
  <h3 className="font-bold text-xl text-[#06245c] mb-4">
    Working Capital Requested
  </h3>

  <input
    id={`working-capital-${app.id}`}
    type="number"
    className="border rounded-xl p-4 w-full mb-4"
    defaultValue={app.working_capital_request || 0}
    placeholder="Enter working capital requested"
  />

  <div className="mb-4">
    <span
      className={`px-4 py-2 rounded-xl font-bold ${badgeColor(
        app.working_capital_status || "Pending"
      )}`}
    >
      {app.working_capital_status || "Pending"}
    </span>
  </div>

  <textarea
    id={`working-capital-notes-${app.id}`}
    className="border rounded-xl p-4 w-full min-h-[120px] mb-4"
    defaultValue={app.working_capital_notes || ""}
    placeholder="Working capital notes..."
  />

  <div className="flex flex-wrap gap-3">
    <button
      onClick={() => {
        const amountInput = document.getElementById(
          `working-capital-${app.id}`
        ) as HTMLInputElement;

        const notesInput = document.getElementById(
          `working-capital-notes-${app.id}`
        ) as HTMLTextAreaElement;

        updateApplication(app.id, {
          working_capital_request: Number(amountInput.value || 0),
          working_capital_status: "Request Release",
          working_capital_notes: notesInput.value,
        });
      }}
      className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold"
    >
      Request Release
    </button>

    <button
      onClick={() => {
        const amountInput = document.getElementById(
          `working-capital-${app.id}`
        ) as HTMLInputElement;

        const notesInput = document.getElementById(
          `working-capital-notes-${app.id}`
        ) as HTMLTextAreaElement;

        updateApplication(app.id, {
          working_capital_request: Number(amountInput.value || 0),
          working_capital_status: "Request Rejected",
          working_capital_notes: notesInput.value,
        });
      }}
      className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold"
    >
      Request Rejected
    </button>

    <button
      onClick={() => {
        const amountInput = document.getElementById(
          `working-capital-${app.id}`
        ) as HTMLInputElement;

        const notesInput = document.getElementById(
          `working-capital-notes-${app.id}`
        ) as HTMLTextAreaElement;

        updateApplication(app.id, {
          working_capital_request: Number(amountInput.value || 0),
          working_capital_notes: notesInput.value,
        });
      }}
      className="bg-[#06245c] text-white px-6 py-3 rounded-xl font-bold"
    >
      Save Notes
    </button>
  </div>
</div>
                </div>
                <div className="bg-white border rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-[#06245c] mb-4">
                    Business Progression
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        updateApplication(app.id, {
                          approved_amount: 100000,
                          platform_fee: 4000,
                          status: "Funding Approved",
                          committee_recommendation: "Approved",
                          disbursement_status: "Pending",
                          business_setup_vendor: "Kleernest",
                          promotion_vendor: "ORGDH Network",
                          committee_comments:
                            "Approved under EPEW standard funding model: 20 units, $100 weekly contribution, 52-week cycle, $100,000 business funding. Funds are released by approved category and not all at once.",
                        })
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                    >
                      Approve $100,000
                    </button>

                    <button
                      onClick={() =>
                        updateApplication(app.id, {
                          status: "Business Opened",
                        })
                      }
                      className="bg-purple-600 text-white px-4 py-2 rounded-xl"
                    >
                      Business Opened
                    </button>

                    <button
                      onClick={() =>
                        updateApplication(app.id, {
                          status: "Quarterly Reporting",
                        })
                      }
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
                    >
                      Quarterly Reporting
                    </button>
                  </div>
                                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
