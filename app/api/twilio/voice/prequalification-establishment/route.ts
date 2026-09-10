import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";

const TOPICS = [
  "business_verification",
  "commitment_reason",
  "commitment_process",
  "organization",
  "new_business_location",
  "existing_address",
  "existing_duration",
  "existing_performance",
  "existing_logo",
  "existing_logo_upload",
  "existing_website",
  "existing_website_url",
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
  source: "phone_prequalification_approved_v5";
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
    source: "phone_prequalification_approved_v5",
    started_at: new Date().toISOString(),
    current_topic: "business_verification",
    messages: [],
    no_input_count: 0,
  };
}

function parseState(value: unknown): State | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const p = JSON.parse(value) as Partial<State>;
    if (
      p.source !== "phone_prequalification_approved_v5" ||
      !isTopic(p.current_topic) ||
      !Array.isArray(p.messages) ||
      typeof p.started_at !== "string"
    ) return null;

    return {
      source: "phone_prequalification_approved_v5",
      started_at: p.started_at,
      current_topic: p.current_topic,
      messages: (p.messages as Message[]).slice(-90),
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
    .select("id,full_name,business_name,business_type,business_category,business_description,funding_request,questionnaire_answers,questionnaire_status,interview_notes,address,street_address,city,state,address_country,enterprise_country,business_city,business_state,opened_business,business_opening_date,grand_opening_date")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateApplicationWithRetry(id: number, update: Record<string, unknown>) {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { error } = await supabaseAdmin.from("entrepreneur_applications").update(update).eq("id", id);
    if (!error) return;
    lastError = error;
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 300));
  }
  throw lastError;
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

  await updateApplicationWithRetry(id, update);
}

async function markInterrupted(id: number, state: State) {
  await updateApplicationWithRetry(id, {
    interview_notes: JSON.stringify(state),
    interview_type: "phone",
    interview_status: "Pending",
    review_status: "Pending Review",
    qualification_status: "Pending Review",
  });
}

function isExistingBusiness(app: any) {
  if (app.opened_business === true) return true;
  const type = String(app.business_type || "").toLowerCase();
  return type.includes("existing") || type.includes("established") || type.includes("operating") || type.includes("open business");
}

