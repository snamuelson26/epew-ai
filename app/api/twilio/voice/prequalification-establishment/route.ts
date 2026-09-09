import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";

const TOPICS = [
  "rapport_day",
  "identity_service",
  "why_business",
  "business_goal",
  "prepared_now",
  "commitment_reason",
  "commitment_process",
  "organization",
  "communication",
  "target_market",
  "market_need",
  "leadership_hiring",
  "leadership_ability",
  "readiness_now",
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

type Message = {
  role: "coach" | "entrepreneur";
  topic: Topic;
  content: string;
  at: string;
};

type State = {
  source: "phone_prequalification_approved_v1";
  started_at: string;
  current_topic: Topic;
  messages: Message[];
  no_input_count: number;
  completed_at?: string;
  summary?: string;
  scores?: Scores;
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
      p.source !== "phone_prequalification_approved_v1" ||
      !isTopic(p.current_topic) ||
      !Array.isArray(p.messages) ||
      typeof p.started_at !== "string"
    ) return null;

    return {
      source: "phone_prequalification_approved_v1",
      started_at: p.started_at,
      current_topic: p.current_topic,
      messages: (p.messages as Message[]).slice(-60),
      no_input_count: Number(p.no_input_count ?? 0) || 0,
      completed_at: p.completed_at,
      summary: typeof p.summary === "string" ? p.summary : undefined,
      scores: p.scores ? normalizeScores(p.scores) : undefined,
    };
  } catch {
    return null;
  }
}

