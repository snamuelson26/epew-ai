import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";

const TOPICS = [
  "rapport_identity",
  "business_idea",
  "why_business",
  "business_goal",
  "prepared_now",
  "establishment_needs",
  "target_market",
  "commitment_readiness",
  "organization_leadership",
  "business_identity_review",
  "mission_orientation",
  "first_interview_priority",
] as const;

type Topic = (typeof TOPICS)[number];

type Scores = {
  commitment: number;
  organization: number;
  communication: number;
  leadership: number;
  business_potential: number;
  readiness: number;
};

type Message = { role: "coach" | "entrepreneur"; content: string; at: string };

type State = {
  source: "phone_prequalification_establishment_v1";
  started_at: string;
  current_topic: Topic;
  covered_topics: Topic[];
  messages: Message[];
  turn_count: number;
  no_input_count: number;
  summary: string;
  scores?: Scores;
  completed_at?: string;
};

type Decision = {
  reply: string;
  current_topic: Topic;
  covered_topics: Topic[];
  complete: boolean;
  summary: string;
  scores: Scores;
};

function xml(response: twilio.twiml.VoiceResponse, status = 200) {
  return new NextResponse(response.toString(), { status, headers: { "Content-Type": "text/xml" } });
}

function voice() {
  return { voice: "Polly.Matthew", language: "en-US" } as const;
}

function isTopic(v: unknown): v is Topic {
  return TOPICS.includes(String(v ?? "") as Topic);
}

function uniqTopics(v: unknown): Topic[] {
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.filter(isTopic)));
}

function clamp(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n))) : 0;
}

function normalizeScores(v: unknown): Scores {
  const s = v && typeof v === "object" ? (v as Partial<Scores>) : {};
  return {
    commitment: clamp(s.commitment),
    organization: clamp(s.organization),
    communication: clamp(s.communication),
    leadership: clamp(s.leadership),
    business_potential: clamp(s.business_potential),
    readiness: clamp(s.readiness),
  };
}

function parseState(v: unknown): State | null {
  if (typeof v !== "string" || !v.trim()) return null;
  try {
    const p = JSON.parse(v) as Partial<State>;
    if (p.source !== "phone_prequalification_establishment_v1" || !isTopic(p.current_topic) || !Array.isArray(p.messages) || typeof p.started_at !== "string") return null;
    return {
      source: "phone_prequalification_establishment_v1",
      started_at: p.started_at,
      current_topic: p.current_topic,
      covered_topics: uniqTopics(p.covered_topics),
      messages: p.messages.slice(-32) as Message[],
      turn_count: Number(p.turn_count ?? 0) || 0,
      no_input_count: Number(p.no_input_count ?? 0) || 0,
      summary: String(p.summary ?? ""),
      scores: p.scores ? normalizeScores(p.scores) : undefined,
      completed_at: p.completed_at,
    };
  } catch {
    return null;
  }
}

function freshState(): State {
  return {
    source: "phone_prequalification_establishment_v1",
    started_at: new Date().toISOString(),
    current_topic: "rapport_identity",
    covered_topics: [],
    messages: [],
    turn_count: 0,
    no_input_count: 0,
    summary: "",
  };
}

