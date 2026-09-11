"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type SchedulingMode = "loading" | "prequalification" | "establishment";

function EntrepreneurAvailabilityContent() {
  const searchParams = useSearchParams();
  const applicationId = Number(searchParams.get("applicationId"));

  const [mode, setMode] = useState<SchedulingMode>("loading");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [meetingProvider, setMeetingProvider] = useState<"phone" | "whatsapp" | "zoom">("phone");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [minimumDate, setMinimumDate] = useState("");
  const [maximumDate, setMaximumDate] = useState("");

  useEffect(() => {
    const firstAvailableDate = new Date();
    const lastDay = new Date(firstAvailableDate);
    lastDay.setDate(lastDay.getDate() + 6);

    function formatDate(date: Date) {
      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
    }

    setMinimumDate(formatDate(firstAvailableDate));
    setMaximumDate(formatDate(lastDay));
  }, []);

  useEffect(() => {
    if (!applicationId) {
      setMode("prequalification");
      return;
    }

    let cancelled = false;

    async function determineMode() {
      try {
        const response = await fetch(
          `/api/entrepreneurs/appointment?applicationId=${encodeURIComponent(String(applicationId))}`,
          { credentials: "include", cache: "no-store" },
        );
        const result = await response.json();
        if (cancelled) return;

        // A real coach-meeting record means the entrepreneur is scheduling
        // or changing an Establishment Meeting. No meeting record means this
        // applicant is still at the Pre-Qualification Interview stage.
        setMode(result?.appointment ? "establishment" : "prequalification");
      } catch {
        if (!cancelled) setMode("prequalification");
      }
    }

    void determineMode();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  async function scheduleAppointment() {
    if (!applicationId) {
      setSuccess(false);
      setMessage("Application information is missing.");
      return;
    }
    if (!appointmentDate || !appointmentTime) {
      setSuccess(false);
      setMessage("Please choose both the date and time for your appointment.");
      return;
    }

    const requestedDate = new Date(`${appointmentDate}T${appointmentTime}`);
    if (Number.isNaN(requestedDate.getTime()) || requestedDate <= new Date()) {
      setSuccess(false);
      setMessage("Please choose a valid appointment date and time in the future.");
      return;
    }

    setSaving(true);
    setSuccess(false);
    setMessage("");

    try {
      const endpoint =
        mode === "prequalification"
          ? "/api/entrepreneurs/prequalification/availability/select"
          : "/api/entrepreneurs/availability/select";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          requestedStartAt: requestedDate.toISOString(),
          meetingProvider: mode === "prequalification" ? "phone" : meetingProvider,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setSuccess(false);
        setMessage(result.message || "That appointment could not be scheduled. Please try again.");
        return;
      }

      const scheduledDate = new Date(result.appointment.scheduledAt);
      const formatted = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(scheduledDate);

      setSuccess(true);
      setMessage(
        mode === "prequalification"
          ? `Your EPEW Pre-Qualification Interview is scheduled for ${formatted}.`
          : `Your EPEW Establishment Meeting is scheduled for ${formatted}.`,
      );
    } catch {
      setSuccess(false);
      setMessage("Unable to schedule your appointment right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (mode === "loading") {
    return <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>Loading appointment scheduling...</main>;
  }

  const isPreQualification = mode === "prequalification";
  const title = isPreQualification ? "Pre-Qualification Interview" : "Establishment Meeting";

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px", fontFamily: "Arial, sans-serif" }}>
      <header style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid #ddd", textAlign: "center" }}>
        <img
          src="/images/epew-ede-ibos-logo.png"
          alt="EPEW EDE IBOS Platform"
          style={{ width: "100%", maxWidth: 340, height: "auto", margin: "0 auto 20px", display: "block", borderRadius: 12 }}
        />
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, letterSpacing: "0.08em" }}>
          EPEW {title.toUpperCase()}
        </p>
        <h1 style={{ marginBottom: 12 }}>Choose Your Appointment</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 10 }}>
          {isPreQualification
            ? "Choose a convenient date and time for your EPEW Pre-Qualification Interview."
            : "Choose the exact date and time you would like for your Establishment Meeting."}
        </p>
        {isPreQualification && (
          <p style={{ lineHeight: 1.6, margin: 0 }}>
            Your EPEW Coach Assistant will call your registered phone number at the scheduled time.
          </p>
        )}
        <a
          href={`/entrepreneurs/dashboard?applicationId=${encodeURIComponent(String(applicationId))}`}
          style={{ display: "inline-flex", marginTop: 22, alignItems: "center", justifyContent: "center", borderRadius: 10, background: "#10246f", color: "#ffffff", padding: "12px 20px", fontWeight: 800, textDecoration: "none" }}
        >
          Back to Entrepreneur Portal
        </a>
      </header>

      <section style={{ border: "1px solid #ddd", borderRadius: 14, padding: 24, marginTop: 28 }}>
        <h2 style={{ marginTop: 0 }}>Select Your Date and Time</h2>
        <p style={{ lineHeight: 1.6, marginBottom: 24 }}>
          Appointments may be selected during the next 7 days.
        </p>

        <div style={{ display: "grid", gap: 22 }}>
          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            Meeting Method
            {isPreQualification ? (
              <div style={{ padding: "13px 14px", fontSize: 17, border: "1px solid #bbb", borderRadius: 8, background: "#f8fafc" }}>
                Phone Call
              </div>
            ) : (
              <select
                value={meetingProvider}
                onChange={(event) => setMeetingProvider(event.target.value as "phone" | "whatsapp" | "zoom")}
                style={{ padding: "13px 14px", fontSize: 17, border: "1px solid #bbb", borderRadius: 8, background: "#ffffff" }}
              >
                <option value="phone">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="zoom">Zoom</option>
              </select>
            )}
          </label>

          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            Desired Appointment Date
            <input
              type="date"
              value={appointmentDate}
              min={minimumDate}
              max={maximumDate}
              onChange={(event) => {
                setAppointmentDate(event.target.value);
                setMessage("");
                setSuccess(false);
              }}
              style={{ padding: "13px 14px", fontSize: 17, border: "1px solid #bbb", borderRadius: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
            Desired Start Time
            <select
              value={appointmentTime}
              onChange={(event) => {
                setAppointmentTime(event.target.value);
                setMessage("");
                setSuccess(false);
              }}
              style={{ padding: "13px 14px", fontSize: 17, border: "1px solid #bbb", borderRadius: 8, background: "#ffffff" }}
            >
              <option value="">Choose a start time</option>
              {Array.from({ length: 288 }, (_, index) => {
                const totalMinutes = index * 5;
                const hour24 = Math.floor(totalMinutes / 60);
                const minute = String(totalMinutes % 60).padStart(2, "0");
                const value = `${String(hour24).padStart(2, "0")}:${minute}`;
                const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                const period = hour24 < 12 ? "AM" : "PM";
                return <option key={value} value={value}>{hour12}:{minute} {period}</option>;
              })}
            </select>
          </label>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={scheduleAppointment}
          style={{ width: "100%", marginTop: 28, padding: "15px 24px", fontSize: 17, fontWeight: 800, border: 0, borderRadius: 10, background: saving ? "#777" : "#10246f", color: "#ffffff", cursor: saving ? "default" : "pointer" }}
        >
          {saving
            ? "Scheduling..."
            : isPreQualification
              ? "Schedule My Pre-Qualification Interview"
              : "Schedule My Appointment"}
        </button>
      </section>

      {message && (
        <section style={{ marginTop: 24, padding: 22, borderRadius: 12, border: success ? "1px solid #078443" : "1px solid #c58a00", background: success ? "#f1fff6" : "#fffaf0" }}>
          <h2 style={{ marginTop: 0, marginBottom: 10 }}>
            {success ? "Your Appointment Is Confirmed" : "Appointment Not Confirmed"}
          </h2>
          <p style={{ margin: 0, lineHeight: 1.7, fontWeight: 600 }}>{message}</p>
          {success && (
            <a
              href={`/entrepreneurs/dashboard?applicationId=${encodeURIComponent(String(applicationId))}`}
              style={{ display: "inline-flex", marginTop: 18, alignItems: "center", justifyContent: "center", borderRadius: 10, background: "#078443", color: "#ffffff", padding: "12px 20px", fontWeight: 800, textDecoration: "none" }}
            >
              Return to My Dashboard
            </a>
          )}
        </section>
      )}
    </main>
  );
}

export default function EntrepreneurAvailabilityPage() {
  return (
    <Suspense fallback={<main style={{ padding: 40 }}>Loading appointment scheduling...</main>}>
      <EntrepreneurAvailabilityContent />
    </Suspense>
  );
}
