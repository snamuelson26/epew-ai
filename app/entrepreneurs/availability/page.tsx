"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function EntrepreneurAvailabilityContent() {
  const searchParams = useSearchParams();
  const applicationId = Number(searchParams.get("applicationId"));

  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [minimumDate, setMinimumDate] = useState("");
  const [maximumDate, setMaximumDate] = useState("");

  useEffect(() => {
    const isSamuelFoodFansEarlyAccess = applicationId === 27;

    const firstAvailableDate = isSamuelFoodFansEarlyAccess
      ? new Date()
      : new Date(2026, 7, 18);

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
  }, [applicationId]);

  async function scheduleAppointment() {
    if (!applicationId) {
      setSuccess(false);
      setMessage("Application information is missing.");
      return;
    }

    if (!appointmentDate) {
      setSuccess(false);
      setMessage("Please choose the date you want for your appointment.");
      return;
    }

    if (!appointmentTime) {
      setSuccess(false);
      setMessage("Please choose the time you want for your appointment.");
      return;
    }

    const requestedDate = new Date(
      `${appointmentDate}T${appointmentTime}`
    );

    if (Number.isNaN(requestedDate.getTime())) {
      setSuccess(false);
      setMessage("Please choose a valid appointment date and time.");
      return;
    }

    if (requestedDate <= new Date()) {
      setSuccess(false);
      setMessage(
        "Please choose an appointment date and time in the future."
      );
      return;
    }

    setSaving(true);
    setSuccess(false);
    setMessage("");

    try {
      const response = await fetch(
        "/api/entrepreneurs/availability/select",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId,
            requestedStartAt: requestedDate.toISOString(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setSuccess(false);
        setMessage(
          result.message ||
            "That date and time is not available. Please choose another date or time."
        );
        return;
      }

      const scheduledDate = new Date(
        result.appointment.scheduledAt
      );

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
        `Your appointment is approved. Your EPEW Establishment Meeting is scheduled for ${formatted}. A confirmation with your meeting information has been sent to you.`
      );
    } catch {
      setSuccess(false);
      setMessage(
        "Unable to schedule your appointment right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: "1px solid #ddd",
          textAlign: "center",
        }}
      >
        <img
          src="/images/epew-ede-ibos-logo.png"
          alt="EPEW EDE IBOS Platform"
          style={{
            width: "100%",
            maxWidth: 360,
            height: "auto",
            margin: "0 auto 20px",
            display: "block",
            borderRadius: 12,
          }}
        />

        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "0.08em",
          }}
        >
          EPEW ESTABLISHMENT MEETING
        </p>

        <h1 style={{ marginBottom: 12 }}>
          Choose Your Appointment
        </h1>

        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            marginBottom: 10,
          }}
        >
          Choose the exact date and time you would like for your
          Establishment Meeting.
        </p>

        <p style={{ lineHeight: 1.6, margin: 0 }}>
          EPEW will automatically check your Personal Coach&apos;s
          availability. If the requested 60-minute appointment period
          is available, your appointment will be approved and scheduled
          immediately.
        </p>

        <a
          href="/entrepreneurs/dashboard"
          style={{
            display: "inline-flex",
            marginTop: 22,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            background: "#10246f",
            color: "#ffffff",
            padding: "12px 20px",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Back to Entrepreneur Portal
        </a>
      </header>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 14,
          padding: 24,
          marginTop: 28,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Select Your Date and Time
        </h2>

        <p
          style={{
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Appointments may be selected during the next 7 days.
          Each Establishment Meeting reserves up to 60 minutes.
        </p>

        <div
          style={{
            display: "grid",
            gap: 22,
          }}
        >
          <label
            style={{
              display: "grid",
              gap: 8,
              fontWeight: 700,
            }}
          >
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
              style={{
                padding: "13px 14px",
                fontSize: 17,
                border: "1px solid #bbb",
                borderRadius: 8,
              }}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 8,
              fontWeight: 700,
            }}
          >
            Desired Start Time
            <select
              value={appointmentTime}
              onChange={(event) => {
                setAppointmentTime(event.target.value);
                setMessage("");
                setSuccess(false);
              }}
              style={{
                padding: "13px 14px",
                fontSize: 17,
                border: "1px solid #bbb",
                borderRadius: 8,
                background: "#ffffff",
              }}
            >
              <option value="">Choose a start time</option>

              {Array.from({ length: 48 }, (_, index) => {
                const isSamuelFoodFansEarlyAccess = applicationId === 27;
                const isOfficialOpeningDay =
                  appointmentDate === "2026-08-18";

                if (
                  !isSamuelFoodFansEarlyAccess &&
                  isOfficialOpeningDay &&
                  index < 26
                ) {
                  return null;
                }

                const hour24 = Math.floor(index / 2);
                const minute = index % 2 === 0 ? "00" : "30";

                const value =
                  `${String(hour24).padStart(2, "0")}:${minute}`;

                const hour12 =
                  hour24 === 0
                    ? 12
                    : hour24 > 12
                    ? hour24 - 12
                    : hour24;

                const period = hour24 < 12 ? "AM" : "PM";

                return (
                  <option key={value} value={value}>
                    {hour12}:{minute} {period}
                  </option>
                );
              })}
            </select>
          </label>
        </div>

        <p
          style={{
            marginTop: 20,
            marginBottom: 0,
            lineHeight: 1.6,
            color: "#555",
          }}
        >
          Your Personal Coach&apos;s calendar remains private.
          EPEW checks only whether your requested appointment period
          is available.
        </p>

        <button
          type="button"
          disabled={saving}
          onClick={scheduleAppointment}
          style={{
            width: "100%",
            marginTop: 28,
            padding: "15px 24px",
            fontSize: 17,
            fontWeight: 800,
            border: 0,
            borderRadius: 10,
            background: saving ? "#777" : "#10246f",
            color: "#ffffff",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving
            ? "Checking Availability..."
            : "Schedule My Appointment"}
        </button>
      </section>

      {message && (
        <section
          style={{
            marginTop: 24,
            padding: 22,
            borderRadius: 12,
            border: success
              ? "1px solid #078443"
              : "1px solid #c58a00",
            background: success
              ? "#f1fff6"
              : "#fffaf0",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 10,
            }}
          >
            {success
              ? "Your Appointment Is Confirmed"
              : "Appointment Not Confirmed"}
          </h2>

          <p
            style={{
              margin: 0,
              lineHeight: 1.7,
              fontWeight: 600,
            }}
          >
            {message}
          </p>

          {success ? (
            <a
              href="/entrepreneurs/dashboard"
              style={{
                display: "inline-flex",
                marginTop: 18,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                background: "#078443",
                color: "#ffffff",
                padding: "12px 20px",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Return to My Dashboard
            </a>
          ) : (
            <p
              style={{
                marginTop: 14,
                marginBottom: 0,
                lineHeight: 1.6,
              }}
            >
              Please choose another date or time and try again.
            </p>
          )}
        </section>
      )}
    </main>
  );
}

export default function EntrepreneurAvailabilityPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 40 }}>
          Loading appointment scheduling...
        </main>
      }
    >
      <EntrepreneurAvailabilityContent />
    </Suspense>
  );
}
