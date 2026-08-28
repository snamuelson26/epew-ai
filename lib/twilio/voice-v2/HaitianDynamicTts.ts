import {
  createCipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

export function haitianDynamicTtsUrl(
  publicBaseUrl: string,
  text: string
) {
  const secret =
    requireEnvironment("TWILIO_AUTH_TOKEN");

  if (!text || text.length > 1200) {
    throw new Error(
      "Invalid Haitian TTS text."
    );
  }

  const key = createHash("sha256")
    .update(secret, "utf8")
    .digest();

  const iv = randomBytes(12);

  const cipher = createCipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  const plaintext = JSON.stringify({
    text,
    exp:
      Date.now() +
      10 * 60 * 1000,
  });

  const ciphertext = Buffer.concat([
    cipher.update(
      plaintext,
      "utf8"
    ),
    cipher.final(),
  ]);

  const authTag =
    cipher.getAuthTag();

  const payload = Buffer.concat([
    iv,
    authTag,
    ciphertext,
  ]).toString("base64url");

  const params =
    new URLSearchParams({
      payload,
    });

  const base =
    publicBaseUrl.replace(
      /\/+$/,
      ""
    );

  return (
    `${base}/api/twilio/voice/` +
    `haitian-tts?${params.toString()}`
  );
}

export function formatHaitianAppointmentTime(
  iso: string
) {
  const date = new Date(iso);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid appointment time."
    );
  }

  const timeZone =
    "America/New_York";

  const weekday =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        weekday: "short",
      }
    ).format(date);

  const weekdays:
    Record<string, string> = {
      Sun: "Dimanch",
      Mon: "Lendi",
      Tue: "Madi",
      Wed: "Mèkredi",
      Thu: "Jedi",
      Fri: "Vandredi",
      Sat: "Samdi",
    };

  const dateParts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        month: "numeric",
        day: "numeric",
      }
    ).formatToParts(date);

  const month = Number(
    dateParts.find(
      (part) =>
        part.type === "month"
    )?.value ?? "1"
  );

  const day = Number(
    dateParts.find(
      (part) =>
        part.type === "day"
    )?.value ?? "1"
  );

  const months = [
    "",
    "janvye",
    "fevriye",
    "mas",
    "avril",
    "me",
    "jen",
    "jiyè",
    "out",
    "septanm",
    "oktòb",
    "novanm",
    "desanm",
  ];

  const timeParts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    ).formatToParts(date);

  const hour = Number(
    timeParts.find(
      (part) =>
        part.type === "hour"
    )?.value ?? "12"
  );

  const minute =
    timeParts.find(
      (part) =>
        part.type === "minute"
    )?.value ?? "00";

  const ampm =
    timeParts.find(
      (part) =>
        part.type ===
        "dayPeriod"
    )?.value ?? "AM";

  const period =
    ampm === "AM"
      ? "nan maten"
      : hour === 12 ||
          hour < 6
      ? "nan apremidi"
      : "nan aswè";

  const spokenTime =
    minute === "00"
      ? `${hour} zè ${period}`
      : `${hour} zè ${minute} ${period}`;

  return (
    `${weekdays[weekday]} ` +
    `${day} ${months[month]}, ` +
    spokenTime
  );
}
