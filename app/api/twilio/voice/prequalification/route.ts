import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";

const TOPICS = [
  "identity_business",
  "business_understanding",
  "current_condition",
  "readiness",
  "financial_need",
  "support_readiness",
  "obstacles_risks",
  "commitment",
] as const;

type InterviewTopic = (typeof TOPICS)[number];

type InterviewMessage = {
  role: "coach" | "entrepreneur";
  content: string;
  at: string;
};

type ConversationState = {
  source: "phone_prequalification_conversation_v2";
  started_at: string;
  completed_at?: string;
  current_topic: InterviewTopic;
  covered_topics: InterviewTopic[];
  messages: InterviewMessage[];
  turn_count: number;
  summary?: string;
};

type InterviewDecision = {
  reply: string;
  current_topic: InterviewTopic;
  covered_topics: InterviewTopic[];
  complete: boolean;
  summary: string;
};

function twimlResponse(response: twilio.twiml.VoiceResponse, status = 200) {
  return new NextResponse(response.toString(), {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}

function voice() {
  return {
    voice: "Polly.Matthew",
    language: "en-US",
  } as const;
}

function isTopic(value: unknown): value is InterviewTopic {
  return TOPICS.includes(String(value ?? "") as InterviewTopic);
}

function uniqueTopics(values: unknown): InterviewTopic[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter(isTopic)));
}

function parseState(value: unknown): ConversationState | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value) as Partial<ConversationState>;
    if (
      parsed.source === "phone_prequalification_conversation_v2" &&
      typeof parsed.started_at === "string" &&
      isTopic(parsed.current_topic) &&
      Array.isArray(parsed.messages)
    ) {
      return {
        source: "phone_prequalification_conversation_v2",
        started_at: parsed.started_at,
        completed_at: parsed.completed_at,
        current_topic: parsed.current_topic,
        covered_topics: uniqueTopics(parsed.covered_topics),
        messages: parsed.messages
          .filter(
            (message): message is InterviewMessage =>
              Boolean(
                message &&
                  typeof message === "object" &&
                  (message.role === "coach" || message.role === "entrepreneur") &&
                  typeof message.content === "string"
              )
          )
          .slice(-40),
        turn_count: Number(parsed.turn_count ?? 0) || 0,
        summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function newState(): ConversationState {
  return {
    source: "phone_prequalification_conversation_v2",
    started_at: new Date().toISOString(),
    current_topic: "identity_business",
    covered_topics: [],
    messages: [],
    turn_count: 0,
  };
}

async function loadApplication(applicationId: number) {
  const { data, error } = await supabaseAdmin
    .from("entrepreneur_applications")
    .select(`
      id,
      full_name,
      business_name,
      business_type,
      business_category,
      business_description,
      funding_request,
      city,
      state,
      professional_qualification,
      questionnaire_answers,
      questionnaire_status,
      qualification_status,
      interview_status,
      interview_type,
      interview_notes,
      assigned_coach_name
    `)
    .eq("id", applicationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string") return payload.output_text.trim();

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const pieces: string[] = [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string" && part.text.trim()) {
        pieces.push(part.text.trim());
      }
    }
  }

  return pieces.join("\n").trim();
}

function extractJsonObject(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!cleaned) return "";
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) return cleaned;

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) return cleaned.slice(first, last + 1);

  return cleaned;
}

function parseDecision(text: string, state: ConversationState): InterviewDecision | null {
  try {
    const parsed = JSON.parse(extractJsonObject(text)) as Partial<InterviewDecision>;
    const reply = String(parsed.reply ?? "").trim();
    if (!reply) return null;

    return {
      reply,
      current_topic: isTopic(parsed.current_topic)
        ? parsed.current_topic
        : state.current_topic,
      covered_topics: uniqueTopics(parsed.covered_topics),
      complete: Boolean(parsed.complete),
      summary: String(parsed.summary ?? state.summary ?? "").trim(),
    };
  } catch {
    return null;
  }
}

function asksWhatToClarify(speech: string) {
  const normalized = speech.toLowerCase();
  return [
    "what should i explain",
    "what do you want me to explain",
    "what should i clarify",
    "what do you mean",
    "which part",
    "what part",
  ].some((phrase) => normalized.includes(phrase));
}

function topicClarification(topic: InterviewTopic, speech = "") {
  const prefix = asksWhatToClarify(speech)
    ? "Sure. Here is the specific part I want you to explain. "
    : "I want to make sure I understand the specific point. ";

  switch (topic) {
    case "identity_business":
      return `${prefix}Please confirm the business you are applying with and your role in it.`;
    case "business_understanding":
      return `${prefix}Tell me what the business will actually sell or provide, and who the main customers will be.`;
    case "current_condition":
      return `${prefix}Tell me what is already completed today and what is still missing before the business can operate.`;
    case "readiness":
      return `${prefix}Tell me the most important step you personally still need to complete before you are ready to move forward.`;
    case "financial_need":
      return `${prefix}Tell me how much support you need and the main things that money would pay for.`;
    case "support_readiness":
      return `${prefix}Tell me how you plan to approach potential supporters and work toward the required twenty support units.`;
    case "obstacles_risks":
      return `${prefix}Tell me the biggest issue that could delay the business or prevent it from opening as planned.`;
    case "commitment":
      return `${prefix}Tell me what you are personally prepared to do, consistently, to make this business succeed.`;
  }
}

