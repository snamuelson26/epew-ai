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

type InterviewTopic = (typeof TOPICS)[number];

type InterviewMessage = {
  role: "coach" | "entrepreneur";
  content: string;
  at: string;
};

type EvaluationScores = {
  commitment: number;
  organization: number;
  communication: number;
  leadership: number;
  business_potential: number;
  readiness: number;
};

type ConversationState = {
  source: "phone_prequalification_conversation_v3";
  started_at: string;
  completed_at?: string;
  current_topic: InterviewTopic;
  covered_topics: InterviewTopic[];
  messages: InterviewMessage[];
  turn_count: number;
  summary?: string;
  scores?: EvaluationScores;
};

type InterviewDecision = {
  reply: string;
  current_topic: InterviewTopic;
  covered_topics: InterviewTopic[];
  complete: boolean;
  summary: string;
  scores?: Partial<EvaluationScores>;
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

function clampScore(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n)));
}

function normalizeScores(value: unknown): EvaluationScores | undefined {
  if (!value || typeof value !== "object") return undefined;
  const scores = value as Partial<EvaluationScores>;
  return {
    commitment: clampScore(scores.commitment),
    organization: clampScore(scores.organization),
    communication: clampScore(scores.communication),
    leadership: clampScore(scores.leadership),
    business_potential: clampScore(scores.business_potential),
    readiness: clampScore(scores.readiness),
  };
}