function freshState(): State {
  return {
    source: "phone_prequalification_approved_v1",
    started_at: new Date().toISOString(),
    current_topic: "rapport_day",
    messages: [],
    no_input_count: 0,
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

  const { error } = await supabaseAdmin
    .from("entrepreneur_applications")
    .update(update)
    .eq("id", id);
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

function nextTopic(topic: Topic): Topic | null {
  const index = TOPICS.indexOf(topic);
  return index >= TOPICS.length - 1 ? null : TOPICS[index + 1];
}

function questionFor(topic: Topic, app: any) {
  const submittedName = String(app.business_name || "the business name you submitted");
  const category = String(app.business_category || app.business_type || "the category you selected");
  const type = String(app.business_category || app.business_type || "business");

  switch (topic) {
    case "rapport_day":
      return `Hello ${app.full_name || ""}. This is Daniel, your EPEW Personal Coach. I am glad we can speak before your first interview. How is your day going so far?`;
    case "identity_service":
      return "Before we continue, please confirm your name and tell me the main product or service your new business will provide.";
    case "why_business":
      return "Why did you choose this type of business?";
    case "business_goal":
      return "What is your main goal for establishing this business? What would you like the business to accomplish for you, your customers, or your community?";
    case "prepared_now":
      return "What have you already prepared or started for this business so far? For example, the idea, research, experience, money saved, a location idea, documents, equipment, or anything else you have begun.";
    case "commitment_reason":
      return "Why do you want to become an entrepreneur?";
    case "commitment_process":
      return "How committed are you to completing the EPEW development process? For example, attending meetings, completing assignments, providing requested information, staying in communication with your coach, and following through consistently.";
    case "organization":
      return "Do you have an idea of how you will organize your responsibilities, appointments, documents, and business-related tasks?";
    case "communication":
      return "Please explain your business development idea in your own words, the way you would want your coach or someone supporting your development to understand it.";
    case "target_market":
      return `I see you want to establish a ${type}. Who is your target market? Who are the main people you expect to serve?`;
    case "market_need":
      return "Why do you believe those people will need or want your product or service?";
    case "leadership_hiring":
      return "Do you expect to hire other people as the business develops?";
    case "leadership_ability":
      return "Tell me a little about your leadership ability. By leadership, I mean things like making decisions, giving direction, solving problems, taking responsibility, organizing people, and helping a team work toward the same goal.";
    case "readiness_now":
      return "What are you personally ready to do now to begin developing this business?";
    case "idea_importance":
      return "You have already started developing the idea, which is an important first step. Why do you think developing the business idea itself is so important?";
    case "establishment_needs":
      return "What do you think you still need help understanding or preparing in order to establish your business?";
    case "business_name":
      return `You submitted the business name ${submittedName}. Is that the name you want to develop, or is it still a working name?`;
    case "business_category":
      return `You selected ${category}. Does that accurately describe the type of business you really want to develop?`;
    case "business_description":
      return "I reviewed your description. Is there anything important about the business idea that you want to clarify before your first interview?";
    case "mission_orientation":
      return "Do you know the mission of EPEW, EDE, and IBOS?";
    case "first_interview_preparation":
      return "Is there anything you want your Personal Coach to know before your first interview so the meeting can be more productive?";
  }
}

function clarificationFor(topic: Topic, app: any) {
  switch (topic) {
    case "commitment_process":
      return "By commitment, I mean whether you are ready to attend meetings, complete assignments, provide information, communicate with your coach, and keep working through the development process.";
    case "organization":
      return "I mean how you expect to keep track of appointments, documents, responsibilities, deadlines, and tasks as you develop the business.";
    case "communication":
      return "You can keep it simple: what the business will provide, who it will serve, and what you want to develop first.";
    case "leadership_ability":
      return "For example, leadership includes making decisions, taking responsibility, solving problems, organizing a team, and helping people work toward a goal.";
    case "establishment_needs":
      return "For example, you may need help with planning, financing, location, licenses, marketing, staffing, business structure, or understanding what steps should come first.";
    default:
      return questionFor(topic, app);
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

function acknowledgement(topic: Topic, speech: string) {
  const short = speech.trim().length < 8;

  switch (topic) {
    case "why_business":
      return short ? "All right." : "I understand why that business idea interests you.";
    case "business_goal":
      return "That gives me a clear sense of the goal you have in mind.";
    case "prepared_now":
      return "Good. I am noting what you have already started so your coach can build from there.";
    case "commitment_reason":
      return "I understand.";
    case "commitment_process":
      return "Good. Commitment and follow-through are important during the development process.";
    case "organization":
      return "That is helpful. A simple system for appointments, documents, and tasks can make the development process much easier.";
    case "communication":
      return "Good. A clear business idea usually explains what you provide, who you serve, and why the business matters.";
    case "target_market":
      return "Good. Knowing exactly who you want to serve is important.";
    case "market_need":
      return "I understand.";
    case "leadership_hiring":
      return short ? "All right." : "That helps me understand how you see the business growing.";
    case "leadership_ability":
      return "Good. I am noting that for your coach.";
    case "readiness_now":
      return "That is a good start. Taking action on the idea is already part of building the business.";
    case "idea_importance":
      return "Exactly. A clear idea gives the rest of the business development process direction.";
    case "establishment_needs":
      return "Great. I will note that so your Personal Coach can help you work on it.";
    case "business_name":
    case "business_category":
    case "business_description":
      return "Understood.";
    case "mission_orientation":
      return "Let me briefly explain it.";
    case "first_interview_preparation":
      return "Thank you. I will make sure that is included in the notes for your first interview.";
    default:
      return short ? "All right." : "I understand.";
  }
}

function missionExplanation() {
  return "EPEW helps people develop themselves as entrepreneurs and turn business ideas into organized opportunities through unity, support, preparation, and community participation. EDE brings together the Personal Coach, professional partners, supporters, and development resources. IBOS, I Am My Own Boss, coordinates the entrepreneur's journey, communications, tasks, milestones, and progress. Our philosophy is that entrepreneurs are developed before they are funded.";
}

async function evaluateCompletedInterview(app: any, state: State) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return {
      summary: "Pre-qualification interview completed. Human review is required for scoring and next-step preparation.",
      scores: normalizeScores({}),
    };
  }

  const transcript = state.messages
    .map((m) => `${m.role === "coach" ? "COACH" : "ENTREPRENEUR"} [${m.topic}]: ${m.content}`)
    .join("\n");

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
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(6500),
      body: JSON.stringify({
        model: process.env.EPEW_INTERVIEW_MODEL?.trim() || "gpt-5.6-luna",
        input: `Review this completed EPEW pre-qualification interview for a brand-new entrepreneur. Summarize: the business idea, goal, what is already prepared, what is still needed, target market, commitment/readiness, and what the Personal Coach should focus on first. Then score commitment, organization, communication, leadership, business potential, and readiness from 0 to 10 using only evidence in the transcript. Do not make a qualification decision.\n\nAPPLICATION:\n${JSON.stringify({ name: app.full_name, business_name: app.business_name, category: app.business_category, funding_goal: app.funding_request })}\n\nTRANSCRIPT:\n${transcript}`,
        max_output_tokens: 500,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "epew_prequalification_evaluation",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!api.ok) throw new Error(`evaluation failed: ${api.status}`);
    const payload = await api.json();
    const text = typeof payload.output_text === "string"
      ? payload.output_text
      : (Array.isArray(payload.output)
          ? payload.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []).map((part: any) => part?.text || "").join("")
          : "");
    const parsed = JSON.parse(text);
    return {
      summary: String(parsed.summary || ""),
      scores: normalizeScores(parsed.scores),
    };
  } catch (error) {
    console.error("EPEW completed prequalification evaluation error:", error);
    return {
      summary: "Pre-qualification interview completed. Human review is required for final scoring and next-step preparation.",
      scores: normalizeScores({}),
    };
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
  const hints = [
    app.full_name,
    app.business_name,
    app.business_type,
    app.business_category,
    "EPEW",
    "EDE",
    "IBOS",
    "entrepreneur",
    "business plan",
    "funding",
    "location",
    "marketing",
  ].filter(Boolean).join(",");

  const g = response.gather({
    input: ["speech"],
    action: `${origin}/api/twilio/voice/prequalification-establishment?applicationId=${encodeURIComponent(String(applicationId))}`,
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
      state.current_topic = "rapport_day";
      state.messages.push({
        role: "coach",
        topic: "rapport_day",
        content: opening,
        at: new Date().toISOString(),
      });
      await saveState(id, state, false);
      gather(response, url.origin, id, opening, app, 8);
      return xml(response);
    }

    if (!speech) {
      state.no_input_count += 1;
      if (state.no_input_count >= 2) {
        const goodbye = "I do not seem to be hearing you clearly, so I am going to end this call rather than repeat the question again. We can continue the pre-qualification interview another time. Thank you, and have a blessed day.";
        state.messages.push({
          role: "coach",
          topic: state.current_topic,
          content: goodbye,
          at: new Date().toISOString(),
        });
        await markInterrupted(id, state);
        response.say(voice(), goodbye);
        response.hangup();
        return xml(response);
      }

      const retry = `I may not be hearing you clearly. Let me repeat the question. ${questionFor(state.current_topic, app)}`;
      state.messages.push({
        role: "coach",
        topic: state.current_topic,
        content: retry,
        at: new Date().toISOString(),
      });
      await saveState(id, state, false);
      gather(response, url.origin, id, retry, app, 8);
      return xml(response);
    }

    state.no_input_count = 0;
    state.messages.push({
      role: "entrepreneur",
      topic: state.current_topic,
      content: speech,
      at: new Date().toISOString(),
    });

    if (asksForRepeat(speech)) {
      const repeat = questionFor(state.current_topic, app);
      state.messages.push({
        role: "coach",
        topic: state.current_topic,
        content: repeat,
        at: new Date().toISOString(),
      });
      await saveState(id, state, false);
      gather(response, url.origin, id, repeat, app, 8);
      return xml(response);
    }

    if (asksForMeaning(speech)) {
      const clarification = clarificationFor(state.current_topic, app);
      state.messages.push({
        role: "coach",
        topic: state.current_topic,
        content: clarification,
        at: new Date().toISOString(),
      });
      await saveState(id, state, false);
      gather(response, url.origin, id, clarification, app, 8);
      return xml(response);
    }

    const answeredTopic = state.current_topic;
    const next = nextTopic(answeredTopic);

    if (!next) {
      const evaluation = await evaluateCompletedInterview(app, state);
      state.completed_at = new Date().toISOString();
      state.summary = evaluation.summary;
      state.scores = evaluation.scores;
      await saveState(id, state, true);

      const closing = "Thank you for attending the meeting. We are looking forward to helping you develop and open a successful business. Thank you, and have a blessed day.";
      response.say(voice(), closing);
      response.hangup();
      return xml(response);
    }

    state.current_topic = next;

    let reply = `${acknowledgement(answeredTopic, speech)} `;
    if (answeredTopic === "mission_orientation") {
      reply += `${missionExplanation()} `;
    }
    reply += questionFor(next, app);

    state.messages.push({
      role: "coach",
      topic: next,
      content: reply,
      at: new Date().toISOString(),
    });

    await saveState(id, state, false);
    gather(response, url.origin, id, reply, app, 8);
    return xml(response);
  } catch (error) {
    console.error("EPEW approved prequalification error:", error);
    const response = new twilio.twiml.VoiceResponse();
    response.say(voice(), "I am sorry. I am having trouble continuing the interview right now. We will stop here and continue another time.");
    response.hangup();
    return xml(response, 500);
  }
}
