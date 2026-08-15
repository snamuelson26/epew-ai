"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type DayAvailability = {
  date: string;
  label: string;
  enabled: boolean;
  from: string;
  until: string;
};

export default function EntrepreneurAvailabilityPage() {
  const searchParams = useSearchParams();
  const applicationId = Number(searchParams.get("applicationId"));

  const [days, setDays] = useState<DayAvailability[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

      setMessage(
        "Thank you. Your availability has been submitted. EPEW will privately compare it with your Personal Coach's schedule and help you find the best appointment."
      );
    } catch {
      setMessage("Unable to submit your availability.");
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
      <h1>Choose Your Best Time</h1>

      <p>
        Tell us when you are available during the next seven
        days. Your Personal Coach&apos;s calendar remains private.
        EPEW will compare your availability with the Coach&apos;s
        schedule and show you the best matching appointment
        options.
      </p>

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
                onChange={(event) =>
                  updateDay(index, {
                    enabled: event.target.checked,
                  })
                }
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
    </main>
  );
}
