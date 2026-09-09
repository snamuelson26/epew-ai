import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";

const TOPICS = [
  "rapport_day",
  "identity_name",
  "identity_service",
  "why_business",
  "commitment_reason",
  "commitment_process",
  "organization",
  "communication",
  "target_market",
  "market_need",
  "leadership_hiring",
  "leadership_ability",
  "readiness_now",
  "readiness_recognition",
  "idea_importance",
  "establishment_needs",
  "business_name",
  "business_category",
  "business_description",
  "mission_orientation",
  "first_interview_preparation",
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
type Message = { role: "coach" | "entrepreneur"; topic: Topic; content: string; at: string };
type State = {
  source: "phone_prequalification_approved_v2";
  started_at: string;
  current_topic: Topic;
  messages: Message[];
  no_input_count: number;
  completed_at?: string;
  summary?: string;
  scores?: Scores;
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

function freshState(): State {
  return {
    source: "phone_prequalification_approved_v2",
    started_at: new Date().toISOString(),
    current_topic: "rapport_day",
    messages: [],
    no_input_count: 0,
  };
}

function parseState(value: unknown): State | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const p = JSON.parse(value) as Partial<State>;
    if (p.source !== "phone_prequalification_approved_v2" || !isTopic(p.current_topic) || !Array.isArray(p.messages) || typeof p.started_at !== "string") return null;
    return {
      source: "phone_prequalification_approved_v2",
      started_at: p.started_at,
      current_topic: p.current_topic,
      messages: (p.messages as Message[]).slice(-70),
      no_input_count: Number(p.no_input_count ?? 0) || 0,
      completed_at: p.completed_at,
      summary: typeof p.summary === "string" ? p.summary : undefined,
      scores: p.scores ? normalizeScores(p.scores) : undefined,
    };
  } catch {
    return null;
  }
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

function nextTopic(topic: Topic): Topic | null {
  const i = TOPICS.indexOf(topic);
  return i >= TOPICS.length - 1 ? null : TOPICS[i + 1];
}

function questionFor(topic: Topic, app: any): string {
  const submittedName = String(app.business_name || "the business name you submitted");
  const category = String(app.business_category || app.business_type || "the category you selected");
  const type = String(app.business_category || app.business_type || "business");

  switch (topic) {
    case "rapport_day": return `Hello ${app.full_name || ""}. This is Daniel, your EPEW Personal Coach. How is your day going?`;
    case "identity_name": return "Please confirm your name.";
    case "identity_service": return "What product or service will your business provide?";
    case "why_business": return "Why did you choose this type of business?";
    case "commitment_reason": return "Why do you want to become an entrepreneur?";
    case "commitment_process": return "How committed are you to completing the EPEW development process?";
    case "organization": return "How do you plan to organize your responsibilities, appointments, documents, and business tasks?";
    case "communication": return "Please explain your business idea in your own words.";
    case "target_market": return `Who is the target market for the ${type} you want to establish?`;
    case "market_need": return "Why do you believe people will need or want your product or service?";
    case "leadership_hiring": return "Do you expect to hire people as the business develops?";
    case "leadership_ability": return "How would you describe your leadership ability?";
    case "readiness_now": return "What are you personally ready to do now to begin developing this business?";
    case "readiness_recognition": return "You have already started developing the idea, and that is important. Do you agree?";
    case "idea_importance": return "Why do you think developing the business idea is important?";
    case "establishment_needs": return "What do you still need help understanding or preparing to establish your business?";
    case "business_name": return `You submitted the name ${submittedName}. Is that your intended business name, or is it still a working name?`;
    case "business_category": return `You selected ${category}. Does that really describe the business you want to develop?`;
    case "business_description": return "I reviewed your business description. Is there anything important you want to clarify before your first interview?";
    case "mission_orientation": return "Do you know the mission of EPEW, EDE, and IBOS?";
    case "first_interview_preparation": return "Is there anything you want your Personal Coach to know before your first interview so the meeting can be more productive?";
  }
}

function clarificationFor(topic: Topic): string {
  switch (topic) {
    case "commitment_process": return "By commitment, I mean attending meetings, completing assignments, providing requested information, staying in communication with your coach, and following through.";
    case "organization": return "For example, how will you keep track of appointments, documents, deadlines, and business tasks?";
    case "communication": return "You can simply explain what the business will provide, who it will serve, and why it matters.";
    case "leadership_ability": return "For example, leadership includes making decisions, giving direction, solving problems, taking responsibility, and helping people work toward a goal.";
    case "establishment_needs": return "For example, you may need help with planning, financing, location, licenses, marketing, staffing, business structure, or another area.";
    default: return "Please answer the question in the way that best describes your situation.";
  }
}

function asksForRepeat(speech: string) {
  const s = speech.toLowerCase();
  return s.includes("repeat") || s.includes("say that again") || s.includes("what was the question");
}

function asksForMeaning(speech: string) {
  const s = speech.toLowerCase();
  return s.includes("what do you mean") || s.includes("explain") || s.includes("what should i") || s.includes("what part");
}

function acknowledgement(topic: Topic): string {
  switch (topic) {
    case "rapport_day": return "Good to hear.";
    case "identity_name": return "Thank you.";
    case "identity_service": return "All right.";
    case "why_business": return "That helps me understand your reason.";
    case "commitment_reason": return "Thank you.";
    case "commitment_process": return "Commitment will be important throughout the process.";
    case "organization": return "That is helpful.";
    case "communication": return "Thank you for explaining it.";
    case "target_market": return "Good.";
    case "market_need": return "That gives me useful context.";
    case "leadership_hiring": return "All right.";
    case "leadership_ability": return "Thank you.";
    case "readiness_now": return "That is a good start.";
    case "readiness_recognition": return "Exactly.";
    case "idea_importance": return "Good.";
    case "establishment_needs": return "I will note that so your Personal Coach can help you with it.";
    case "business_name": return "Thank you.";
    case "business_category": return "All right.";
    case "business_description": return "Thank you.";
    case "mission_orientation": return "Let me briefly explain it.";
    case "first_interview_preparation": return "I will include that in the notes for your first interview.";
  }
}

function missionExplanation() {
  return "EPEW helps people develop as entrepreneurs and turn business ideas into organized opportunities through unity, support, preparation, and community participation. EDE brings together the Personal Coach, professional partners, supporters, and development resources. IBOS, I Am My Own Boss, coordinates the entrepreneur's journey, communications, tasks, milestones, and progress. Entrepreneurs are developed before they are funded.";
}

async function evaluateCompletedInterview(app: any, state: State) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { summary: "Pre-qualification interview completed. Human review required.", scores: normalizeScores({}) };

  const transcript = state.messages.map((m) => `${m.role === "coach" ? "COACH" : "ENTREPRENEUR"} [${m.topic}]: ${m.content}`).join("\n");
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["summary", "scores"],
    properties: {
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
    const api = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6500),
      body: JSON.stringify({
        model: process.env.EPEW_INTERVIEW_MODEL?.trim() || "gpt-5.6-luna",
        input: `Review this completed EPEW pre-qualification interview. Summarize the business idea, goal, what is prepared, what is still needed, target market, commitment/readiness, and what the Personal Coach should focus on first. Score commitment, organization, communication, leadership, business potential, and readiness from 0 to 10 using only transcript evidence. Do not make a qualification decision.\n\nAPPLICATION:\n${JSON.stringify({ name: app.full_name, business_name: app.business_name, category: app.business_category, funding_goal: app.funding_request })}\n\nTRANSCRIPT:\n${transcript}`,
        max_output_tokens: 500,
        text: { verbosity: "low", format: { type: "json_schema", name: "epew_prequalification_evaluation", strict: true, schema } },
      }),
    });
    if (!api.ok) throw new Error(`evaluation failed: ${api.status}`);
    const payload = await api.json();
    const text = typeof payload.output_text === "string" ? payload.output_text : (Array.isArray(payload.output) ? payload.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []).map((part: any) => part?.text || "").join("") : "");
    const parsed = JSON.parse(text);
    return { summary: String(parsed.summary || ""), scores: normalizeScores(parsed.scores) };
  } catch (error) {
    console.error("EPEW completed prequalification evaluation error:", error);
    return { summary: "Pre-qualification interview completed. Human review required.", scores: normalizeScores({}) };
  }
}