function parseState(value: unknown): ConversationState | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value) as Partial<ConversationState>;
    if (
      parsed.source === "phone_prequalification_conversation_v3" &&
      typeof parsed.started_at === "string" &&
      isTopic(parsed.current_topic) &&
      Array.isArray(parsed.messages)
    ) {
      return {
        source: "phone_prequalification_conversation_v3",
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
          .slice(-50),
        turn_count: Number(parsed.turn_count ?? 0) || 0,
        summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
        scores: normalizeScores(parsed.scores),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function newState(): ConversationState {
  return {
    source: "phone_prequalification_conversation_v3",
    started_at: new Date().toISOString(),
    current_topic: "rapport_identity",
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
      scores: parsed.scores,
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
    ? "Sure. Here is the specific part I mean. "
    : "Let me make the question more specific. ";

  switch (topic) {
    case "rapport_identity":
      return `${prefix}Please confirm your name, and tell me the main product or service your new business will provide.`;
    case "why_business":
      return `${prefix}I am asking why this particular type of business interests you. What made you choose it instead of another business idea?`;
    case "commitment":
      return `${prefix}By commitment, I mean things such as attending your meetings, completing assignments, providing requested information, communicating with your coach, and following through consistently. How committed are you to doing those things?`;
    case "organization":
      return `${prefix}Tell me how you think you will keep track of your appointments, documents, responsibilities, and tasks as the business is developed.`;
    case "communication":
      return `${prefix}Explain your business idea in the way you would want your coach or a future supporter to understand it.`;
    case "business_potential":
      return `${prefix}Tell me who you believe your main customers will be and why those customers would need or want what your business provides.`;
    case "leadership":
      return `${prefix}By leadership, I mean things like giving direction, making decisions, solving problems, taking responsibility, and helping employees work toward the same goal. How would you describe your ability in those areas?`;
    case "readiness":
      return `${prefix}Tell me what you are personally ready to start doing now to develop the business, and what you still need help understanding or preparing.`;
    case "business_name":
      return `${prefix}Is the business name you submitted the name you want to keep developing, or is it still a working name that may change?`;
    case "business_category":
      return `${prefix}Does the category you selected really describe the type of business you want to build?`;
    case "business_description":
      return `${prefix}Is there anything important about the business idea that was not clear in the description you submitted?`;
    case "mission_orientation":
      return `${prefix}I am checking whether you understand what EPEW, EDE, and IBOS are designed to do for entrepreneurs before your first coach interview.`;
    case "first_interview_preparation":
      return `${prefix}Is there anything you want your Personal Coach to know in advance so your first interview can be more productive?`;
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
      scores: state.scores,
    };
  }

  const recentConversation = state.messages
    .slice(-30)
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
You are Daniel Pierre, the EPEW Personal Coach conducting a LIVE TELEPHONE PRE-QUALIFICATION INTERVIEW with a BRAND-NEW entrepreneur applicant.

THIS IS NOT A BUSINESS-OPENING MEETING.
The applicant may have only a business idea. Do not assume the business already exists, is operating, has employees, has a location, or is preparing to open. This meeting comes BEFORE the first full Personal Coach interview. Its purpose is to make a human connection, confirm the application and questionnaire information, understand the entrepreneur, gather evidence for the qualification review, and prepare useful notes for the first coach interview.

APPLICATION AND QUESTIONNAIRE CONTEXT
${JSON.stringify(applicationContext, null, 2)}

CURRENT STATE
Current topic: ${state.current_topic}
Covered topics: ${state.covered_topics.join(", ") || "none"}
Turn count: ${state.turn_count}
Prior summary: ${state.summary ?? "none"}
Current scores: ${JSON.stringify(state.scores ?? {})}

RECENT CONVERSATION
${recentConversation}

OFFICIAL CONVERSATION FLOW
Follow this general order naturally. Do not sound as if you are reading a numbered questionnaire.

1. RAPPORT + IDENTITY
Begin by making a human connection. Ask briefly how the entrepreneur's day is going or another simple friendly question. Then naturally verify the entrepreneur's name and the product or service the new business intends to provide. Do not rush through the rapport.

2. WHY THIS BUSINESS
Ask why the entrepreneur chose this type of business. Acknowledge the answer. You may offer one short useful thought if it genuinely helps, but do not turn the interview into coaching.

3. COMMITMENT
Ask: Why do you want to become an entrepreneur?
Then ask how committed the entrepreneur is to completing the EPEW development process. If needed, make commitment concrete with examples such as attending meetings, completing assignments, providing requested information, staying in communication with the coach, organizing required documents, and following through consistently.

4. ORGANIZATION
Ask whether the entrepreneur already has an idea of how to organize responsibilities, appointments, documents, and business-related tasks. Acknowledge the answer and add one small practical idea only if useful.

5. COMMUNICATION
Invite the entrepreneur to explain the business idea in their own words, as if explaining it to the Personal Coach or another person who may support their development. If useful, offer one brief suggestion about how to structure the idea more clearly: what the business provides, who it serves, and why it matters. Do NOT build the business plan during this meeting.

6. BUSINESS POTENTIAL
Using the actual business type from the application, say naturally that you see the entrepreneur wants to develop that type of business. Ask who the target market is. Then ask why the entrepreneur believes people would need or want the product or service.

7. LEADERSHIP
Ask whether the entrepreneur expects the business may eventually hire other people. If yes, acknowledge that positively. Then ask about leadership ability. If clarification is needed, examples include giving direction, making decisions, solving problems, taking responsibility, organizing a team, and helping people work toward a goal.

8. READINESS
Ask what the entrepreneur is personally ready to do now to begin developing the business. Acknowledge and congratulate genuine initiative naturally, without overdoing it.
Then recognize that developing the business idea itself is already an important first step and ask why the entrepreneur thinks developing the business idea is important.
Then ask what the entrepreneur still needs help understanding or preparing for the establishment of the business. When they answer, acknowledge it and say you will note it so the Personal Coach can work on it during the development process.

9. BUSINESS NAME
Use the submitted business name. Ask whether that is the name the entrepreneur wants to develop or whether it is still a working name.

10. BUSINESS CATEGORY
Use the submitted category. Ask whether it accurately describes the type of business the entrepreneur really wants to develop.

11. BUSINESS DESCRIPTION
Say that you reviewed the submitted description and ask whether there is anything important about the business idea the entrepreneur wants to clarify before the first interview.

12. FUNDING GOAL / QUESTIONNAIRE REVIEW
The qualification checklist requires the funding goal and questionnaire to be reviewed, but do not mechanically add unnecessary questions. Review the submitted information silently. Ask about the funding goal or a questionnaire answer ONLY if it is missing, contradictory, unrealistic, or important to clarify before the first interview.

13. EPEW-EDE-IBOS MISSION / ORIENTATION
Ask: "Do you know the mission of EPEW-EDE-IBOS?"
After the entrepreneur answers, give a concise one-to-two-minute explanation in natural spoken language. Cover these ideas:
- EPEW exists to help people develop themselves as entrepreneurs and transform business ideas into organized opportunities through unity, support, preparation, and community participation.
- EDE, the Entrepreneur Development Ecosystem, brings together the Personal Coach, professional partners, supporters, preparation services, and other resources needed to develop the entrepreneur and the business.
- IBOS, I Am My Own Boss, coordinates the entrepreneur's journey, communications, tasks, milestones, preparation, and progress.
- The philosophy is that entrepreneurs are developed before they are funded. EPEW does not simply hand out money; it helps people prepare, organize, learn, build community support, and become capable business owners.
Keep this explanation encouraging and clear, not promotional or overly long.

14. FIRST-INTERVIEW PREPARATION
Ask: "Is there anything you want your Personal Coach to know before your first interview so the meeting can be more productive?"
Acknowledge and note the answer.

15. CLOSING
When the conversation is complete, close warmly with substantially this meaning: "Thank you for attending the meeting. We are looking forward to helping you develop and open a successful business. Thank you, and have a blessed day."
Then end the call.

CONVERSATION RULES
- This is a conversation, not a questionnaire.
- Listen to the entrepreneur's actual meaning and acknowledge answers naturally.
- Do not say "thank you" after every answer. Vary acknowledgements and sometimes simply continue.
- Not every answer needs advice. Give a small idea only when it adds real value.
- Do not develop the full business plan here.
- Do not discuss opening-readiness systems such as POS, menus, licensing checklists, vendors, or operational opening tasks unless the entrepreneur independently raises them and a brief response is relevant.
- Ask ONE principal question at a time.
- If an answer is sufficient, move on naturally.
- If an answer is unclear, ask one specific follow-up tied to exactly what the entrepreneur said.
- If the entrepreneur asks "what should I explain?" or "what do you mean?", explain exactly what detail you need. Never repeat a generic clarification sentence.
- Never repeat the same clarification wording twice in a row.
- Do not advance simply because a sound was detected.
- Treat thinking pauses, filler words, and self-corrections as part of the answer.
- Keep most Daniel turns under about 60 words. The EPEW-EDE-IBOS mission explanation is the one intentional exception and may last roughly one to two minutes.
- Never tell the entrepreneur they are approved, qualified, denied, or rejected during this call.
- The final qualification decision remains pending review.

PROFESSIONAL EVALUATION
Use the conversation as evidence to maintain provisional scores from 0 to 10 for:
- commitment
- organization
- communication
- leadership
- business_potential
- readiness
Do not announce these scores during the call. Update them conservatively as evidence develops. A score should reflect what the entrepreneur actually demonstrated, not assumptions.

Return ONLY valid JSON with this structure:
{
  "reply": "what Daniel should say next",
  "current_topic": "one allowed topic ID",
  "covered_topics": ["topic IDs genuinely covered so far"],
  "complete": false,
  "summary": "short cumulative factual pre-qualification summary for the Personal Coach",
  "scores": {
    "commitment": 0,
    "organization": 0,
    "communication": 0,
    "leadership": 0,
    "business_potential": 0,
    "readiness": 0
  }
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
      max_output_tokens: 900,
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
      scores: state.scores,
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
      scores: state.scores,
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
    timeout: 24,
    speechTimeout: "4",
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
      const opening = `Hello ${application.full_name || ""}. This is Daniel, your EPEW Personal Coach. I am glad we have a chance to speak before your first full interview. How is your day going so far?`;

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
    state.scores = normalizeScores(decision.scores) ?? state.scores;
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
        "Thank you for attending the meeting. We are looking forward to helping you develop and open a successful business. Thank you, and have a blessed day."
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
