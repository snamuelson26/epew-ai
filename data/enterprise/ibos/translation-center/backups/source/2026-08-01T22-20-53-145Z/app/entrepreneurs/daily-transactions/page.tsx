"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Entrepreneur = {
  id: string | number;
  user_id?: string | null;
  full_name?: string | null;
  name?: string | null;
  business_name?: string | null;
  status?: string | null;
  current_status?: string | null;
  application_status?: string | null;
  coach_name?: string | null;
  business_opening_date?: string | null;
  business_opened?: boolean | null;
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

export default function EntrepreneurDailyTransactionsPage() {
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    transaction_date: today,
    business_open: true,
    opening_time: "",
    closing_time: "",
    total_sales: "",
    total_expenses: "",
    inventory_status: "Enough",
    equipment_problem: false,
    employee_problem: false,
    unusual_event: false,
    unusual_event_notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please log in to access your Daily Business Journal.");
      setLoading(false);
      return;
    }

    const { data: entrepreneurData, error: entrepreneurError } = await supabase
      .from("entrepreneurs")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (entrepreneurError || !entrepreneurData) {
      setMessage("Entrepreneur profile not found.");
      setLoading(false);
      return;
    }

    setEntrepreneur(entrepreneurData);

    const { data: transactionData, error: transactionError } = await supabase
      .from("daily_transactions")
      .select("*")
      .eq("entrepreneur_id", entrepreneurData.id)
      .order("transaction_date", { ascending: false });

    if (transactionError) {
      setMessage(transactionError.message);
      setLoading(false);
      return;
    }

    setTransactions(transactionData || []);
    setLoading(false);
  }

  function entrepreneurStatus() {
    return (
      entrepreneur?.status ||
      entrepreneur?.current_status ||
      entrepreneur?.application_status ||
      "Pending"
    );
  }

  function isBusinessOpened() {
    if (!entrepreneur) return false;

    const status = entrepreneurStatus();

    return (
      status === "Business Opened" ||
      status === "Quarterly Reporting" ||
      entrepreneur.business_opened === true ||
      !!entrepreneur.business_opening_date
    );
  }

  function calculateHealthScore() {
    let score = 100;

    if (!form.business_open) score -= 10;
    if (form.inventory_status === "Low") score -= 10;
    if (form.inventory_status === "Problem") score -= 20;
    if (form.equipment_problem) score -= 20;
    if (form.employee_problem) score -= 15;
    if (form.unusual_event) score -= 10;

    const sales = Number(form.total_sales || 0);
    const expenses = Number(form.total_expenses || 0);

    if (form.business_open && sales <= 0) score -= 10;
    if (sales > 0 && expenses > sales) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  async function submitDailyRecord() {
    if (!entrepreneur) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("daily_transactions").insert({
      entrepreneur_id: entrepreneur.id,
      transaction_date: form.transaction_date,
      business_open: form.business_open,
      opening_time: form.business_open ? form.opening_time || null : null,
      closing_time: form.business_open ? form.closing_time || null : null,
      total_sales: form.business_open ? Number(form.total_sales || 0) : 0,
      total_expenses: form.business_open ? Number(form.total_expenses || 0) : 0,
      inventory_status: form.business_open ? form.inventory_status : "Closed",
      equipment_problem: form.business_open ? form.equipment_problem : false,
      employee_problem: form.business_open ? form.employee_problem : false,
      unusual_event: form.unusual_event,
      unusual_event_notes: form.unusual_event ? form.unusual_event_notes : "",
      report_status: "Submitted",
      bookkeeping_status: "Pending",
      tax_status: "Preparing",
      monthly_profit_loss_status: "Preparing",
      business_health_score: calculateHealthScore(),
      promotion_status: "None",
      expansion_eligible: false,
      expansion_status: "Not Eligible",
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage(
      "Daily Business Journal submitted successfully. EPEW and Kleernest LLC can now use this record for monthly Profit & Loss, tax preparation, coaching, and business growth support."
    );

    setForm({
      transaction_date: today,
      business_open: true,
      opening_time: "",
      closing_time: "",
      total_sales: "",
      total_expenses: "",
      inventory_status: "Enough",
      equipment_problem: false,
      employee_problem: false,
      unusual_event: false,
      unusual_event_notes: "",
    });

    await loadData();
    setSaving(false);
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

  const summary = useMemo(() => {
    const totalSales = transactions.reduce(
      (sum, item) => sum + Number(item.total_sales || 0),
      0
    );

    const totalExpenses = transactions.reduce(
      (sum, item) => sum + Number(item.total_expenses || 0),
      0
    );

    const netProfit = totalSales - totalExpenses;

    const todayRecord = transactions.find((item) => item.transaction_date === today);

    const averageHealth =
      transactions.length > 0
        ? Math.round(
            transactions.reduce(
              (sum, item) => sum + Number(item.business_health_score || 0),
              0
            ) / transactions.length
          )
        : 0;

    const attentionCount = transactions.filter((item) => {
      const sales = Number(item.total_sales || 0);
      const expenses = Number(item.total_expenses || 0);

      return (
        item.inventory_status === "Low" ||
        item.inventory_status === "Problem" ||
        item.equipment_problem === true ||
        item.employee_problem === true ||
        item.unusual_event === true ||
        expenses > sales
      );
    }).length;

    const daysOperating = daysBetween(entrepreneur?.business_opening_date);
    const expansionDaysRemaining = Math.max(0, 180 - daysOperating);
    const reportingScore =
      daysOperating > 0
        ? Math.min(100, Math.round((transactions.length / daysOperating) * 100))
        : 0;

    return {
      totalSales,
      totalExpenses,
      netProfit,
      todayRecord,
      averageHealth,
      attentionCount,
      reportsSubmitted: transactions.length,
      daysOperating,
      expansionDaysRemaining,
      expansionEligible: daysOperating >= 180,
      reportingScore,
    };
  }, [transactions, entrepreneur]);

  const dailyProfit =
    Number(form.total_sales || 0) - Number(form.total_expenses || 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <p className="text-slate-600">Loading Daily Business Journal...</p>
      </main>
    );
  }

  if (!isBusinessOpened()) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-slate-900">
            Daily Business Journal
          </h1>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h2 className="text-xl font-bold">
              This feature becomes available after your official Business
              Opening.
            </h2>

            <p className="mt-3">
              Your daily journal is activated only after EPEW confirms that your
              business has officially opened. Once activated, you will report
              sales, expenses, business health, and daily activity for Kleernest
              LLC accounting, tax preparation, coaching, and growth monitoring.
            </p>

            <p className="mt-4 font-bold">
              Current Status: {entrepreneurStatus()}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Daily Business Journal
          </h1>

          <p className="mt-2 text-slate-600">
            Submit your daily business record. This simple report helps EPEW,
            your coach, Kleernest LLC, and future growth monitoring support your
            business success.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
            {message}
          </div>
        )}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Business Summary
          </h2>

          <div className="grid gap-4 md:grid-cols-4">
            <InfoCard
              label="Business"
              value={
                entrepreneur?.business_name ||
                entrepreneur?.full_name ||
                entrepreneur?.name ||
                "Business Pending"
              }
            />
            <InfoCard label="Status" value={entrepreneurStatus()} />
            <InfoCard
              label="Coach"
              value={entrepreneur?.coach_name || "Coach Pending"}
            />
            <InfoCard
              label="Days Operating"
              value={summary.daysOperating}
              color="text-blue-700"
            />
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            My Business Intelligence
          </h2>

          <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
            <InfoCard
              label="Reported Today"
              value={summary.todayRecord ? "Yes" : "No"}
              color={summary.todayRecord ? "text-green-700" : "text-red-700"}
            />
            <InfoCard
              label="Total Sales"
              value={money(summary.totalSales)}
              color="text-green-700"
            />
            <InfoCard
              label="Total Expenses"
              value={money(summary.totalExpenses)}
              color="text-red-700"
            />
            <InfoCard
              label="Net Profit"
              value={money(summary.netProfit)}
              color={summary.netProfit >= 0 ? "text-green-700" : "text-red-700"}
            />
            <InfoCard
              label="Health Score"
              value={`${summary.averageHealth}%`}
              color="text-purple-700"
            />
            <InfoCard
              label="Reporting Score"
              value={`${summary.reportingScore}%`}
              color="text-indigo-700"
            />
            <InfoCard
              label="Needs Attention"
              value={summary.attentionCount}
              color="text-orange-700"
            />
            <InfoCard
              label="Expansion"
              value={
                summary.expansionEligible
                  ? "Eligible"
                  : `${summary.expansionDaysRemaining} days`
              }
              color={summary.expansionEligible ? "text-green-700" : "text-orange-700"}
            />
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Submit Today’s Record
          </h2>

          {summary.todayRecord && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
              You already submitted a daily business record for today.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-bold text-slate-700">
                Business Date
              </label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) =>
                  setForm({ ...form, transaction_date: e.target.value })
                }
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-slate-700">
                Was your business open today?
              </label>
              <select
                value={form.business_open ? "yes" : "no"}
                onChange={(e) =>
                  setForm({ ...form, business_open: e.target.value === "yes" })
                }
                className="w-full rounded-xl border p-3"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {form.business_open && (
              <>
                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={form.opening_time}
                    onChange={(e) =>
                      setForm({ ...form, opening_time: e.target.value })
                    }
                    className="w-full rounded-xl border p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={form.closing_time}
                    onChange={(e) =>
                      setForm({ ...form, closing_time: e.target.value })
                    }
                    className="w-full rounded-xl border p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Total Sales
                  </label>
                  <input
                    type="number"
                    value={form.total_sales}
                    onChange={(e) =>
                      setForm({ ...form, total_sales: e.target.value })
                    }
                    className="w-full rounded-xl border p-3"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Total Expenses
                  </label>
                  <input
                    type="number"
                    value={form.total_expenses}
                    onChange={(e) =>
                      setForm({ ...form, total_expenses: e.target.value })
                    }
                    className="w-full rounded-xl border p-3"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Today’s Profit / Loss
                  </p>
                  <h3
                    className={`text-2xl font-bold ${
                      dailyProfit >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {money(dailyProfit)}
                  </h3>
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Inventory Status
                  </label>
                  <select
                    value={form.inventory_status}
                    onChange={(e) =>
                      setForm({ ...form, inventory_status: e.target.value })
                    }
                    className="w-full rounded-xl border p-3"
                  >
                    <option value="Enough">Enough</option>
                    <option value="Low">Low</option>
                    <option value="Problem">Problem</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Equipment Problems?
                  </label>
                  <select
                    value={form.equipment_problem ? "yes" : "no"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        equipment_problem: e.target.value === "yes",
                      })
                    }
                    className="w-full rounded-xl border p-3"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-700">
                    Employee Problems?
                  </label>
                  <select
                    value={form.employee_problem ? "yes" : "no"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        employee_problem: e.target.value === "yes",
                      })
                    }
                    className="w-full rounded-xl border p-3"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block font-bold text-slate-700">
                Did anything unusual happen today?
              </label>
              <select
                value={form.unusual_event ? "yes" : "no"}
                onChange={(e) =>
                  setForm({ ...form, unusual_event: e.target.value === "yes" })
                }
                className="w-full rounded-xl border p-3"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {form.unusual_event && (
              <div className="md:col-span-2">
                <label className="mb-2 block font-bold text-slate-700">
                  Explain what happened
                </label>
                <textarea
                  value={form.unusual_event_notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unusual_event_notes: e.target.value,
                    })
                  }
                  className="min-h-28 w-full rounded-xl border p-3"
                  placeholder="Write a short explanation..."
                />
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl bg-blue-50 p-4 text-blue-800">
            <strong>Kleernest LLC Support:</strong> Your daily entries help
            prepare monthly Profit & Loss, tax records, financial reviews, and
            future growth funding evaluations.
          </div>

          <button
            onClick={submitDailyRecord}
            disabled={saving}
            className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit Daily Business Record"}
          </button>
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
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Coach Support
            </h2>
            <InfoLine label="Coach" value={entrepreneur?.coach_name || "Pending"} />
            <InfoLine
              label="Coach Status"
              value={summary.attentionCount > 0 ? "Review Recommended" : "Current"}
            />
            <InfoLine label="Next Follow-Up" value="Scheduled by Coach" />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Growth Monitoring
            </h2>
            <InfoLine
              label="Business Health"
              value={`${summary.averageHealth}%`}
            />
            <InfoLine
              label="Reporting Score"
              value={`${summary.reportingScore}%`}
            />
            <InfoLine
              label="Expansion Funding"
              value={
                summary.expansionEligible
                  ? "Eligible for Review"
                  : `${summary.expansionDaysRemaining} days remaining`
              }
            />
          </section>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            My Daily Business History
          </h2>

          {transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <h3 className="text-lg font-bold text-slate-800">
                No daily records submitted yet.
              </h3>
              <p className="mt-2 text-slate-500">
                Your submitted daily records will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-700">
                    <th className="p-3">Date</th>
                    <th className="p-3">Open</th>
                    <th className="p-3">Sales</th>
                    <th className="p-3">Expenses</th>
                    <th className="p-3">Net</th>
                    <th className="p-3">Health</th>
                    <th className="p-3">Inventory</th>
                    <th className="p-3">Tax / P&L</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((item) => {
                    const net =
                      Number(item.total_sales || 0) -
                      Number(item.total_expenses || 0);

                    return (
                      <tr key={item.id} className="border-b">
                        <td className="p-3">{item.transaction_date}</td>
                        <td className="p-3">
                          {item.business_open ? "Yes" : "No"}
                        </td>
                        <td className="p-3 text-green-700">
                          {money(item.total_sales)}
                        </td>
                        <td className="p-3 text-red-700">
                          {money(item.total_expenses)}
                        </td>
                        <td
                          className={`p-3 font-bold ${
                            net >= 0 ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {money(net)}
                        </td>
                        <td className="p-3">
                          {item.business_health_score || 0}%
                        </td>
                        <td className="p-3">
                          {item.inventory_status || "Enough"}
                        </td>
                        <td className="p-3">
                          {item.tax_status || "Preparing"} /{" "}
                          {item.monthly_profit_loss_status || "Preparing"}
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

function InfoCard({
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