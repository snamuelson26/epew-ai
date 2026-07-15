"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionType, setActionType] = useState("Status Change");
  const [description, setDescription] = useState("");
  const [performedBy, setPerformedBy] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLogs(data || []);
    setLoading(false);
  }

  async function createLog() {
    if (!description) {
      alert("Please enter activity description.");
      return;
    }

    const { error } = await supabase.from("admin_activity_logs").insert([
      {
        action_type: actionType,
        description,
        performed_by: performedBy || "Admin",
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setActionType("Status Change");
    setDescription("");
    setPerformedBy("");

    loadLogs();
  }

  function actionColor(action: string) {
    if (action === "Approval") return "bg-green-100 text-green-800";
    if (action === "Rejection") return "bg-red-100 text-red-800";
    if (action === "Funding Update") return "bg-blue-100 text-blue-800";
    if (action === "Report Update") return "bg-purple-100 text-purple-800";
    if (action === "Notification") return "bg-yellow-100 text-yellow-800";
    if (action === "Support Ticket") return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Activity Logs...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Activity Logs
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Track important admin actions, approvals, rejections, funding updates,
        report updates, notifications, and support ticket activity.
      </p>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Add Activity Log
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <select
            className="border rounded-xl p-4"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
          >
            <option>Status Change</option>
            <option>Approval</option>
            <option>Rejection</option>
            <option>Funding Update</option>
            <option>Report Update</option>
            <option>Notification</option>
            <option>Support Ticket</option>
            <option>System Update</option>
          </select>

          <input
            className="border rounded-xl p-4"
            placeholder="Performed By"
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
          />

          <input
            className="border rounded-xl p-4"
            placeholder="Activity Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          onClick={createLog}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Activity
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No activity logs yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Action Type</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Performed By</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-4">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${actionColor(
                        log.action_type
                      )}`}
                    >
                      {log.action_type || "Activity"}
                    </span>
                  </td>

                  <td className="p-4 max-w-[500px]">
                    {log.description || "-"}
                  </td>

                  <td className="p-4 font-bold">
                    {log.performed_by || "Admin"}
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