async function loadApplication(id: number) {
  const { data, error } = await supabaseAdmin
    .from("entrepreneur_applications")
    .select("id,full_name,business_name,business_type,business_category,business_description,funding_request,questionnaire_answers,questionnaire_status,interview_notes")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function saveState(id: number, state: State, completed = false) {
  const update: Record<string, unknown> = {
    interview_notes: JSON.stringify(state),
    interview_type: "phone",
    interview_status: completed ? "Completed" : "In Progress",
    review_status: completed ? "Interview Completed" : "Interview In Progress",
  };
  if (completed) {
    update.qualification_status = "Pending Review";
    update.application_decision = "Pending";
    if (state.scores) {
      update.commitment_score = state.scores.commitment;
      update.organization_score = state.scores.organization;
      update.communication_score = state.scores.communication;
      update.leadership_score = state.scores.leadership;
      update.business_potential_score = state.scores.business_potential;
      update.readiness_score = state.scores.readiness;
    }
  }
  const { error } = await supabaseAdmin.from("entrepreneur_applications").update(update).eq("id", id);
  if (error) throw error;
}

async function markInterrupted(id: number, state: State) {
  const { error } = await supabaseAdmin.from("entrepreneur_applications").update({
    interview_notes: JSON.stringify(state),
    interview_type: "phone",
    interview_status: "Pending",
    review_status: "Pending Review",
    qualification_status: "Pending Review",
  }).eq("id", id);
  if (error) throw error;
}

function questionFor(topic: Topic, app: any) {
  const name = String(app.business_name || "the business name you submitted");
  const type = String(app.business_category || app.business_type || "business");
  switch (topic) {
    case "rapport_identity": return "Please confirm your name, and tell me the main product or service you want your new business to provide.";
    case "business_idea": return "In your own words, describe the business you want to establish. What do you want it to be?";
    case "why_business": return "Why did you choose this type of business? What makes this idea important or interesting to you?";
    case "business_goal": return "What is your main goal for this business? For example, what would you like it to accomplish for you, your customers, or your community?";
    case "prepared_now": return "What have you already prepared for the business so far? This can include the idea, name, research, experience, money saved, location ideas, equipment, documents, partners, or anything else you have already started.";
    case "establishment_needs": return "What do you believe you still need in order to establish this business? Think about planning, knowledge, financing, location, licenses, marketing, staffing, business structure, or professional guidance.";
    case "target_market": return `For the ${type} you want to establish, who are the main customers you want to serve, and why do you believe they will need or want what you plan to provide?`;
    case "commitment_readiness": return "What are you personally ready to begin doing now to move this business idea forward? And how committed are you to completing the EPEW development process with your coach?";
    case "organization_leadership": return "As the business develops, how do you plan to organize your responsibilities and make decisions? If you eventually have employees or partners, how do you see yourself leading them?";
    case "business_identity_review": return `You submitted the name ${name}. Does that still fit the business you want to establish, and is there anything about the category or description you want corrected before your first interview?`;
    case "mission_orientation": return "Do you know the mission of EPEW, EDE, and IBOS?";
    case "first_interview_priority": return "Based on everything we discussed, what is the first thing you want your Personal Coach to help you develop or prepare in your first interview?";
  }
}

function nextTopic(topic: Topic): Topic {
  const i = TOPICS.indexOf(topic);
  return TOPICS[Math.min(i + 1, TOPICS.length - 1)];
}

function fallbackDecision(state: State, app: any, speech: string): Decision {
  const covered = uniqTopics([...state.covered_topics, state.current_topic]);
  const next = nextTopic(state.current_topic);
  return {
    reply: `${speech.length > 6 ? "I understand." : "All right."} ${questionFor(next, app)}`,
    current_topic: next,
    covered_topics: covered,
    complete: false,
    summary: state.summary,
    scores: normalizeScores(state.scores),
  };
}

function outputText(payload: any) {
  if (typeof payload?.output_text === "string") return payload.output_text.trim();
  const out: string[] = [];
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if (typeof part?.text === "string") out.push(part.text);
    }
  }
  return out.join("\n").trim();
}