function isNegativeAnswer(speech: string) {
  const normalized = speech.trim().toLowerCase();
  return /^(no|nope|not yet|i don't|i do not|none|nothing)\b/.test(normalized);
}

function nextTopic(topic: Topic, app: any, speech = ""): Topic | null {
  const existing = isExistingBusiness(app);
  let i = TOPICS.indexOf(topic) + 1;

  if (topic === "existing_logo" && isNegativeAnswer(speech)) {
    i = TOPICS.indexOf("existing_website");
  }
  if (topic === "existing_website" && isNegativeAnswer(speech)) {
    i = TOPICS.indexOf("communication");
  }

  while (i < TOPICS.length) {
    const candidate = TOPICS[i];
    if (existing && candidate === "new_business_location") {
      i += 1;
      continue;
    }
    if (!existing && [
      "existing_address",
      "existing_duration",
      "existing_performance",
      "existing_logo",
      "existing_logo_upload",
      "existing_website",
      "existing_website_url",
    ].includes(candidate)) {
      i += 1;
      continue;
    }
    return candidate;
  }
  return null;
}

function businessIdFor(app: any) {
  const match = String(app.business_name || "").match(/\b[A-Z]{2,6}-\d{2,6}\b/i);
  return match ? match[0].toUpperCase() : `EPEW-${app.id}`;
}

function displayBusinessName(app: any) {
  const businessId = businessIdFor(app);
  return String(app.business_name || "your business")
    .replace(new RegExp(`\\s*[—–-]?\\s*${businessId.replace("-", "\\-")}\\s*$`, "i"), "")
    .trim();
}

function existingAddressFor(app: any) {
  const parts = [
    app.street_address || app.address,
    app.business_city || app.city,
    app.business_state || app.state,
    app.enterprise_country || app.address_country,
  ].filter((v) => String(v || "").trim());
  return parts.join(", ");
}

function openingFor(app: any) {
  const name = String(app.full_name || "Entrepreneur").trim();
  const business = displayBusinessName(app);
  const businessId = businessIdFor(app);
  return `Hello ${name}. This is Daniel, your AI EPEW Coach Assistant. I am calling to help prepare you for your first interview with your Personal Coach. I have your business listed as ${business}, Business ID ${businessId}. Is that correct?`;
}

function welcomeAndIntroduction() {
  return "Wonderful. Welcome to the EPEW family. Before we begin, I want you to know what this process is about. EPEW helps entrepreneurs turn a business idea into a well-prepared business through guidance, structure, unity, and community support. EDE brings together the people and resources that can help your development, including your Personal Coach, professional partners, and supporters. IBOS, which means I Am My Own Boss, helps organize your journey, communication, tasks, milestones, and progress. Our philosophy is simple: we help develop the entrepreneur and the business idea before funding. This conversation will help your Personal Coach understand where you are now and how to make your first interview more productive. Now, let us begin with your commitment. Why do you want to become an entrepreneur?";
}

function questionFor(topic: Topic, app: any): string {
  const submittedName = displayBusinessName(app);
  const category = String(app.business_category || app.business_type || "the category you selected");
  const type = String(app.business_category || app.business_type || "business");
  const address = existingAddressFor(app);

  switch (topic) {
    case "business_verification": return openingFor(app);
    case "commitment_reason": return "Why do you want to become an entrepreneur?";
    case "commitment_process": return "How committed are you to completing the EPEW development process? For example, are you ready to attend meetings, complete assignments, provide requested information, and stay in communication with your Personal Coach?";
    case "organization": return "Do you have an idea of how you will organize your responsibilities, appointments, documents, and business-related tasks?";
    case "new_business_location": return "Where do you want to open the business? Please tell me the country, state, and city.";
    case "existing_address": return address
      ? `I have the business address as ${address}. Is that correct?`
      : "What is the current address of the business?";
    case "existing_duration": return "How long has the business been open?";
    case "existing_performance": return "How is the business doing so far?";
    case "existing_logo": return "Do you have a logo for your business?";
    case "existing_logo_upload": return "Can you please upload the logo in your EPEW portal?";
    case "existing_website": return "Do you have a website for your business?";
    case "existing_website_url": return "What is your website address?";
    case "communication": return "Can you explain your business idea? Please share the business development idea that you want your coach and future supporters to understand.";
    case "target_market": return `I see you want to establish a ${type}. Who is your target market?`;
    case "market_need": return "Why do you believe people will need or want your service or product?";
    case "leadership_hiring": return "Are you planning to hire other people in your business?";
    case "leadership_ability": return "Tell me a little about your leadership ability.";
    case "readiness_now": return "What are you personally ready and committed to do now?";
    case "readiness_recognition": return "You have already started developing the idea, which is one of the most important first steps. Do you agree?";
    case "idea_importance": return "Why do you think developing the business idea is so important?";
    case "establishment_needs": return "What do you think you still need help understanding or preparing for the establishment of your business?";
    case "business_name": return `You submitted the business name ${submittedName}. Is that the name you want to develop, or is it still a working name?`;
    case "business_category": return `You selected ${category}. Does that accurately describe the type of business you really want to develop?`;
    case "business_description": return "I reviewed your description. Is there anything important about the business idea that you want to clarify before your first interview?";
    case "mission_orientation": return "Before we finish, do you understand the mission of EPEW, EDE, and IBOS, or would you like me to clarify any part of it?";
    case "first_interview_preparation": return "Is there anything you want your Personal Coach to know before your first interview so the meeting can be more productive?";
  }
}

function clarificationFor(topic: Topic): string {
  switch (topic) {
    case "commitment_process": return "For example, are you ready to attend your meetings, complete the work your coach gives you, provide information when requested, and stay involved until your business is developed?";
    case "organization": return "I simply mean this: do you already have a way to keep track of your appointments, papers, and business tasks?";
    case "new_business_location": return "Just tell me the country first, then the state, and then the city where you want the business to operate.";
    case "existing_address": return "I only need to confirm the current business location.";
    case "existing_duration": return "For example, you can tell me the number of months or years the business has been operating.";
    case "existing_performance": return "You can simply tell me whether the business is doing well, struggling, growing, or still trying to become stable.";
    case "existing_logo": return "I am only asking whether your business already has a logo.";
    case "existing_logo_upload": return "You can upload the logo through your EPEW entrepreneur portal so your Personal Coach can use it while preparing your business materials.";
    case "existing_website": return "I am only asking whether the business currently has a website.";
    case "existing_website_url": return "Please tell me the website address, for example, yourbusiness dot com.";
    case "communication": return "You can keep it simple. Tell me what you want the business to do, who you want to serve, and what makes the idea important to you.";
    case "leadership_ability": return "For example, leadership can mean making decisions, organizing people, solving problems, taking responsibility, and helping a team work together.";
    case "establishment_needs": return "For example, you may need help with the business idea, planning, financing, location, licensing, marketing, staffing, or deciding what should come first.";
    default: return "Please answer in the way that best describes your situation.";
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

function acknowledgement(topic: Topic, speech: string): string {
  const negative = isNegativeAnswer(speech);

  switch (topic) {
    case "business_verification": return "Wonderful.";
    case "commitment_reason": return "Thank you. That helps us understand your motivation.";
    case "commitment_process": return "Good. Your level of commitment will help your coach understand how to work with you.";
    case "organization": return negative ? "That is okay. Your Personal Coach can help you create a simple way to stay organized." : "Good. Having a simple way to stay organized will help you throughout the process.";
    case "new_business_location": return "Thank you. I will include that location in your preparation notes.";
    case "existing_address": return "Thank you. I have noted the business location.";
    case "existing_duration": return "Excellent. That gives us a better picture of the history and experience behind your business.";
    case "existing_performance": return "Thank you. That gives your Personal Coach useful background about how the business is doing today.";
    case "existing_logo": return negative ? "That is okay. Your Personal Coach can help you think about branding later." : "Excellent. Having a logo already gives your coach something concrete to build from.";
    case "existing_logo_upload": return "Great. Having the logo in your portal will make it easier for your coach to prepare your business materials.";
    case "existing_website": return negative ? "That is okay. A website can be discussed later as part of the business development process." : "Very good. An existing website can help your coach understand how the business is currently presented to the public.";
    case "existing_website_url": return "Thank you. I will include the website in your preparation notes.";
    case "communication": return "Thank you. That gives us a clearer picture of the business idea you want to develop.";
    case "target_market": return "Good. Knowing who you want to serve is an important part of developing the idea.";
    case "market_need": return "Thank you. That helps explain the need for the business.";
    case "leadership_hiring": return negative ? "All right." : "Great.";
    case "leadership_ability": return "Thank you. I will include that in your preparation notes.";
    case "readiness_now": return "Congratulations. Taking action and making time for the business are important signs of readiness.";
    case "readiness_recognition": return "Exactly.";
    case "idea_importance": return "Very good. A strong business idea gives direction to everything that follows.";
    case "establishment_needs": return "Great. I will note that for you so your Personal Coach can help you with it.";
    case "business_name": return "Thank you.";
    case "business_category": return "Good.";
    case "business_description": return "Thank you. I will include that in the notes.";
    case "mission_orientation": return "Thank you.";
    case "first_interview_preparation": return "Thank you. I will make sure your Personal Coach has that information before the interview.";
  }
}

function transitionFor(next: Topic) {
  if (next === "new_business_location") return "Before we discuss the business idea, I would like to understand where you plan to establish it.";
  if (next === "existing_address") return "Before we discuss the business idea, I would like to confirm a few details about the business as it operates today.";
  if (next === "existing_logo") return "Now I would like to confirm a couple of business identity items.";
  if (next === "communication") return "Now let us focus on the business idea you want to develop.";
  if (next === "leadership_hiring") return "Now I would like to understand a little about how you see yourself leading the business.";
  if (next === "readiness_now") return "Let us talk about your readiness to move forward.";
  return "";
}

function missionClarification() {
  return "EPEW is focused on developing entrepreneurs, not simply giving money to a business. The vision is to help people become capable business owners who can create income, opportunity, and stronger communities. EDE is the support environment around the entrepreneur, connecting coaching, professional assistance, supporters, and resources. IBOS, I Am My Own Boss, is the organized journey that keeps the entrepreneur connected to the process, responsibilities, milestones, and progress. The philosophy behind all three is unity and support: the entrepreneur is not expected to build alone, but the entrepreneur must remain committed, involved, and responsible for developing the business. That is why this pre-qualification conversation is preparing your Personal Coach to begin with the right information.";
}

function coachPreparationSummary() {
  return "I think we now have enough information to help your Personal Coach begin drafting your business plan and prepare for your first interview.";
}

async function evaluateCompletedInterview(app: any, state: State) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { summary: "Pre-qualification interview completed. Human review required.", scores: normalizeScores({}) };

  const transcript = state.messages.map((m) => `${m.role === "coach" ? "COACH ASSISTANT" : "ENTREPRENEUR"} [${m.topic}]: ${m.content}`).join("\n");
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
        input: `Review this completed EPEW pre-qualification interview. Summarize the entrepreneur's motivation and commitment, organization, business status and location, existing brand assets and website when applicable, business idea, target market, customer need, leadership, readiness, what still needs to be prepared, confirmed business name/category/description, and what the Personal Coach should focus on first. Score commitment, organization, communication, leadership, business potential, and readiness from 0 to 10 using only transcript evidence. Do not make a qualification decision.\n\nAPPLICATION:\n${JSON.stringify({ name: app.full_name, business_name: app.business_name, category: app.business_category, funding_goal: app.funding_request })}\n\nTRANSCRIPT:\n${transcript}`,
        max_output_tokens: 500,
        text: { verbosity: "low", format: { type: "json_schema", name: "epew_prequalification_evaluation", strict: true, schema } },
      }),
    });

    if (!api.ok) throw new Error(`evaluation failed: ${api.status}`);
    const payload = await api.json();
    const text = typeof payload.output_text === "string"
      ? payload.output_text
      : Array.isArray(payload.output)
        ? payload.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []).map((part: any) => part?.text || "").join("")
        : "";
    const parsed = JSON.parse(text);
    return { summary: String(parsed.summary || ""), scores: normalizeScores(parsed.scores) };
  } catch (error) {
    console.error("EPEW completed prequalification evaluation error:", error);
    return { summary: "Pre-qualification interview completed. Human review required.", scores: normalizeScores({}) };
  }
}

function gather(response: twilio.twiml.VoiceResponse, origin: string, id: number, prompt: string, app: any, timeout = 8) {
  const hints = [app.full_name, displayBusinessName(app), businessIdFor(app), app.business_type, app.business_category, app.business_city, app.business_state, app.city, app.state, app.enterprise_country, app.address_country, "EPEW", "EDE", "IBOS", "entrepreneur"].filter(Boolean).join(",");
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
      const opening = openingFor(app);
      state.current_topic = "business_verification";
      state.messages.push({ role: "coach", topic: "business_verification", content: opening, at: new Date().toISOString() });
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
    const next = nextTopic(answered, app, speech);

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
    let reply = "";

    if (answered === "business_verification") {
      reply = welcomeAndIntroduction();
    } else {
      reply = acknowledgement(answered, speech);
      const transition = transitionFor(next);
      if (transition) reply = `${reply} ${transition}`;
      if (next === "mission_orientation") reply = `${reply} ${coachPreparationSummary()}`;
      if (answered === "mission_orientation") reply = `${reply} ${missionClarification()}`;
      reply = `${reply} ${questionFor(next, app)}`.trim();
    }

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
