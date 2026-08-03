"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminAutomationCenterPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [automationName, setAutomationName] = useState("");
  const [category, setCategory] = useState("Entrepreneur Automation");
  const [triggerEvent, setTriggerEvent] = useState("");
  const [actionType, setActionType] = useState("Notification");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadAutomations();
  }, []);

  async function loadAutomations() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_automations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setAutomations([]);
      setLoading(false);
      return;
    }

    setAutomations(data || []);
    setLoading(false);
  }

  async function createAutomation() {
    if (!automationName || !triggerEvent) {
      alert("Please enter automation name and trigger event.");
      return;
    }

    const { error } = await supabase.from("admin_automations").insert([
      {
        automation_name: automationName,
        category,
        trigger_event: triggerEvent,
        action_type: actionType,
        status,
        notes,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setAutomationName("");
    setCategory("Entrepreneur Automation");
    setTriggerEvent("");
    setActionType("Notification");
    setStatus("Active");
    setNotes("");

    loadAutomations();
  }

  async function updateStatus(id: number, newStatus: string) {
    const { error } = await supabase
      .from("admin_automations")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadAutomations();
  }

  function statusColor(value: string) {
    if (value === "Active") return "bg-green-100 text-green-800";
    if (value === "Paused") return "bg-yellow-100 text-yellow-800";
    if (value === "Disabled") return "bg-red-100 text-red-800";
    if (value === "Draft") return "bg-gray-200 text-gray-800";
    return "bg-gray-100 text-gray-700";
  }

  const activeAutomations = automations.filter((a) => a.status === "Active").length;
  const pausedAutomations = automations.filter((a) => a.status === "Paused").length;
  const disabledAutomations = automations.filter((a) => a.status === "Disabled").length;
  const draftAutomations = automations.filter((a) => a.status === "Draft").length;

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Automation Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Automation Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage EPEW automated actions for entrepreneurs, coaches, supporters,
        funding, reporting, compliance, notifications, and audit logs.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">Active</h2>
          <p className="text-4xl font-extrabold text-green-700 mt-4">
            {activeAutomations}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">Paused</h2>
          <p className="text-4xl font-extrabold text-yellow-700 mt-4">
            {pausedAutomations}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">Disabled</h2>
          <p className="text-4xl font-extrabold text-red-700 mt-4">
            {disabledAutomations}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-600">Draft</h2>
          <p className="text-4xl font-extrabold text-gray-700 mt-4">
            {draftAutomations}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-8 border-blue-600 p-6 rounded-2xl mb-10">
        <h2 className="font-bold text-xl text-[#06245c]">
          Automation Rule
        </h2>

        <p className="mt-2 text-gray-700">
          Automations should create notifications, audit logs, reminders, and
          follow-up tasks when important EPEW events occur, such as coach
          assignment, funding approval, category completion, fund release, and
          quarterly report deadlines.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Add Automation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            className="border rounded-xl p-4"
            placeholder="Automation Name"
            value={automationName}
            onChange={(e) => setAutomationName(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Entrepreneur Automation</option>
            <option>Coach Automation</option>
            <option>Supporter Automation</option>
            <option>Funding Automation</option>
            <option>Reporting Automation</option>
            <option>Compliance Automation</option>
            <option>Audit Automation</option>
            <option>Platform Automation</option>
          </select>

          <input
            className="border rounded-xl p-4"
            placeholder="Trigger Event"
            value={triggerEvent}
            onChange={(e) => setTriggerEvent(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
          >
            <option>Notification</option>
            <option>Email Reminder</option>
            <option>Audit Log</option>
            <option>Status Update</option>
            <option>Coach Alert</option>
            <option>Admin Alert</option>
            <option>Supporter Update</option>
            <option>Risk Alert</option>
          </select>

          <select
            className="border rounded-xl p-4"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Active</option>
            <option>Paused</option>
            <option>Disabled</option>
            <option>Draft</option>
          </select>
        </div>

        <textarea
          className="border rounded-xl p-4 w-full min-h-[140px] mb-6"
          placeholder="Automation notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={createAutomation}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Automation
        </button>
      </div>

      {automations.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No custom automations added yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8 mb-10">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Automation</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Trigger</th>
                <th className="text-left p-4">Action</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Notes</th>
                <th className="text-left p-4">Controls</th>
              </tr>
            </thead>

            <tbody>
              {automations.map((item) => (
                <tr key={item.id} className="border-b align-top">
                  <td className="p-4 font-bold">
                    {item.automation_name || "-"}
                  </td>

                  <td className="p-4">{item.category || "-"}</td>

                  <td className="p-4">{item.trigger_event || "-"}</td>

                  <td className="p-4">{item.action_type || "-"}</td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                        item.status
                      )}`}
                    >
                      {item.status || "Draft"}
                    </span>
                  </td>

                  <td className="p-4 max-w-[350px]">
                    {item.notes || "-"}
                  </td>

                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(item.id, "Active")}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Activate
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "Paused")}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
                    >
                      Pause
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "Disabled")}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl"
                    >
                      Disable
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "Draft")}
                      className="bg-gray-700 text-white px-4 py-2 rounded-xl"
                    >
                      Draft
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Recommended Default Automations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DefaultAutomation title="Welcome Email" detail="Send welcome message after entrepreneur registration." />
          <DefaultAutomation title="Coach Assignment Alert" detail="Notify entrepreneur and coach when coach is assigned." />
          <DefaultAutomation title="Questionnaire Reminder" detail="Remind entrepreneur to complete the questionnaire." />
          <DefaultAutomation title="Interview Reminder" detail="Send interview reminder before scheduled coach meeting." />
          <DefaultAutomation title="Category Completion Alert" detail="Notify coach when entrepreneur marks a category complete." />
          <DefaultAutomation title="Coach Verification Alert" detail="Notify admin when coach verifies a category." />
          <DefaultAutomation title="Fund Release Notification" detail="Notify entrepreneur when admin releases funds by category." />
          <DefaultAutomation title="Quarterly Report Reminder" detail="Send 30-day, 15-day, and final reminders before report due date." />
          <DefaultAutomation title="Overdue Report Alert" detail="Flag overdue reports and notify coach/admin." />
          <DefaultAutomation title="Risk Alert" detail="Notify admin when a business becomes high risk." />
        </div>
      </div>
    </main>
  );
}

function DefaultAutomation({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="bg-[#f5f7fb] rounded-2xl p-6 border">
      <h3 className="text-xl font-bold text-[#06245c]">{title}</h3>
      <p className="text-gray-700 mt-2">{detail}</p>
    </div>
  );
}