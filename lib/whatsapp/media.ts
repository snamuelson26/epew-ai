import OpenAI, { toFile } from "openai";
export function validatedMediaPath(
  raw: string,
  account: string,
  messageSid: string,
) {
  const url = new URL(raw);
  const expected = `/2010-04-01/Accounts/${account}/Messages/${messageSid}/Media/`;
  if (
    url.protocol !== "https:" ||
    url.hostname !== "api.twilio.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    !url.pathname.startsWith(expected) ||
    !/^ME[0-9a-f]{32}$/i.test(url.pathname.slice(expected.length))
  )
    throw new Error("Invalid voice message media");
  return url;
}
export async function transcribeWhatsApp(
  raw: string,
  messageSid: string,
  language: string,
) {
  const account = process.env.TWILIO_ACCOUNT_SID!;
  const url = validatedMediaPath(raw, account, messageSid);
  let response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${account}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
    },
    signal: AbortSignal.timeout(8000),
    redirect: "manual",
  });
  if (response.status >= 300 && response.status < 400) {
    const redirect = new URL(response.headers.get("location") ?? "");
    if (
      redirect.protocol !== "https:" ||
      !(
        redirect.hostname.endsWith(".twiliocdn.com") ||
        redirect.hostname.endsWith(".twilio.com")
      )
    )
      throw new Error("Unexpected media redirect");
    response = await fetch(redirect, {
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
  }
  if (!response.ok) throw new Error("Unable to read voice note");
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("audio/"))
    throw new Error("Please send a voice note or text");
  if (Number(response.headers.get("content-length") ?? 0) > 16 * 1024 * 1024)
    throw new Error("Voice note too large");
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 16 * 1024 * 1024)
    throw new Error("Voice note too large");
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 20000,
    maxRetries: 0,
  });
  const result = await client.audio.transcriptions.create({
    file: await toFile(
      bytes,
      type.includes("ogg")
        ? "voice.ogg"
        : type.includes("mp4")
          ? "voice.m4a"
          : "voice.mp3",
      { type },
    ),
    model: "whisper-1",
    language,
    response_format: "verbose_json",
  });
  return (
    result.segments
      ?.filter((s) => s.no_speech_prob < 0.6 && s.avg_logprob > -1)
      .map((s) => s.text)
      .join(" ")
      .trim() ?? ""
  );
}
