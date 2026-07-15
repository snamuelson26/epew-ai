"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Entrepreneur = {
  id: string | number;
  full_name?: string | null;
  name?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  current_status?: string | null;
  application_status?: string | null;
  coach_name?: string | null;
  business_opening_date?: string | null;
  business_opened?: boolean | null;
  approved_amount?: number | null;
  created_at?: string | null;
};

type DailyTransaction = {
  id: string | number;
  entrepreneur_id: string | number;
  transaction_date: string;
  business_open?: boolean | null;
  opening_time?: string | null;
  closing_time?: string | null;
  total_sales?: number | null;
  total_expenses?: number | null;
  inventory_status?: string | null;
  equipment_problem?: boolean | null;
  employee_problem?: boolean | null;
  unusual_event?: boolean | null;
  unusual_event_notes?: string | null;
  report_status?: string | null;
  bookkeeping_status?: string | null;
  tax_status?: string | null;
  monthly_profit_loss_status?: string | null;
  business_health_score?: number | null;
  promotion_status?: string | null;
  expansion_eligible?: boolean | null;
  expansion_status?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
};

const today = new Date().toISOString().slice(0, 10);

const money = (value: number | null | undefined) =>
  `$${Number(value || 0).toLocaleString()}`;

export default function AdminBusinessIntelligenceCenterPage() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage("");

    const { data: entrepreneurData, error: entrepreneurError } = await supabase
      .from("entrepreneurs")
      .select("*")
      .order("created_at", { ascending: false });

    if (entrepreneurError) {
      setMessage(entrepreneurError.message);
      setLoading(false);
      return;
    }

    const { data: transactionData, error: transactionError } = await supabase
      .from("daily_transactions")
      .select("*")
      .order("transaction_date", { ascending: false });

    if (transactionError) {
      setMessage(transactionError.message);
      setLoading(false);
      return;
    }

    setEntrepreneurs(entrepreneurData || []);
    setTransactions(transactionData || []);
    setLoading(false);
  }

  function businessName(e?: Entrepreneur | null) {
    return e?.business_name || e?.full_name || e?.name || "Unnamed Business";
  }

  function ownerName(e?: Entrepreneur | null) {
    return e?.full_name || e?.name || "Name Pending";
  }

  function entrepreneurStatus(e?: Entrepreneur | null) {
    return e?.status || e?.current_status || e?.application_status || "Pending";
  }

  function getEntrepreneur(id: string | number) {
    return entrepreneurs.find((e) => String(e.id) === String(id));
  }

  function getBusinessName(id: string | number) {
    return businessName(getEntrepreneur(id));
  }

  function daysBetween(date?: string | null) {
    if (!date) return 0;
    const start = new Date(date);
    const end = new Date();
    return Math.max(
      0,
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  function isOpenedBusiness(e: Entrepreneur) {
    const status = entrepreneurStatus(e);

    return (
      status === "Business Opened" ||
      status === "Business Opening" ||
      status === "Quarterly Reporting" ||
      e.business_opened === true ||
      !!e.business_opening_date
    );
  }

  function businessTransactions(id: string | number) {
    return transactions.filter((t) => String(t.entrepreneur_id) === String(id));
  }

  function hasTodayReport(id: string | number) {
    return transactions.some(
      (t) => String(t.entrepreneur_id) === String(id) && t.transaction_date === today
    );
  }

  function daysSinceLastReport(id: string | number) {
    const records = businessTransactions(id).sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime()
    );

    if (records.length === 0) return 999;

    return daysBetween(records[0].transaction_date);
  }

  function healthBadge(score?: number | null) {
    const value = Number(score || 0);
    if (value >= 80) return "bg-green-100 text-green-700";
    if (value >= 60) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  }

  function riskLabel(t: DailyTransaction) {
    const sales = Number(t.total_sales || 0);
    const expenses = Number(t.total_expenses || 0);

    if (expenses > sales) return "Negative Profit";
    if (t.equipment_problem) return "Equipment Issue";
    if (t.employee_problem) return "Employee Issue";
    if (t.inventory_status === "Low" || t.inventory_status === "Problem") {
      return "Inventory Issue";
    }
    if (t.unusual_event) return "Unusual Event";
    return "Normal";
  }

  const activeBusinesses = entrepreneurs.filter(isOpenedBusiness);

  const selectedBusiness =
    selectedEntrepreneur === ""
      ? null
      : entrepreneurs.find((e) => String(e.id) === String(selectedEntrepreneur)) ||
        null;

  const selectedTransactions = selectedBusiness
    ? businessTransactions(selectedBusiness.id)
    : transactions;

  const todayTransactions = transactions.filter((t) => t.transaction_date === today);

  const selectedTodayTransaction = selectedBusiness
    ? transactions.find(
        (t) =>
          String(t.entrepreneur_id) === String(selectedBusiness.id) &&
          t.transaction_date === today
      )
    : null;

  const missingReports = activeBusinesses.filter((e) => !hasTodayReport(e.id));

  const coachCallsRequired = missingReports.filter(
    (e) => daysSinceLastReport(e.id) >= 3
  );

  const attentionRecords = selectedTransactions.filter((t) => {
    const sales = Number(t.total_sales || 0);
    const expenses = Number(t.total_expenses || 0);

    return (
      t.inventory_status === "Low" ||
      t.inventory_status === "Problem" ||
      t.equipment_problem === true ||
      t.employee_problem === true ||
      t.unusual_event === true ||
      expenses > sales
    );
  });

  const promotionRecommendations = selectedTransactions.filter(
    (t) =>
      t.promotion_status === "Recommended" ||
      Number(t.business_health_score || 100) < 70
  );

  const ecosystemSummary = useMemo(() => {
    const salesToday = todayTransactions.reduce(
      (sum, t) => sum + Number(t.total_sales || 0),
      0
    );

    const expensesToday = todayTransactions.reduce(
      (sum, t) => sum + Number(t.total_expenses || 0),
      0
    );

    const healthRecords = todayTransactions.filter(
      (t) => t.business_health_score !== null && t.business_health_score !== undefined
    );

    const avgHealth =
      healthRecords.length > 0
        ? Math.round(
            healthRecords.reduce(
              (sum, t) => sum + Number(t.business_health_score || 0),
              0
            ) / healthRecords.length
          )
        : 0;

    return {
      activeBusinesses: activeBusinesses.length,
      reportedToday: todayTransactions.length,
      missingReports: missingReports.length,
      coachCalls: coachCallsRequired.length,
      salesToday,
      expensesToday,
      netToday: salesToday - expensesToday,
      avgHealth,
    };
  }, [activeBusinesses, todayTransactions, missingReports, coachCallsRequired]);

  const selectedSummary = useMemo(() => {
    const salesToday = selectedTodayTransaction
      ? Number(selectedTodayTransaction.total_sales || 0)
      : 0;

    const expensesToday = selectedTodayTransaction
      ? Number(selectedTodayTransaction.total_expenses || 0)
      : 0;

    const totalSales = selectedTransactions.reduce(
      (sum, t) => sum + Number(t.total_sales || 0),
      0
    );

    const totalExpenses = selectedTransactions.reduce(
      (sum, t) => sum + Number(t.total_expenses || 0),
      0
    );

    const avgHealth =
      selectedTransactions.length > 0
        ? Math.round(
            selectedTransactions.reduce(
              (sum, t) => sum + Number(t.business_health_score || 0),
              0
            ) / selectedTransactions.length
          )
        : 0;

    const daysOperating = selectedBusiness
      ? daysBetween(selectedBusiness.business_opening_date)
      : 0;

    const reportingScore =
      selectedBusiness && daysOperating > 0
        ? Math.min(
            100,
            Math.round((selectedTransactions.length / Math.max(1, daysOperating)) * 100)
          )
        : 0;

    const expansionDaysRemaining = Math.max(0, 180 - daysOperating);

    return {
      salesToday,
      expensesToday,
      netToday: salesToday - expensesToday,
      totalSales,
      totalExpenses,
      totalNet: totalSales - totalExpenses,
      avgHealth,
      daysOperating,
      reportingScore,
      expansionDaysRemaining,
      expansionEligible: daysOperating >= 180,
    };
  }, [selectedBusiness, selectedTransactions, selectedTodayTransaction]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Business Intelligence Center
          </h1>
          <p className="mt-2 text-slate-600">
            Executive dashboard for funded businesses, daily reporting,
            financial health, coach intervention, Kleernest accounting, ORGDH
            promotion, and growth readiness.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Business Filter
          </h2>

          <select
            value={selectedEntrepreneur}
            onChange={(e) => setSelectedEntrepreneur(e.target.value)}
            className="w-full rounded-xl border p-3"
          >
            <option value="">All Businesses</option>
            {activeBusinesses.map((entrepreneur) => (
              <option key={entrepreneur.id} value={entrepreneur.id}>
                {businessName(entrepreneur)}
              </option>
            ))}
          </select>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            EPEW Ecosystem Summary
          </h2>

          <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
            <SummaryCard label="Active Businesses" value={ecosystemSummary.activeBusinesses} />
            <SummaryCard label="Reported Today" value={ecosystemSummary.reportedToday} color="text-green-700" />
            <SummaryCard label="Missing Reports" value={ecosystemSummary.missingReports} color="text-red-700" />
            <SummaryCard label="Coach Calls" value={ecosystemSummary.coachCalls} color="text-orange-700" />
            <SummaryCard label="Sales Today" value={money(ecosystemSummary.salesToday)} color="text-green-700" />
            <SummaryCard label="Expenses Today" value={money(ecosystemSummary.expensesToday)} color="text-red-700" />
            <SummaryCard
              label="Net Today"
              value={money(ecosystemSummary.netToday)}
              color={ecosystemSummary.netToday >= 0 ? "text-green-700" : "text-red-700"}
            />
            <SummaryCard label="Avg Health" value={`${ecosystemSummary.avgHealth}%`} color="text-purple-700" />
          </div>
        </section>

        {selectedBusiness && (
          <section className="mb-6 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-1 text-2xl font-bold text-slate-900">
              {businessName(selectedBusiness)}
            </h2>

            <p className="mb-6 text-slate-600">
              Owner: <span className="font-semibold">{ownerName(selectedBusiness)}</span>
              {" • "}
              Entrepreneur ID: <span className="font-semibold">{selectedBusiness.id}</span>
            </p>

            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <ProfileCard label="Business" value={businessName(selectedBusiness)} />
              <ProfileCard label="Entrepreneur" value={ownerName(selectedBusiness)} />
              <ProfileCard label="Coach" value={selectedBusiness.coach_name || "Coach Pending"} />
              <ProfileCard label="Status" value={entrepreneurStatus(selectedBusiness)} color="text-blue-700" />
            </div>

            <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
              <SummaryCard
                label="Reported Today"
                value={selectedTodayTransaction ? "Yes" : "No"}
                color={selectedTodayTransaction ? "text-green-700" : "text-red-700"}
              />
              <SummaryCard label="Missing Reports" value={selectedTodayTransaction ? 0 : 1} color="text-red-700" />
              <SummaryCard
                label="Coach Calls"
                value={daysSinceLastReport(selectedBusiness.id) >= 3 ? 1 : 0}
                color="text-orange-700"
              />
              <SummaryCard label="Sales Today" value={money(selectedSummary.salesToday)} color="text-green-700" />
              <SummaryCard label="Expenses Today" value={money(selectedSummary.expensesToday)} color="text-red-700" />
              <SummaryCard
                label="Net Today"
                value={money(selectedSummary.netToday)}
                color={selectedSummary.netToday >= 0 ? "text-green-700" : "text-red-700"}
              />
              <SummaryCard label="Health Score" value={`${selectedSummary.avgHealth}%`} color="text-purple-700" />
              <SummaryCard
                label="Expansion"
                value={
                  selectedSummary.expansionEligible
                    ? "Eligible"
                    : `${selectedSummary.expansionDaysRemaining} days`
                }
                color={selectedSummary.expansionEligible ? "text-green-700" : "text-orange-700"}
              />
            </div>
          </section>
        )}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Business Intelligence Alerts
          </h2>

          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="mb-3 font-bold text-red-700">
                Missing Reports & Coach Intervention
              </h3>

              {missingReports.length === 0 ? (
                <p className="text-slate-500">
                  All active businesses reported today.
                </p>
              ) : (
                <div className="space-y-3">
                  {missingReports.slice(0, 8).map((entrepreneur) => {
                    const missingDays = daysSinceLastReport(entrepreneur.id);

                    return (
                      <div key={entrepreneur.id} className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="font-bold text-slate-900">{businessName(entrepreneur)}</p>
                        <p className="text-sm text-slate-600">
                          Coach: {entrepreneur.coach_name || "Coach Pending"}
                        </p>
                        <p className="mt-1 text-sm text-red-700">
                          {missingDays >= 3
                            ? "Coach phone call required."
                            : "Daily reminder required."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 font-bold text-orange-700">
                Businesses Requiring Attention
              </h3>

              {attentionRecords.length === 0 ? (
                <p className="text-slate-500">
                  No business health alerts in the selected records.
                </p>
              ) : (
                <div className="space-y-3">
                  {attentionRecords.slice(0, 8).map((item) => (
                    <div key={item.id} className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <p className="font-bold text-slate-900">
                        {getBusinessName(item.entrepreneur_id)}
                      </p>
                      <p className="text-sm text-slate-600">
                        Date: {item.transaction_date}
                      </p>
                      <p className="mt-1 text-sm text-orange-800">
                        {riskLabel(item)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Kleernest Financial Center
            </h2>
            <InfoLine label="Bookkeeping" value="Preparing" />
            <InfoLine label="Monthly Profit & Loss" value="Preparing" />
            <InfoLine label="Tax Preparation" value="Preparing" />
            <InfoLine label="Financial Review" value="Not Required" />
            <InfoLine
              label="Expansion Review"
              value={
                selectedBusiness && selectedSummary.expansionEligible
                  ? "Eligible for Review"
                  : "Not Eligible"
              }
            />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              ORGDH Promotion Center
            </h2>

            <InfoLine
              label="Promotion Status"
              value={promotionRecommendations.length > 0 ? "Recommended" : "Not Needed"}
            />
            <InfoLine label="Promotion Requests" value={promotionRecommendations.length} />
            <InfoLine label="Campaign Status" value="None Scheduled" />

            <button className="mt-4 rounded-xl bg-blue-700 px-4 py-2 font-bold text-white hover:bg-blue-800">
              Request Promotion
            </button>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Growth Monitoring
            </h2>

            <InfoLine
              label="Business Health"
              value={`${selectedBusiness ? selectedSummary.avgHealth : ecosystemSummary.avgHealth}%`}
            />
            <InfoLine
              label="Reporting Score"
              value={selectedBusiness ? `${selectedSummary.reportingScore}%` : "All Businesses"}
            />
            <InfoLine
              label="Expansion Eligibility"
              value={
                selectedBusiness
                  ? selectedSummary.expansionEligible
                    ? "Eligible"
                    : `${selectedSummary.expansionDaysRemaining} days remaining`
                  : "Select Business"
              }
            />
          </section>
        </div>

        {selectedBusiness && (
          <section className="mb-6 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Business Timeline
            </h2>

            <div className="grid gap-3 md:grid-cols-4">
              <TimelineItem label="Business Opened" done={!!selectedBusiness.business_opening_date} />
              <TimelineItem label="First Daily Report" done={selectedTransactions.length > 0} />
              <TimelineItem label="First Monthly P&L" done={false} />
              <TimelineItem label="First Quarterly Report" done={false} />
              <TimelineItem label="ORGDH Promotion" done={promotionRecommendations.length > 0} />
              <TimelineItem label="Tax Ready" done={selectedTransactions.some((t) => t.tax_status === "Ready")} />
              <TimelineItem label="6 Months Completed" done={selectedSummary.expansionEligible} />
              <TimelineItem label="Growth Funding Review" done={false} />
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Daily Business History
          </h2>

          {loading ? (
            <p className="text-slate-500">Loading business intelligence...</p>
          ) : selectedTransactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <h3 className="text-lg font-bold text-slate-800">
                No daily business records found.
              </h3>
              <p className="mt-2 text-slate-500">
                Records will appear after funded businesses submit daily journals.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-700">
                    <th className="p-3">Date</th>
                    <th className="p-3">Business</th>
                    <th className="p-3">Open</th>
                    <th className="p-3">Sales</th>
                    <th className="p-3">Expenses</th>
                    <th className="p-3">Net</th>
                    <th className="p-3">Health</th>
                    <th className="p-3">Inventory</th>
                    <th className="p-3">Risk</th>
                    <th className="p-3">Kleernest</th>
                    <th className="p-3">ORGDH</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedTransactions.map((item) => {
                    const net =
                      Number(item.total_sales || 0) -
                      Number(item.total_expenses || 0);

                    return (
                      <tr key={item.id} className="border-b align-top">
                        <td className="p-3">{item.transaction_date}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          {getBusinessName(item.entrepreneur_id)}
                        </td>
                        <td className="p-3">{item.business_open ? "Yes" : "No"}</td>
                        <td className="p-3 text-green-700">{money(item.total_sales)}</td>
                        <td className="p-3 text-red-700">{money(item.total_expenses)}</td>
                        <td
                          className={`p-3 font-bold ${
                            net >= 0 ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {money(net)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${healthBadge(
                              item.business_health_score
                            )}`}
                          >
                            {item.business_health_score || 0}%
                          </span>
                        </td>
                        <td className="p-3">{item.inventory_status || "Enough"}</td>
                        <td className="p-3">{riskLabel(item)}</td>
                        <td className="p-3">
                          {item.monthly_profit_loss_status || "Preparing"}
                        </td>
                        <td className="p-3">{item.promotion_status || "None"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  color = "text-slate-900",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <h2 className={`mt-2 text-2xl font-bold ${color}`}>{value}</h2>
    </div>
  );
}

function ProfileCard({
  label,
  value,
  color = "text-slate-900",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className={`text-lg font-bold ${color}`}>{value}</h3>
    </div>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function TimelineItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        done ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className={`font-bold ${done ? "text-green-700" : "text-slate-500"}`}>
        {done ? "✓" : "○"} {label}
      </p>
    </div>
  );
}