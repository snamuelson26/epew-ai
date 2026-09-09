import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";

const TOPICS = [
  "rapport_identity",
  "why_business",
  "commitment",
  "organization",
  "communication",
  "business_potential",
  "leadership",
  "readiness",
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

type Message = {
  role: "coach" | "entrepreneur";
  content: string;
  at: string;
};

type State = {
  source: "phone_prequalification_fast_v1";
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
  return new NextResponse(response.toString(), {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}

function voice() {
  return { voice: "Polly.Matthew", language: "en-US" } as const;
}

function isTopic(value: unknown): value is Topic {
  return TOPICS.includes(String(value ?? "") as Topic);
}

function uniqTopics(value: unknown): Topic[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isTopic)));
}

function clamp(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n))) : 0;
}

function normalizeScores(value: unknown): Scores {
  const v = value && typeof value === "object" ? (value as Partial<Scores>) : {};
  return {
    commitment: clamp(v.commitment),
    organization: clamp(v.organization),
    communication: clamp(v.communication),
    leadership: clamp(v.leadership),
    business_potential: clamp(v.business_potential),
    readiness: clamp(v.readiness),
  };
}

function parseState(value: unknown): State | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const p = JSON.parse(value) as Partial<State>;
    if (
      p.source !== "phone_prequalification_fast_v1" ||
      !isTopic(p.current_topic) ||
      !Array.isArray(p.messages) ||
      typeof p.started_at !== "string"
    ) return null;

    return {
      source: "phone_prequalification_fast_v1",
      started_at: p.started_at,
      current_topic: p.current_topic,
      covered_topics: uniqTopics(p.covered_topics),
      messages: p.messages.slice(-28) as Message[],
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
    source: "phone_prequalification_fast_v1",
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
    .select(`
      id,full_name,business_name,business_type,business_category,
      business_description,funding_request,questionnaire_answers,
      questionnaire_status,interview_notes
    `)
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
  const { error } = await supabaseAdmin
    .from("entrepreneur_applications")
    .update({
      interview_notes: JSON.stringify(state),
      interview_type: "phone",
      interview_status: "Pending",
      review_status: "Pending Review",
      qualification_status: "Pending Review",
    })
    .eq("id", id);
  if (error) throw error;
}

function businessType(app: any) {
  return String(app.business_category || app.business_type || app.business_name || "business idea").trim();
}

function questionFor(topic: Topic, app: any) {
  const type = businessType(app);
  const name = String(app.business_name || "the business name you submitted");
  switch (topic) {
    case "rapport_identity": return `Please confirm your name and tell me the main product or service your new business will provide.`;
    case "why_business": return `What made you choose this type of business?`;
    case "commitment": return `Why do you want to become an entrepreneur, and how committed are you to completing the EPEW development process? By commitment, I mean attending meetings, completing assignments, providing information, and staying in communication with your coach.`;
    case "organization": return `Do you already have an idea of how you will organize responsibilities, appointments, documents, and business-related tasks?`;
    case "communication": return `Please explain your business idea the way you would want your coach or someone supporting your development to understand it.`;
    case "business_potential": return `I see you want to develop a ${type}. Who do you believe your target customers will be, and why would they need or want your product or service?`;
    case "leadership": return `Do you expect to hire other people eventually? And how would you describe your leadership ability, such as making decisions, giving direction, solving problems, and taking responsibility?`;
    case "readiness": return `What are you personally ready to do now to begin developing this business, and what do you still need help understanding or preparing?`;
    case "business_name": return `You submitted the business name ${name}. Is that the name you want to develop, or is it still a working name?`;
    case "business_category": return `Does the category you selected accurately describe the type of business you really want to develop?`;
    case "business_description": return `I reviewed your description. Is there anything important about the business idea you want to clarify before your first interview?`;
    case "mission_orientation": return `Do you know the mission of EPEW, EDE, and IBOS?`;
    case "first_interview_preparation": return `Is there anything you want your Personal Coach to know before your first interview so the meeting can be more productive?`;
  }
}

function nextTopic(topic: Topic): Topic {
  const i = TOPICS.indexOf(topic);
  return TOPICS[Math.min(i + 1, TOPICS.length - 1)];
}

function fallbackDecision(state: State, app: any, speech: string): Decision {
  const covered = uniqTopics([...state.covered_topics, state.current_topic]);
  const next = nextTopic(state.current_topic);
  const shortAck = speech.length > 6 ? "I understand." : "All right.";
  return {
    reply: `${shortAck} ${questionFor(next, app)}`,
    current_topic: next,
    covered_topics: covered,
    complete: false,
    summary: state.summary,
    scores: normalizeScores(state.scores),
  };
}

