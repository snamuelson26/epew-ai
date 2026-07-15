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
  created_at?: string | null;
};

type DailyTransaction = {
  id: string | number;
  entrepreneur_id: string | number;
  transaction_date: string;
  total_sales?: number | null;
  total_expenses?: number | null;
  business_health_score?: number | null;
  inventory_status?: string | null;
  equipment_problem?: boolean | null;
  employee_problem?: boolean | null;
  unusual_event?: boolean | null;
  tax_status?: string | null;
  monthly_profit_loss_status?: string | null;
  promotion_status?: string | null;
};

const today = new Date().toISOString().slice(0, 10);

export default function AutomationEnginePage() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
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

  function entrepreneurStatus(e?: Entrepreneur | null) {
    return e?.status || e?.current_status || e?.application_status || "Pending";
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

  function daysBetween(date?: string | null) {
    if (!date) return 0;
    const start = new Date(date);
    const end = new Date();
    return Math.max(
      0,
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
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

  function averageHealth(id: string | number) {
    const records = businessTransactions(id);
    if (records.length === 0) return 0;

    return Math.round(
      records.reduce((sum, item) => sum + Number(item.business_health_score || 0), 0) /
        records.length
    );
  }

  function salesTrendStatus(id: string | number) {
    const records = businessTransactions(id)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      )
      .slice(0, 7);

    if (records.length < 3) return "Not Enough Data";

    const latest = Number(records[0].total_sales || 0);
    const oldest = Number(records[records.length - 1].total_sales || 0);

    if (latest > oldest) return "Increasing";
    if (latest < oldest) return "Declining";
    return "Stable";
  }

  const activeBusinesses = entrepreneurs.filter(isOpenedBusiness);

  const missingReports = activeBusinesses.filter((e) => !hasTodayReport(e.id));

  const coachInterventions = missingReports.filter(
    (e) => daysSinceLastReport(e.id) >= 3
  );

  const adminEscalations = missingReports.filter(
    (e) => daysSinceLastReport(e.id) >= 7
  );

  const lowHealthBusinesses = activeBusinesses.filter(
    (e) => averageHealth(e.id) > 0 && averageHealth(e.id) < 70
  );

  const promotionRecommendations = activeBusinesses.filter((e) => {
    const health = averageHealth(e.id);
    const trend = salesTrendStatus(e.id);

    return health > 0 && (health < 70 || trend === "Declining");
  });

  const expansionEligible = activeBusinesses.filter(
    (e) => daysBetween(e.business_opening_date) >= 180
  );

  const automationStats = useMemo(() => {
    return {
      activeBusinesses: activeBusinesses.length,
      missingReports: missingReports.length,
      coachInterventions: coachInterventions.length,
      adminEscalations: adminEscalations.length,
      lowHealth: lowHealthBusinesses.length,
      promotions: promotionRecommendations.length,
      expansionEligible: expansionEligible.length,
    };
  }, [
    activeBusinesses,
    missingReports,
    coachInterventions,
    adminEscalations,
    lowHealthBusinesses,
    promotionRecommendations,
    expansionEligible,
  ]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            EPEW Automation Engine
          </h1>
          <p className="mt-2 text-slate-600">
            Central automation control for daily reporting, reminders, coach
            escalation, Kleernest accounting alerts, ORGDH promotion
            recommendations, quarterly reporting, and growth eligibility.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-4 xl:grid-cols-7">
          <SummaryCard label="Active Businesses" value={automationStats.activeBusinesses} />
          <SummaryCard label="Missing Reports" value={automationStats.missingReports} color="text-red-700" />
          <SummaryCard label="Coach Calls" value={automationStats.coachInterventions} color="text-orange-700" />
          <SummaryCard label="Admin Escalations" value={automationStats.adminEscalations} color="text-red-700" />
          <SummaryCard label="Low Health" value={automationStats.lowHealth} color="text-yellow-700" />
          <SummaryCard label="ORGDH Promotion" value={automationStats.promotions} color="text-blue-700" />
          <SummaryCard label="Expansion Eligible" value={automationStats.expansionEligible} color="text-green-700" />
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Automation Rules
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <RuleCard
              title="Morning Opening Reminder"
              status="Prepared"
              description="Send a reminder at the business opening time to encourage daily reporting discipline."
            />

            <RuleCard
              title="Closing Time Reminder"
              status="Prepared"
              description="If no report is submitted by closing time, send a closing reminder."
            />

            <RuleCard
              title="Missing Report Reminder"
              status="Prepared"
              description="If a report is missing, continue daily reminders until the report is submitted."
            />

            <RuleCard
              title="3-Day Coach Intervention"
              status="Active Logic"
              description="After 3 missed days, the entrepreneur must receive a direct coach message or phone call."
            />

            <RuleCard
              title="7-Day Admin Escalation"
              status="Active Logic"
              description="After 7 missed days, alert EPEW Admin for business monitoring intervention."
            />

            <RuleCard
              title="6-Month Growth Eligibility"
              status="Active Logic"
              description="After 180 days of operation, the business becomes eligible for growth funding review based on metrics."
            />

            <RuleCard
              title="Kleernest Financial Alert"
              status="Prepared"
              description="Notify Kleernest when monthly Profit & Loss or tax readiness review is needed."
            />

            <RuleCard
              title="ORGDH Promotion Recommendation"
              status="Active Logic"
              description="Recommend promotion when health score is low or sales trend is declining."
            />

            <RuleCard
              title="Quarterly Report Scheduling"
              status="Prepared"
              description="Create quarterly reporting checkpoints after business opening."
            />
          </div>
        </section>

        <div className="mb-6 grid gap-6 xl:grid-cols-2">
          <AutomationPanel
            title="Coach Intervention Queue"
            emptyText="No coach intervention required."
            items={coachInterventions.map((e) => ({
              title: businessName(e),
              subtitle: `Coach: ${e.coach_name || "Coach Pending"}`,
              detail: `${daysSinceLastReport(e.id)} days since last report. Phone call required.`,
              tone: "red",
            }))}
          />

          <AutomationPanel
            title="Admin Escalation Queue"
            emptyText="No admin escalation required."
            items={adminEscalations.map((e) => ({
              title: businessName(e),
              subtitle: `Status: ${entrepreneurStatus(e)}`,
              detail: `${daysSinceLastReport(e.id)} days missing. Admin intervention required.`,
              tone: "red",
            }))}
          />
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-2">
          <AutomationPanel
            title="Kleernest Financial Review Alerts"
            emptyText="No financial review alerts."
            items={lowHealthBusinesses.map((e) => ({
              title: businessName(e),
              subtitle: `Health Score: ${averageHealth(e.id)}%`,
              detail:
                "Kleernest financial review recommended due to low business health.",
              tone: "orange",
            }))}
          />

          <AutomationPanel
            title="ORGDH Promotion Recommendations"
            emptyText="No promotion recommendations."
            items={promotionRecommendations.map((e) => ({
              title: businessName(e),
              subtitle: `Sales Trend: ${salesTrendStatus(e.id)}`,
              detail:
                "ORGDH promotion recommended to support business visibility and growth.",
              tone: "blue",
            }))}
          />
        </div>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Growth Funding Eligibility
          </h2>

          {expansionEligible.length === 0 ? (
            <p className="text-slate-500">
              No business has reached 6 months of operation yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-700">
                    <th className="p-3">Business</th>
                    <th className="p-3">Entrepreneur</th>
                    <th className="p-3">Days Operating</th>
                    <th className="p-3">Health Score</th>
                    <th className="p-3">Reporting Records</th>
                    <th className="p-3">Recommendation</th>
                  </tr>
                </thead>

                <tbody>
                  {expansionEligible.map((e) => {
                    const health = averageHealth(e.id);
                    const reports = businessTransactions(e.id).length;

                    return (
                      <tr key={e.id} className="border-b">
                        <td className="p-3 font-semibold text-slate-800">
                          {businessName(e)}
                        </td>
                        <td className="p-3">
                          {e.full_name || e.name || "Name Pending"}
                        </td>
                        <td className="p-3">
                          {daysBetween(e.business_opening_date)}
                        </td>
                        <td className="p-3">{health}%</td>
                        <td className="p-3">{reports}</td>
                        <td className="p-3">
                          {health >= 80
                            ? "Eligible for Growth Funding Review"
                            : "Continue Monitoring"}
                        </td>
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

function RuleCard({
  title,
  status,
  description,
}: {
  title: string;
  status: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          {status}
        </span>
      </div>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}

function AutomationPanel({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: {
    title: string;
    subtitle: string;
    detail: string;
    tone: "red" | "orange" | "blue";
  }[];
}) {
  const toneClass = {
    red: "border-red-200 bg-red-50 text-red-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold text-slate-900">{title}</h2>

      {items.length === 0 ? (
        <p className="text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 10).map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className={`rounded-xl border p-4 ${toneClass[item.tone]}`}
            >
              <p className="font-bold text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-600">{item.subtitle}</p>
              <p className={`mt-1 text-sm ${toneClass[item.tone].split(" ")[2]}`}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}