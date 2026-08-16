"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type DayAvailability = {
  date: string;
  label: string;
  enabled: boolean;
  from: string;
  until: string;
};

type AppointmentChoice = {
  id: string;
  proposed_start_at: string;
  reserved_until: string;
  reservation_minutes: number;
};

function EntrepreneurAvailabilityContent() {
  const searchParams = useSearchParams();
  const applicationId = Number(searchParams.get("applicationId"));

  const [days, setDays] = useState<DayAvailability[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectingMatchId, setSelectingMatchId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [appointmentChoices, setAppointmentChoices] =
    useState<AppointmentChoice[]>([]);
  const [schedulingReview, setSchedulingReview] = useState(false);
  const [manualReviewRequired, setManualReviewRequired] = useState(false);

  useEffect(() => {
    const items: DayAvailability[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      items.push({
        date: [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0"),
        ].join("-"),
        label: new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }).format(date),
        enabled: false,
        from: "09:00",
        until: "17:00",
      });
    }

    setDays(items);
  }, []);

  useEffect(() => {
    if (!schedulingReview || !applicationId) {
      return;
    }

    let cancelled = false;

    async function checkSchedulingReview() {
      try {
        const response = await fetch(
          `/api/entrepreneurs/availability?applicationId=${applicationId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (cancelled) return;

        if (!response.ok || !result.success) {
          return;
        }

        if (
          result.status === "matched" &&
          Array.isArray(result.appointmentChoices) &&
          result.appointmentChoices.length > 0
        ) {
          setAppointmentChoices(result.appointmentChoices);
          setSchedulingReview(false);
          setMessage(
            "Good news! EPEW found compatible appointment times for you. Please choose the time that works best below."
          );
          return;
        }

        if (result.status === "manual_review_required") {
          setSchedulingReview(false);
          setManualReviewRequired(true);
          setAppointmentChoices([]);
          setMessage(
            "Your Scheduling Review is complete. EPEW was not able to confirm a compatible appointment within the automated review period. You may keep your current availability for continued review or choose different days."
          );
          return;
        }

        if (result.status === "scheduled") {
          setSchedulingReview(false);
        }
      } catch {
        // Keep the review active and try again on the next interval.
      }
    }

    checkSchedulingReview();

    const interval = window.setInterval(
      checkSchedulingReview,
      30000
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [schedulingReview, applicationId]);

  function updateDay(
    index: number,
    changes: Partial<DayAvailability>
  ) {
    setDays((current) =>
      current.map((day, i) =>
        i === index ? { ...day, ...changes } : day
      )
    );
  }

  async function submitAvailability() {
    const selected = days.filter((day) => day.enabled);

    if (!applicationId) {
      setMessage("Application information is missing.");
      return;
    }

    if (selected.length === 0) {
      setMessage("Please choose at least one available day.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const participantTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "America/New_York";

      const response = await fetch(
        "/api/entrepreneurs/availability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId,
            participantTimezone,
            windows: selected.map((day) => ({
              availableDate: day.date,
              availableFrom: day.from,
              availableUntil: day.until,
              isOvernight: day.until <= day.from,
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(
          result.message ||
            "Unable to submit your availability."
        );
        return;
      }

      setAppointmentChoices(result.appointmentChoices ?? []);
      setManualReviewRequired(false);

      if (result.status === "scheduling_review") {
        setSchedulingReview(true);
        setMessage(
          "We’re Finding the Best Appointment for You — Your preferred times have been received. EPEW is privately reviewing Personal Coach availability to find the best compatible appointment for you. Please allow approximately 5–15 minutes. You do not need to submit your availability again."
        );
      } else if (result.matchCount > 0) {
        setSchedulingReview(false);
        setMessage(
          "We found appointment times that work for both you and your Personal Coach. Please choose one below."
        );
      } else {
        setSchedulingReview(false);
        setMessage(
          result.message || "Your availability has been submitted."
        );
      }
    } catch {
      setMessage("Unable to submit your availability.");
    } finally {
      setSaving(false);
    }
  }

  function chooseDifferentDays() {
    setManualReviewRequired(false);
    setSchedulingReview(false);
    setAppointmentChoices([]);
    setMessage(
      "Please choose up to 3 different days during the next 7 days and submit your availability again."
    );

    setDays((current) =>
      current.map((day) => ({
        ...day,
        enabled: false,
      }))
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function selectAppointment(matchId: string) {
    if (!applicationId) {
      setMessage("Application information is missing.");
      return;
    }

    setSelectingMatchId(matchId);
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
            matchId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(
          result.message ||
            "Unable to schedule this appointment."
        );
        return;
      }

      setAppointmentChoices([]);

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

      setMessage(
        `Your Establishment Meeting has been rescheduled for ${formatted}. A confirmation with your Zoom information has been sent to you.`
      );
    } catch {
      setMessage(
        "Unable to schedule this appointment."
      );
    } finally {
      setSelectingMatchId(null);
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
          src="/images/epew-logo.png"
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
          Choose Your Best Time
        </h1>

        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            marginBottom: 10,
          }}
        >
          Help us find the best time for your Establishment
          Meeting. Select up to <strong>3 days</strong> during
          the next 7 days and tell us when you are available.
        </p>

        <p style={{ lineHeight: 1.6, margin: 0 }}>
          Your Personal Coach&apos;s calendar remains private.
          EPEW will compare your availability with the
          Coach&apos;s schedule and present only appointment
          times that work for both of you.
        </p>
      </header>

      <div style={{ marginTop: 30 }}>
        {days.map((day, index) => (
          <div
            key={day.date}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                fontWeight: 700,
              }}
            >
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(event) => {
                  const checked = event.target.checked;

                  if (
                    checked &&
                    days.filter((item) => item.enabled).length >= 3
                  ) {
                    setMessage(
                      "Please select no more than 3 days during the 7-day availability window."
                    );
                    return;
                  }

                  setMessage("");

                  updateDay(index, {
                    enabled: checked,
                  });
                }}
              />
              {day.label}
            </label>

            {day.enabled && (
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 14,
                  flexWrap: "wrap",
                }}
              >
                <label>
                  Available from
                  <br />
                  <input
                    type="time"
                    value={day.from}
                    onChange={(event) =>
                      updateDay(index, {
                        from: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Available until
                  <br />
                  <input
                    type="time"
                    value={day.until}
                    onChange={(event) =>
                      updateDay(index, {
                        until: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={submitAvailability}
        style={{
          marginTop: 20,
          padding: "14px 24px",
          fontSize: 16,
          cursor: saving ? "default" : "pointer",
        }}
      >
        {saving ? "Submitting..." : "Submit My Availability"}
      </button>

      {message && (
        <p style={{ marginTop: 20, fontWeight: 600 }}>
          {message}
        </p>
      )}

      {manualReviewRequired && (
        <section
          style={{
            marginTop: 28,
            padding: 24,
            border: "1px solid #ddd",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            More Scheduling Options
          </h2>

          <p style={{ lineHeight: 1.7 }}>
            We were not able to confirm a compatible appointment
            during the automated Scheduling Review.
          </p>

          <p style={{ lineHeight: 1.7 }}>
            You may keep your current availability so EPEW can
            continue reviewing it, or choose up to 3 different days
            during the next 7 days.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={chooseDifferentDays}
              style={{
                padding: "12px 18px",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Choose Different Days
            </button>

            <button
              type="button"
              onClick={() => {
                setManualReviewRequired(false);
                setMessage(
                  "Your current availability remains active. EPEW will continue the scheduling review. You do not need to submit anything else at this time."
                );
              }}
              style={{
                padding: "12px 18px",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Keep My Availability
            </button>
          </div>
        </section>
      )}

      {schedulingReview && (
        <section
          style={{
            marginTop: 28,
            padding: 24,
            border: "1px solid #ddd",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            We’re Finding the Best Appointment for You
          </h2>

          <p style={{ lineHeight: 1.7, marginBottom: 10 }}>
            Your preferred times have been received. EPEW is
            privately reviewing Personal Coach availability to
            find the best compatible appointment for you.
          </p>

          <p style={{ lineHeight: 1.7, marginBottom: 0 }}>
            Please allow approximately <strong>5–15 minutes</strong>.
            This page will check automatically. You do not need to
            submit your availability again.
          </p>
        </section>
      )}

      {appointmentChoices.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2>Matching Appointment Times</h2>

          <p>
            These times work with both your availability and your
            Personal Coach&apos;s private schedule. Your Coach&apos;s full
            calendar remains private.
          </p>

          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 18,
            }}
          >
            {appointmentChoices.map((choice) => {
              const start = new Date(
                choice.proposed_start_at
              );

              const label = new Intl.DateTimeFormat(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                }
              ).format(start);

              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={
                    selectingMatchId !== null
                  }
                  onClick={() =>
                    selectAppointment(choice.id)
                  }
                  style={{
                    padding: "16px 18px",
                    textAlign: "left",
                    fontSize: 16,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    cursor:
                      selectingMatchId !== null
                        ? "default"
                        : "pointer",
                  }}
                >
                  {selectingMatchId === choice.id
                    ? "Scheduling..."
                    : label}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}


export default function EntrepreneurAvailabilityPage() {
  return (
    <Suspense fallback={<main style={{ padding: 40 }}>Loading availability...</main>}>
      <EntrepreneurAvailabilityContent />
    </Suspense>
  );
}