async function runConversationTurn(
  application: any,
  state: ConversationState,
  entrepreneurSpeech: string
): Promise<InterviewDecision> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      reply: topicClarification(state.current_topic, entrepreneurSpeech),
      current_topic: state.current_topic,
      covered_topics: state.covered_topics,
      complete: false,
      summary: state.summary ?? "",
    };
  }

  const recentConversation = state.messages
    .slice(-24)
    .map((message) => `${message.role === "coach" ? "DANIEL" : "ENTREPRENEUR"}: ${message.content}`)
    .join("\n");

  const applicationContext = {
    applicant_name: application.full_name,
    business_name: application.business_name,
    business_type: application.business_type,
    business_category: application.business_category,
    business_description: application.business_description,
    funding_request: application.funding_request,
    city: application.city,
    state: application.state,
    professional_qualification: application.professional_qualification,
    questionnaire_answers: application.questionnaire_answers,
  };

  const prompt = `
You are Daniel Pierre, the EPEW Personal Coach conducting a LIVE telephone PRE-QUALIFICATION INTERVIEW with an entrepreneur.

This must feel like a real professional conversation, NOT a questionnaire and NOT a sequence of scripted questions.

GOAL
Understand whether the entrepreneur is sufficiently prepared to move forward for qualification review. You do not approve or reject the applicant. The final qualification decision remains Pending Review.

APPLICATION AND QUESTIONNAIRE CONTEXT
${JSON.stringify(applicationContext, null, 2)}

QUALIFICATION AREAS
- identity_business: who the entrepreneur is and confirmation of the business
- business_understanding: what is being built, customers, product/service and business model
- current_condition: what already exists, what has been completed, and what is missing
- readiness: practical ability and preparation to move forward
- financial_need: amount requested and realistic planned use
- support_readiness: willingness and ability to build community support toward the required 20 units
- obstacles_risks: barriers, missing requirements, risks or contradictions
- commitment: personal commitment, accountability and follow-through

CURRENT STATE
Current topic: ${state.current_topic}
Covered topics: ${state.covered_topics.join(", ") || "none"}
Turn count: ${state.turn_count}
Prior summary: ${state.summary ?? "none"}

RECENT CONVERSATION
${recentConversation}

INTERVIEW BEHAVIOR
1. Listen to the entrepreneur's actual meaning and respond to it.
2. Briefly acknowledge the substance of the answer when useful.
3. If the answer is vague or incomplete, ask a SPECIFIC follow-up tied to what the entrepreneur just said. Never use a generic request such as "explain that more clearly" without naming the detail you need.
4. If the entrepreneur asks "what should I explain?", "what do you mean?", "which part?", or similar, answer that question directly by stating exactly which detail you want clarified. Do not repeat your previous sentence.
5. Never repeat the same clarification wording twice in a row. Rephrase and become more specific.
6. Do not move to a new area merely because audio was detected.
7. If several areas were answered meaningfully in one response, mark each of them covered.
8. Use application/questionnaire facts so you do not ask blindly for information already known.
9. Ask ONE principal question at a time.
10. Keep spoken responses conversational and normally under 55 words.
11. Do not lecture, sell EPEW, or make a qualification decision.
12. Never say approved, qualified, denied, or rejected.
13. Only complete when all major areas contain meaningful information.
14. If the entrepreneur asks a relevant question, answer it briefly and then return naturally to the interview.
15. Treat ordinary thinking pauses, filler words, and self-corrections as part of the entrepreneur's answer, not as a reason to advance.

Return ONLY valid JSON:
{
  "reply": "what Daniel should say next",
  "current_topic": "one allowed topic ID",
  "covered_topics": ["topic IDs genuinely covered so far"],
  "complete": false,
  "summary": "short cumulative factual interview summary"
}
  `.trim();

  const model =
    process.env.EPEW_INTERVIEW_MODEL?.trim() ||
    process.env.OPENAI_TEXT_MODEL?.trim() ||
    "gpt-5-mini";

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: 700,
    }),
  });

  if (!apiResponse.ok) {
    const details = await apiResponse.text();
    console.error("EPEW prequalification conversation model error:", apiResponse.status, details);
    return {
      reply: topicClarification(state.current_topic, entrepreneurSpeech),
      current_topic: state.current_topic,
      covered_topics: state.covered_topics,
      complete: false,
      summary: state.summary ?? "",
    };
  }

  const payload = await apiResponse.json();
  const outputText = extractOutputText(payload);
  const decision = parseDecision(outputText, state);

  if (!decision) {
    console.error("EPEW prequalification conversation parse failure:", outputText);
    return {
      reply: topicClarification(state.current_topic, entrepreneurSpeech),
      current_topic: state.current_topic,
      covered_topics: state.covered_topics,
      complete: false,
      summary: state.summary ?? "",
    };
  }

  return decision;
}

