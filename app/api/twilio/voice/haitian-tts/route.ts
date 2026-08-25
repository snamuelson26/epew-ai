import { NextRequest, NextResponse } from "next/server";
import {
  createDecipheriv,
  createHash,
} from "node:crypto";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HaitianTtsPayload = {
  text: string;
  exp: number;
};

function decryptPayload(
  encodedPayload: string
): HaitianTtsPayload {
  const secret = process.env.TWILIO_AUTH_TOKEN;

  if (!secret) {
    throw new Error(
      "TWILIO_AUTH_TOKEN is not configured."
    );
  }

  const encrypted = Buffer.from(
    encodedPayload,
    "base64url"
  );

  const minimumLength = 12 + 16 + 1;

  if (encrypted.length < minimumLength) {
    throw new Error("Invalid encrypted payload.");
  }

  const iv = encrypted.subarray(0, 12);
  const authTag = encrypted.subarray(12, 28);
  const ciphertext = encrypted.subarray(28);

  const key = createHash("sha256")
    .update(secret, "utf8")
    .digest();

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");

  const parsed = JSON.parse(
    plaintext
  ) as Partial<HaitianTtsPayload>;

  if (
    typeof parsed.text !== "string" ||
    !parsed.text.trim() ||
    parsed.text.length > 1200 ||
    typeof parsed.exp !== "number"
  ) {
    throw new Error("Invalid TTS payload.");
  }

  if (Date.now() > parsed.exp) {
    throw new Error("Expired TTS payload.");
  }

  return {
    text: parsed.text,
    exp: parsed.exp,
  };
}

export async function GET(request: NextRequest) {
  try {
    const payload =
      request.nextUrl.searchParams
        .get("payload")
        ?.trim() ?? "";

    if (!payload) {
      return new NextResponse(
        "Invalid request.",
        {
          status: 400,
          headers: {
            "Cache-Control": "private, no-store",
          },
        }
      );
    }

    let text: string;

    try {
      const decrypted =
        decryptPayload(payload);

      text = decrypted.text;
    } catch {
      return new NextResponse(
        "Unauthorized or expired request.",
        {
          status: 401,
          headers: {
            "Cache-Control": "private, no-store",
          },
        }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new NextResponse(
        "OPENAI_API_KEY is not configured.",
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-store",
          },
        }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    const speech =
      await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "marin",
        input: text,
        instructions:
          "Speak in natural Haitian Creole as a native Haitian woman. " +
          "Warm, professional telephone receptionist. " +
          "Clear pronunciation, natural conversational pace, and natural Haitian rhythm. " +
          "When you see EPE W, pronounce it smoothly as one word, the same Haitian pronunciation as epew. " +
          "Do not spell EPE W as separate letters. " +
          "Do not pause between EPE and W. " +
          "Use natural Haitian contractions such as w exactly where written. " +
          "Do not use a French or English accent. " +
          "Read exactly the supplied message without adding anything.",
        response_format: "mp3",
      });

    const audio = Buffer.from(
      await speech.arrayBuffer()
    );

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Haitian dynamic TTS error:",
      error
    );

    return new NextResponse(
      "Unable to generate Haitian speech.",
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  }
}
