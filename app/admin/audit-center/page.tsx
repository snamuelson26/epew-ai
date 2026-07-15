"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminAuditCenterPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("Admin");
  const [action, setAction] = useState("");
  const [category, setCategory] = useState("Funding");
  const [status, setStatus] = useState("Completed");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_audit_logs")
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
    if (!userName || !action) {
      alert("Please enter user name and action.");
      return;
    }

    const { error } = await supabase.from("admin_audit_logs").insert([
      {
        user_name: userName,
        role,
        action,
        category,
        status,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setUserName("");
    setRole("Admin");
    setAction("");
    setCategory("Funding");
    setStatus("Completed");
    loadLogs();
  }

  function badgeColor(value: string) {
    if (value === "Completed" || value === "Verified" || value === "Fund Released") {
      return "bg-green-100 text-green-800";
    }

    if (value === "In Progress" || value === "Approved") {
      return "bg-blue-100 text-blue-800";
    }

    if (value === "Pending" || value === "Review") {
      return "bg-yellow-100 text-yellow-800";
    }

    if (value === "Rejected" || value === "Failed") {
      return "bg-red-100 text-red-800";
    }

    return "bg-gray-100 text-gray-800";
  }

  const entrepreneurActions = logs.filter((log) => log.role === "Entrepreneur").length;
  const coachVerifications = logs.filter((log) => log.role === "Coach").length;
  const adminActions = logs.filter((log) => log.role === "Admin").length;
  const rejectedActions = logs.filter((log) => log.status === "Rejected").length;

  const completedActions = logs.filter((log) => log.status === "Completed").length;
  const integrityScore =
    logs.length === 0 ? 100 : Math.round((completedActions / logs.length) * 100);

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Audit Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Audit Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Track user actions, coach verifications, admin approvals, funding
        releases, rejected requests, and platform accountability.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Entrepreneur Actions
          </h2>
          <p className="text-4xl font-extrabold text-[#06245c] mt-4">
            {entrepreneurActions}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Coach Verifications
          </h2>
          <p className="text-4xl font-extrabold text-blue-700 mt-4">
            {coachVerifications}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Admin Actions
          </h2>
          <p className="text-4xl font-extrabold text-green-700 mt-4">
            {adminActions}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Rejected Requests
          </h2>
          <p className="text-4xl font-extrabold text-red-700 mt-4">
            {rejectedActions}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">
            Integrity Score
          </h2>
          <p className="text-4xl font-extrabold text-purple-700 mt-4">
            {integrityScore}%
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-8 border-blue-600 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          Audit Flow
        </h2>

        <p className="mt-2 text-gray-700">
          Entrepreneur Action → Coach Verification → Admin Approval → Fund
          Release → Business Opened → Quarterly Reporting
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Add Audit Log
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <input
            className="border rounded-xl p-4"
            placeholder="User Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option>Entrepreneur</option>
            <option>Coach</option>
            <option>Admin</option>
            <option>Partner</option>
            <option>Supporter</option>
          </select>

          <input
            className="border rounded-xl p-4"
            placeholder="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Funding</option>
            <option>Disbursement</option>
            <option>Marketplace</option>
            <option>Reports</option>
            <option>Compliance</option>
            <option>Support Ticket</option>
            <option>System</option>
          </select>

          <select
            className="border rounded-xl p-4"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Completed</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Verified</option>
            <option>Approved</option>
            <option>Fund Released</option>
            <option>Rejected</option>
            <option>Failed</option>
          </select>
        </div>

        <button
          onClick={createLog}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Audit Log
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No audit logs recorded yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Action</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Status</th>
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

                  <td className="p-4 font-bold">
                    {log.user_name || "-"}
                  </td>

                  <td className="p-4">{log.role || "-"}</td>

                  <td className="p-4 max-w-[350px]">
                    {log.action || "-"}
                  </td>

                  <td className="p-4">{log.category || "-"}</td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${badgeColor(
                        log.status
                      )}`}
                    >
                      {log.status || "Pending"}
                    </span>
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