async function decide(app: any, state: State, speech: string): Promise<Decision> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return fallbackDecision(state, app, speech);

  const recent = state.messages.slice(-14).map((m) => `${m.role === "coach" ? "D" : "E"}: ${m.content}`).join("\n");

  const prompt = `You are Daniel Pierre conducting an EPEW telephone PRE-QUALIFICATION conversation with a BRAND-NEW entrepreneur before the first full Personal Coach interview.

PRIMARY PURPOSE
Do not conduct a generic questionnaire and do not plan the opening date. Establish the entrepreneur's BUSINESS-DEVELOPMENT STARTING POINT. By the end of this call you must clearly understand:
1. What business idea the entrepreneur wants to establish.
2. Why this business was chosen.
3. The entrepreneur's main goal for the business.
4. What has ALREADY been prepared or started.
5. What is STILL NEEDED to establish and develop the business.
6. Who the target customers are and why the idea has potential.
7. What the entrepreneur is personally ready and committed to do.
8. What the Personal Coach should work on FIRST in the first interview.

Applicant: ${JSON.stringify({
    name: app.full_name,
    business_name: app.business_name,
    business_type: app.business_type,
    business_category: app.business_category,
    description: app.business_description,
    funding_goal: app.funding_request,
    questionnaire: app.questionnaire_answers,
  })}
Current topic: ${state.current_topic}
Covered: ${state.covered_topics.join(", ") || "none"}
Recent conversation:\n${recent}

CONVERSATION RULES
- Listen and acknowledge the substance of the entrepreneur's answer.
- Ask ONE principal question at a time.
- Stay focused on establishing and developing the BUSINESS IDEA, the GOAL, what is PREPARED, and what is NEEDED.
- Do NOT spend time determining operating hours, menu times, launch dates, exact opening dates, POS systems, vendors, or detailed operations during pre-qualification unless one fact is essential to understand the entrepreneur's current preparation.
- If the entrepreneur asks for advice, give one brief helpful idea, then return to understanding their establishment needs. Do not build the business plan.
- Do not over-clarify minor details. If the general meaning is clear, record it and move on.
- Use the application and questionnaire as background instead of re-asking information already clear.
- Ask about the funding goal only when it helps clarify what the entrepreneur needs to establish the business.
- Business name/category/description verification should be quick, not a long section.
- Keep most responses under 55 words.
- Never approve, reject, qualify, or deny the entrepreneur during the call.

SCORING
Evaluate commitment, organization, communication, leadership, business_potential, and readiness from the entrepreneur's answers throughout this establishment conversation. Do not ask six artificial score questions just to generate scores.

MISSION
At mission_orientation, ask whether the entrepreneur knows the mission. Then briefly explain: EPEW develops entrepreneurs through unity, support, preparation and community participation; EDE connects the coach, partners, supporters and resources; IBOS coordinates the entrepreneur's communications, tasks, milestones and progress; entrepreneurs are developed before funding.

PROGRESSION
rapport_identity -> business_idea -> why_business -> business_goal -> prepared_now -> establishment_needs -> target_market -> commitment_readiness -> organization_leadership -> business_identity_review -> mission_orientation -> first_interview_priority.
Complete only after first_interview_priority is meaningfully answered.

Entrepreneur just said: ${JSON.stringify(speech)}`;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["reply", "current_topic", "covered_topics", "complete", "summary", "scores"],
    properties: {
      reply: { type: "string" },
      current_topic: { type: "string", enum: TOPICS },
      covered_topics: { type: "array", items: { type: "string", enum: TOPICS } },
      complete: { type: "boolean" },
      summary: { type: "string" },
      scores: {
        type: "object",
        additionalProperties: false,
        required: ["commitment", "organization", "communication", "leadership", "business_potential", "readiness"],
        properties: {
          commitment: { type: "integer", minimum: 0, maximum: 10 },
          organization: { type: "integer", minimum: 0, maximum: 10 },
          communication: { type: "integer", minimum: 0, maximum: 10 },
          leadership: { type: "integer", minimum: 0, maximum: 10 },
          business_potential: { type: "integer", minimum: 0, maximum: 10 },
          readiness: { type: "integer", minimum: 0, maximum: 10 },
        },
      },
    },
  };

  try {
    const model = process.env.EPEW_INTERVIEW_MODEL?.trim() || "gpt-5.6-luna";
    const api = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6500),
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: 420,
        text: { verbosity: "low", format: { type: "json_schema", name: "epew_establishment_prequalification_turn", strict: true, schema } },
      }),
    });
    if (!api.ok) {
      console.error("EPEW establishment prequalification model error:", api.status, await api.text());
      return fallbackDecision(state, app, speech);
    }
    const parsed = JSON.parse(outputText(await api.json())) as Decision;
    return {
      reply: String(parsed.reply || questionFor(state.current_topic, app)),
      current_topic: isTopic(parsed.current_topic) ? parsed.current_topic : state.current_topic,
      covered_topics: uniqTopics(parsed.covered_topics),
      complete: Boolean(parsed.complete),
      summary: String(parsed.summary || state.summary || ""),
      scores: normalizeScores(parsed.scores),
    };
  } catch (error) {
    console.error("EPEW establishment prequalification fallback:", error);
    return fallbackDecision(state, app, speech);
  }
}

function gather(response: twilio.twiml.VoiceResponse, origin: string, id: number, prompt: string, app: any, timeout = 10) {
  const hints = [app.full_name, app.business_name, app.business_type, app.business_category, "EPEW", "EDE", "IBOS", "entrepreneur", "business plan", "funding", "location", "licensing", "marketing"]
    .filter(Boolean).join(",");
  const g = response.gather({
    input: ["speech"],
    action: `${origin}/api/twilio/voice/prequalification-establishment?applicationId=${encodeURIComponent(String(id))}`,
    method: "POST",
    timeout,
    speechTimeout: "4",
    speechModel: "googlev2_telephony",
    language: "en-US",
    hints,
    profanityFilter: false,
    actionOnEmptyResult: true,
  } as any);
  g.say(voice(), prompt);
}

