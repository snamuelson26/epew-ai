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
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string" && part.text.trim()) return part.text.trim();
    }
  }

  return "";
}

function parseDecision(text: string, state: ConversationState): InterviewDecision | null {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<InterviewDecision>;
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

async function runConversationTurn(
  application: any,
  state: ConversationState,
  entrepreneurSpeech: string
): Promise<InterviewDecision> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      reply:
        "Thank you. I want to understand that clearly before we move on. Could you explain that in a little more detail?",
      current_topic: state.current_topic,
      covered_topics: state.covered_topics,
      complete: false,
      summary: state.summary ?? "",
    };
  }

  const recentConversation = [
    ...state.messages,
    {
      role: "entrepreneur" as const,
      content: entrepreneurSpeech,
      at: new Date().toISOString(),
    },
  ]
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

QUALIFICATION AREAS TO UNDERSTAND OVER THE COURSE OF THE CONVERSATION
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
1. LISTEN to what the entrepreneur actually said and respond to it.
2. Briefly acknowledge or reflect the substance of the answer when appropriate.
3. If the answer is vague, incomplete, contradictory, off-topic, or just noise, stay on the same subject and ask a natural clarification or follow-up.
4. Do NOT move to a new qualification area just because audio was detected.
5. If the entrepreneur answers more than one area in a single response, recognize that and mark those areas covered.
6. Use the questionnaire/application to avoid asking for information that is already clear. Instead, verify or probe important details.
7. Ask ONE principal question at a time. It may include a short clarification, but never fire a list of questions.
8. Keep each spoken response conversational and normally under 55 words.
9. Do not lecture, coach the business, sell EPEW, or make a qualification decision during this interview.
10. Never say the applicant is approved, qualified, denied, or rejected.
11. Only set complete=true when the conversation has gathered enough meaningful information across ALL major areas. A short/noisy response cannot complete an area.
12. Natural transitions are encouraged: “That helps me understand…”, “You mentioned…”, “Before we move on…”, “Let me make sure I understand…”.
13. If the entrepreneur asks a brief relevant question, answer it briefly and then return naturally to the interview.

Return ONLY valid JSON with this exact structure:
{
  "reply": "what Daniel should say next",
  "current_topic": "one of the allowed topic IDs",
  "covered_topics": ["topic IDs genuinely covered so far"],
  "complete": false,
  "summary": "short cumulative factual interview summary for later review"
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
      reply:
        "Thank you. I want to make sure I understood you correctly. Could you tell me a little more about that before we continue?",
      current_topic: state.current_topic,
      covered_topics: state.covered_topics,
      complete: false,
      summary: state.summary ?? "",
    };
  }

  const payload = await apiResponse.json();
  const decision = parseDecision(extractOutputText(payload), state);

  return (
    decision ?? {
      reply:
        "Thank you. Let me stay with that for a moment. Could you explain that a little more clearly for me?",
      current_topic: state.current_topic,
      covered_topics: state.covered_topics,
      complete: false,
      summary: state.summary ?? "",
    }
  );
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
    timeout: 15,
    speechTimeout: "auto",
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

    let state = parseState(application.interview_notes) ?? newState();

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
        "I did not catch a clear answer. Take your time, and please continue from where we were. I am listening.";

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