async function saveState(applicationId: number, state: ConversationState, completed: boolean) {
  const update: Record<string, unknown> = {
    interview_notes: JSON.stringify(state),
    interview_type: "phone",
    interview_status: completed ? "Completed" : "In Progress",
    review_status: completed ? "Interview Completed" : "Interview In Progress",
  };

  if (completed) {
    update.qualification_status = "Pending Review";
    update.application_decision = "Pending";
  }

  const { error } = await supabaseAdmin
    .from("entrepreneur_applications")
    .update(update)
    .eq("id", applicationId);

  if (error) throw error;
}

function gatherNext(
  response: twilio.twiml.VoiceResponse,
  origin: string,
  applicationId: number,
  prompt: string
) {
  const gather = response.gather({
    input: ["speech"],
    action: `${origin}/api/twilio/voice/prequalification?applicationId=${encodeURIComponent(
      String(applicationId)
    )}&mode=conversation`,
    method: "POST",
    timeout: 20,
    speechTimeout: "3",
    actionOnEmptyResult: true,
  });

  gather.say(voice(), prompt);
}

export async function POST(request: NextRequest) {
  try {
    const { valid, params } = await validateTwilioWebhook(request);
    const response = new twilio.twiml.VoiceResponse();

    if (!valid) {
      response.say(voice(), "This request could not be verified.");
      return twimlResponse(response, 403);
    }

    const url = new URL(request.url);
    const applicationId = Number(url.searchParams.get("applicationId"));
    const speech = String(params.SpeechResult ?? "").trim();

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      response.say(voice(), "This EPEW pre-qualification interview could not be identified.");
      return twimlResponse(response, 400);
    }

    const application = await loadApplication(applicationId);

    if (!application) {
      response.say(voice(), "We could not find this EPEW entrepreneur application.");
      return twimlResponse(response, 404);
    }

    if (String(application.questionnaire_status ?? "").toLowerCase() !== "completed") {
      response.say(
        voice(),
        "Your entrepreneur questionnaire must be completed before the pre-qualification interview can begin."
      );
      return twimlResponse(response, 409);
    }

    const state = parseState(application.interview_notes) ?? newState();

    if (state.messages.length === 0 && !speech) {
      const opening = `Hello ${application.full_name || ""}. This is Daniel, your EPEW Personal Coach. I have reviewed your application and questionnaire. This is your pre-qualification interview, and I want this to be a conversation so I can understand you and your business clearly. To begin, tell me in your own words about the business you are building and where it stands today.`;

      state.messages.push({
        role: "coach",
        content: opening,
        at: new Date().toISOString(),
      });
      await saveState(applicationId, state, false);
      gatherNext(response, url.origin, applicationId, opening);
      return twimlResponse(response);
    }

    if (!speech) {
      const retry =
        "I did not catch a clear answer. Take your time. You can continue your thought, and I will wait for you to finish.";

      state.messages.push({
        role: "coach",
        content: retry,
        at: new Date().toISOString(),
      });
      await saveState(applicationId, state, false);
      gatherNext(response, url.origin, applicationId, retry);
      return twimlResponse(response);
    }

    state.messages.push({
      role: "entrepreneur",
      content: speech,
      at: new Date().toISOString(),
    });
    state.turn_count += 1;

    const decision = await runConversationTurn(application, state, speech);

    state.current_topic = decision.current_topic;
    state.covered_topics = uniqueTopics(decision.covered_topics);
    state.summary = decision.summary;
    state.messages.push({
      role: "coach",
      content: decision.reply,
      at: new Date().toISOString(),
    });

    const sufficientlyCovered = TOPICS.every((topic) => state.covered_topics.includes(topic));
    const complete = Boolean(decision.complete && sufficientlyCovered);

    if (complete) {
      state.completed_at = new Date().toISOString();
      await saveState(applicationId, state, true);

      response.say(voice(), decision.reply);
      response.say(
        voice(),
        "Thank you. That completes the conversational portion of your EPEW pre-qualification interview. Daniel will review the interview together with your application and questionnaire. Your qualification remains pending review until that evaluation is completed."
      );
      response.hangup();
      return twimlResponse(response);
    }

    await saveState(applicationId, state, false);
    gatherNext(response, url.origin, applicationId, decision.reply);
    return twimlResponse(response);
  } catch (error) {
    console.error("EPEW conversational pre-qualification interview error:", error);

    const response = new twilio.twiml.VoiceResponse();
    response.say(
      voice(),
      "I am sorry. I am having trouble continuing the EPEW pre-qualification interview right now. Please try again later."
    );
    return twimlResponse(response, 500);
  }
}