export async function POST(request: NextRequest) {
  try {
    const { valid, params } = await validateTwilioWebhook(request);
    const response = new twilio.twiml.VoiceResponse();
    if (!valid) {
      response.say(voice(), "This request could not be verified.");
      return xml(response, 403);
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get("applicationId"));
    const speech = String(params.SpeechResult ?? "").trim();
    const confidence = Number(params.Confidence ?? 1);

    if (!Number.isInteger(id) || id <= 0) {
      response.say(voice(), "This EPEW pre-qualification interview could not be identified.");
      return xml(response, 400);
    }

    const app = await loadApplication(id);
    if (!app) {
      response.say(voice(), "We could not find this EPEW entrepreneur application.");
      return xml(response, 404);
    }
    if (String(app.questionnaire_status ?? "").toLowerCase() !== "completed") {
      response.say(voice(), "Your entrepreneur questionnaire must be completed before this interview can begin.");
      response.hangup();
      return xml(response, 409);
    }

    const state = parseState(app.interview_notes) ?? freshState();

    if (state.messages.length === 0 && !speech) {
      const opening = `Hello ${app.full_name || ""}. This is Daniel, your EPEW Personal Coach. I am glad we can speak before your first full interview. How is your day going so far?`;
      state.messages.push({ role: "coach", content: opening, at: new Date().toISOString() });
      await saveState(id, state, false);
      gather(response, url.origin, id, opening, app);
      return xml(response);
    }

    if (!speech) {
      state.no_input_count += 1;
      if (state.no_input_count >= 2) {
        const goodbye = "I do not seem to be hearing you clearly, so I am going to end this call rather than repeat the same question. We can continue the pre-qualification interview another time. Thank you, and have a blessed day.";
        state.messages.push({ role: "coach", content: goodbye, at: new Date().toISOString() });
        await markInterrupted(id, state);
        response.say(voice(), goodbye);
        response.hangup();
        return xml(response);
      }
      const retry = "I may not be hearing you clearly. If you are still there, please try that answer one more time.";
      state.messages.push({ role: "coach", content: retry, at: new Date().toISOString() });
      await saveState(id, state, false);
      gather(response, url.origin, id, retry, app, 8);
      return xml(response);
    }

    state.no_input_count = 0;
    state.turn_count += 1;
    state.messages.push({ role: "entrepreneur", content: speech, at: new Date().toISOString() });

    if (Number.isFinite(confidence) && confidence > 0 && confidence < 0.35) {
      const retry = `I heard part of that, but the phone transcription was not clear enough. ${questionFor(state.current_topic, app)}`;
      state.messages.push({ role: "coach", content: retry, at: new Date().toISOString() });
      await saveState(id, state, false);
      gather(response, url.origin, id, retry, app);
      return xml(response);
    }

    const decision = await decide(app, state, speech);
    state.current_topic = decision.current_topic;
    state.covered_topics = uniqTopics(decision.covered_topics);
    state.summary = decision.summary;
    state.scores = normalizeScores(decision.scores);
    state.messages.push({ role: "coach", content: decision.reply, at: new Date().toISOString() });

    const allCovered = TOPICS.every((topic) => state.covered_topics.includes(topic));
    const complete = Boolean(decision.complete && allCovered);

    if (complete) {
      state.completed_at = new Date().toISOString();
      await saveState(id, state, true);
      response.say(voice(), decision.reply);
      response.say(voice(), "Thank you for attending the meeting. We are looking forward to helping you develop and establish a successful business. Thank you, and have a blessed day.");
      response.hangup();
      return xml(response);
    }

    await saveState(id, state, false);
    gather(response, url.origin, id, decision.reply, app);
    return xml(response);
  } catch (error) {
    console.error("EPEW establishment prequalification error:", error);
    const response = new twilio.twiml.VoiceResponse();
    response.say(voice(), "I am sorry. I am having trouble continuing the interview right now. We will stop here and continue another time.");
    response.hangup();
    return xml(response, 500);
  }
}
