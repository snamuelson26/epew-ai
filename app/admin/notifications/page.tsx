"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }

  async function createNotification() {
    if (!title || !message) {
      alert("Please enter a title and message.");
      return;
    }

    const { error } = await supabase.from("admin_notifications").insert([
      {
        title,
        audience,
        message,
        status: "Draft",
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setTitle("");
    setAudience("All");
    setMessage("");
    loadNotifications();
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("admin_notifications")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadNotifications();
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Notifications Center...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Notifications Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Create and manage platform notices, announcements, interview reminders,
        funding updates, and quarterly report reminders.
      </p>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Create Notification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            className="border rounded-xl p-4"
            placeholder="Notification Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option>All</option>
            <option>Entrepreneurs</option>
            <option>Supporters</option>
            <option>Coaches</option>
            <option>Partners</option>
          </select>
        </div>

        <textarea
          className="border rounded-xl p-4 w-full min-h-[160px] mb-6"
          placeholder="Write notification message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={createNotification}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Notification
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No notifications created yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Audience</th>
                <th className="text-left p-4">Message</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {notifications.map((notice) => (
                <tr key={notice.id} className="border-b">
                  <td className="p-4 font-bold">{notice.title}</td>
                  <td className="p-4">{notice.audience}</td>
                  <td className="p-4 max-w-[400px]">
                    {notice.message}
                  </td>
                  <td className="p-4">{notice.status}</td>

                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(notice.id, "Published")}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Publish
                    </button>

                    <button
                      onClick={() => updateStatus(notice.id, "Draft")}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
                    >
                      Draft
                    </button>

                    <button
                      onClick={() => updateStatus(notice.id, "Archived")}
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