function outputText(payload: any) {
  if (typeof payload?.output_text === "string") return payload.output_text.trim();
  const pieces: string[] = [];
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if (typeof part?.text === "string") pieces.push(part.text);
    }
  }
  return pieces.join("\n").trim();
}

async function decide(app: any, state: State, speech: string): Promise<Decision> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return fallbackDecision(state, app, speech);

  const recent = state.messages
    .slice(-12)
    .map((m) => `${m.role === "coach" ? "D" : "E"}: ${m.content}`)
    .join("\n");

  const prompt = `You are Daniel Pierre conducting an EPEW phone PRE-QUALIFICATION conversation with a brand-new entrepreneur. This happens before the first full coach interview and is NOT a business-opening meeting.

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

Rules:
- Respond to the entrepreneur's actual answer, then move naturally when enough was said.
- Ask one principal question at a time.
- Give a short useful idea only when it genuinely helps; most answers need only acknowledgement.
- Do not develop a business plan.
- Never discuss opening-readiness systems unless the entrepreneur raises them.
- If speech seems unclear, ask one specific clarification tied to what you heard; never use the same generic clarification twice.
- Keep normal replies under 55 words.
- Use this progression: rapport_identity, why_business, commitment, organization, communication, business_potential, leadership, readiness, business_name, business_category, business_description, mission_orientation, first_interview_preparation.
- For mission_orientation, after the entrepreneur answers, briefly explain: EPEW develops entrepreneurs through unity, support, preparation and community participation; EDE brings together the coach, partners, supporters and resources; IBOS coordinates communications, tasks, milestones and progress; entrepreneurs are developed before funding.
- Never approve, reject, qualify, or deny the applicant on the call.
- Complete only after first_interview_preparation is meaningfully answered.
- Maintain conservative 0-10 scores for commitment, organization, communication, leadership, business_potential, readiness.

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
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "epew_prequalification_turn",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!api.ok) {
      console.error("EPEW fast prequalification model error:", api.status, await api.text());
      return fallbackDecision(state, app, speech);
    }

    const raw = outputText(await api.json());
    const parsed = JSON.parse(raw) as Decision;
    return {
      reply: String(parsed.reply || questionFor(state.current_topic, app)),
      current_topic: isTopic(parsed.current_topic) ? parsed.current_topic : state.current_topic,
      covered_topics: uniqTopics(parsed.covered_topics),
      complete: Boolean(parsed.complete),
      summary: String(parsed.summary || state.summary || ""),
      scores: normalizeScores(parsed.scores),
    };
  } catch (error) {
    console.error("EPEW fast prequalification fallback:", error);
    return fallbackDecision(state, app, speech);
  }
}

function gather(
  response: twilio.twiml.VoiceResponse,
  origin: string,
  applicationId: number,
  prompt: string,
  app: any,
  timeout = 10
) {
  const hints = [app.full_name, app.business_name, app.business_type, app.business_category, "EPEW", "EDE", "IBOS", "entrepreneur"]
    .filter(Boolean)
    .join(",");

  const g = response.gather({
    input: ["speech"],
    action: `${origin}/api/twilio/voice/prequalification-fast?applicationId=${encodeURIComponent(String(applicationId))}`,
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
      const opening = `Hello ${app.full_name || ""}. This is Daniel, your EPEW Personal Coach. I am glad we have a chance to speak before your first full interview. How is your day going so far?`;
      state.messages.push({ role: "coach", content: opening, at: new Date().toISOString() });
      await saveState(id, state, false);
      gather(response, url.origin, id, opening, app, 10);
      return xml(response);
    }

    if (!speech) {
      state.no_input_count += 1;
      if (state.no_input_count >= 2) {
        const goodbye = "I do not seem to be hearing you clearly, so I am going to end this call rather than keep repeating the same question. We can continue the pre-qualification interview another time. Thank you, and have a blessed day.";
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
      gather(response, url.origin, id, retry, app, 10);
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
      response.say(voice(), "Thank you for attending the meeting. We are looking forward to helping you develop and open a successful business. Thank you, and have a blessed day.");
      response.hangup();
      return xml(response);
    }

    await saveState(id, state, false);
    gather(response, url.origin, id, decision.reply, app, 10);
    return xml(response);
  } catch (error) {
    console.error("EPEW fast prequalification error:", error);
    const response = new twilio.twiml.VoiceResponse();
    response.say(voice(), "I am sorry. I am having trouble continuing the interview right now. We will stop here and continue another time.");
    response.hangup();
    return xml(response, 500);
  }
}