function gather(response: twilio.twiml.VoiceResponse, origin: string, id: number, prompt: string, app: any, timeout = 8) {
  const hints = [app.full_name, app.business_name, app.business_type, app.business_category, "EPEW", "EDE", "IBOS", "entrepreneur"].filter(Boolean).join(",");
  const g = response.gather({
    input: ["speech"],
    action: `${origin}/api/twilio/voice/prequalification-establishment?applicationId=${encodeURIComponent(String(id))}`,
    method: "POST",
    timeout,
    speechTimeout: "3",
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

    if (!Number.isInteger(id) || id <= 0) {
      response.say(voice(), "This EPEW pre-qualification interview could not be identified.");
      response.hangup();
      return xml(response, 400);
    }

    const app = await loadApplication(id);
    if (!app) {
      response.say(voice(), "We could not find this EPEW entrepreneur application.");
      response.hangup();
      return xml(response, 404);
    }
    if (String(app.questionnaire_status ?? "").toLowerCase() !== "completed") {
      response.say(voice(), "Your entrepreneur questionnaire must be completed before this interview can begin.");
      response.hangup();
      return xml(response, 409);
    }

    const state = parseState(app.interview_notes) ?? freshState();

    if (state.messages.length === 0 && !speech) {
      const opening = questionFor("rapport_day", app);
      state.messages.push({ role: "coach", topic: "rapport_day", content: opening, at: new Date().toISOString() });
      await saveState(id, state, false);
      gather(response, url.origin, id, opening, app);
      return xml(response);
    }

    if (!speech) {
      state.no_input_count += 1;
      if (state.no_input_count >= 2) {
        const goodbye = "I do not seem to be hearing you clearly, so I am going to end this call. We can continue the pre-qualification interview another time. Thank you, and have a blessed day.";
        state.messages.push({ role: "coach", topic: state.current_topic, content: goodbye, at: new Date().toISOString() });
        await markInterrupted(id, state);
        response.say(voice(), goodbye);
        response.hangup();
        return xml(response);
      }
      const retry = `Let me repeat the question. ${questionFor(state.current_topic, app)}`;
      state.messages.push({ role: "coach", topic: state.current_topic, content: retry, at: new Date().toISOString() });
      await saveState(id, state, false);
      gather(response, url.origin, id, retry, app);
      return xml(response);
    }

    state.no_input_count = 0;
    state.messages.push({ role: "entrepreneur", topic: state.current_topic, content: speech, at: new Date().toISOString() });

    if (asksForRepeat(speech)) {
      const repeat = questionFor(state.current_topic, app);
      state.messages.push({ role: "coach", topic: state.current_topic, content: repeat, at: new Date().toISOString() });
      await saveState(id, state, false);
      gather(response, url.origin, id, repeat, app);
      return xml(response);
    }

    if (asksForMeaning(speech)) {
      const clarification = clarificationFor(state.current_topic);
      state.messages.push({ role: "coach", topic: state.current_topic, content: clarification, at: new Date().toISOString() });
      await saveState(id, state, false);
      gather(response, url.origin, id, clarification, app);
      return xml(response);
    }

    const answered = state.current_topic;
    const next = nextTopic(answered);

    if (!next) {
      const evaluation = await evaluateCompletedInterview(app, state);
      state.completed_at = new Date().toISOString();
      state.summary = evaluation.summary;
      state.scores = evaluation.scores;
      await saveState(id, state, true);
      const closing = "Thank you for attending the meeting. We are looking forward to helping you open a successful business. Thank you, and have a blessed day.";
      response.say(voice(), closing);
      response.hangup();
      return xml(response);
    }

    state.current_topic = next;
    let reply = acknowledgement(answered);
    if (answered === "mission_orientation") reply = `${reply} ${missionExplanation()}`;
    reply = `${reply} ${questionFor(next, app)}`.trim();

    state.messages.push({ role: "coach", topic: next, content: reply, at: new Date().toISOString() });
    await saveState(id, state, false);
    gather(response, url.origin, id, reply, app);
    return xml(response);
  } catch (error) {
    console.error("EPEW approved prequalification error:", error);
    const response = new twilio.twiml.VoiceResponse();
    response.say(voice(), "I am sorry. I am having trouble continuing the interview right now. We will stop here and continue another time.");
    response.hangup();
    return xml(response, 500);
  }
}
