"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [supporter, setSupporter] = useState<any>(null);

  const [recipientType, setRecipientType] = useState("EPEW Admin");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadSupporter();
  }, []);

  async function loadSupporter() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/supporters/login";
      return;
    }

    const { data } = await supabase
      .from("supporters")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) {
      window.location.href = "/supporters/login";
      return;
    }

    setSupporter(data);
    setLoading(false);
  }

  async function sendMessage() {
    if (!subject || !message) {
      alert("Please complete all fields.");
      return;
    }

    setSending(true);

    const { error } = await supabase
      .from("supporter_messages")
      .insert([
        {
          supporter_id: supporter.supporter_id,
          supporter_name: supporter.full_name,
          supporter_email: supporter.email,
          recipient_type: recipientType,
          subject,
          message,
          status: "New",
        },
      ]);

    setSending(false);

    if (error) {
      console.log(error);
      alert("Unable to send message.\n\n" + error.message);
      return;
    }

    alert("Message sent successfully.");

    setSubject("");
    setMessage("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
        <p className="text-2xl font-bold">
          Loading messages...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">

      <div className="bg-white rounded-3xl shadow-xl p-10 mb-8">
        <h1 className="text-5xl font-extrabold mb-3">
          Messages
        </h1>

        <p className="text-xl text-gray-700">
          Contact EPEW administration and support services.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8">

        {/* Send Message */}

        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-3xl font-bold mb-6">
            Send a Message
          </h2>

          <div className="space-y-5">

            <div>
              <label className="font-bold block mb-2">
                Recipient
              </label>

              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="border rounded-2xl p-4 text-lg w-full"
              >
                <option>EPEW Admin</option>
                <option>Assigned Coach</option>
                <option>Technical Support</option>
                <option>Payment Support</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-2">
                Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="border rounded-2xl p-4 text-lg w-full"
              />
            </div>

            <div>
              <label className="font-bold block mb-2">
                Message
              </label>

              <textarea
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border rounded-2xl p-4 text-lg w-full"
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={sending}
              className="bg-green-700 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:bg-[#06245c]"
            >
              {sending ? "Sending..." : "Send Message"}
            </button>

          </div>

        </div>

        {/* Message History */}

        <div className="bg-white rounded-3xl shadow-xl p-10">

          <h2 className="text-3xl font-bold mb-6">
            Message History
          </h2>

          <div className="space-y-5">

            <div className="bg-[#f5f7fb] rounded-2xl p-6">
              <p className="font-bold text-xl mb-2">
                Support Requests
              </p>

              <p className="text-lg text-gray-700">
                Messages sent to EPEW administration will appear here.
              </p>
            </div>

            <div className="bg-[#f5f7fb] rounded-2xl p-6">
              <p className="font-bold text-xl mb-2">
                Coach Communication
              </p>

              <p className="text-lg text-gray-700">
                Future messages from assigned coaches will appear here.
              </p>
            </div>

            <div className="bg-[#f5f7fb] rounded-2xl p-6">
              <p className="font-bold text-xl mb-2">
                Notifications
              </p>

              <p className="text-lg text-gray-700">
                Funding updates and system notifications will appear here.
              </p>
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}