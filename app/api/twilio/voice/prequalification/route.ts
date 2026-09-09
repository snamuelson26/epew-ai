import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTwilioWebhook } from "@/lib/twilio/validateTwilioWebhook";

const QUESTIONS = [
  {
    id: "identity_business",
    prompt:
      "Please confirm your full name and the name of the business you are applying with.",
  },
  {
    id: "business_description",
    prompt:
      "In your own words, what business are you building, and what product or service will it provide?",
  },
  {
    id: "current_condition",
    prompt:
      "What is the current condition of the business today? Please tell me what has already been completed and what is still missing.",
  },
  {
    id: "readiness",
    prompt:
      "How prepared are you to begin operating the business, and what important steps must still be completed before opening?",
  },
  {
    id: "financial_need",
    prompt:
      "What amount of financial support are you seeking, and what are the most important things that money will be used for?",
  },
  {
    id: "support_readiness",
    prompt:
      "EPEW expects entrepreneurs to build a community of supporters. How prepared are you to communicate with potential supporters and work toward the required twenty support units?",
  },
  {
    id: "obstacles_risks",
    prompt:
      "What are the biggest obstacles, risks, or missing information that could delay your business?",
  },
  {
    id: "commitment",
    prompt:
      "Why are you committed to this business, and what will you personally do to make it successful?",
  },
] as const;

type SavedAnswer = {
  id: string;
  question: string;
  answer: string;
};

type PhoneInterviewState = {
  source: "phone_prequalification_v1";
  started_at: string;
  completed_at?: string;
  answers: SavedAnswer[];
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

function parseState(value: unknown): PhoneInterviewState | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value) as Partial<PhoneInterviewState>;
    if (
      parsed.source === "phone_prequalification_v1" &&
      Array.isArray(parsed.answers) &&
      typeof parsed.started_at === "string"
    ) {
      return parsed as PhoneInterviewState;
    }
  } catch {
    return null;
  }

  return null;
}

async function loadApplication(applicationId: number) {
  const { data, error } = await supabaseAdmin
    .from("entrepreneur_applications")
    .select(
      "id,full_name,business_name,questionnaire_status,qualification_status,interview_status,interview_type,interview_notes,assigned_coach_name"
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function saveAnswer(
  applicationId: number,
  state: PhoneInterviewState,
  questionIndex: number,
  answer: string
) {
  const question = QUESTIONS[questionIndex];
  if (!question) return state;

  const nextAnswers = state.answers.filter((item) => item.id !== question.id);
  nextAnswers.push({
    id: question.id,
    question: question.prompt,
    answer,
  });

  const nextState: PhoneInterviewState = {
    ...state,
    answers: nextAnswers,
  };

  const { error } = await supabaseAdmin
    .from("entrepreneur_applications")
    .update({
      interview_notes: JSON.stringify(nextState),
      interview_status: "In Progress",
      interview_type: "phone",
      review_status: "Interview In Progress",
    })
    .eq("id", applicationId);

  if (error) throw error;
  return nextState;
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
    const nextQuestionIndex = Number(url.searchParams.get("q") ?? "0");
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

    let state =
      parseState(application.interview_notes) ?? {
        source: "phone_prequalification_v1" as const,
        started_at: new Date().toISOString(),
        answers: [],
      };

    if (nextQuestionIndex === 0 && state.answers.length === 0) {
      const { error } = await supabaseAdmin
        .from("entrepreneur_applications")
        .update({
          interview_status: "In Progress",
          interview_type: "phone",
          review_status: "Interview In Progress",
          interview_notes: JSON.stringify(state),
        })
        .eq("id", applicationId);

      if (error) throw error;

      response.say(
        voice(),
        `Welcome to your EPEW pre-qualification interview. This interview will help us understand your readiness, your business, your support needs, and any issues that should be reviewed before a qualification decision. Please answer each question in your own words.`
      );
    }

    if (nextQuestionIndex > 0) {
      const answerIndex = nextQuestionIndex - 1;

      if (!speech) {
        const retry = response.gather({
          input: ["speech"],
          action: `${url.origin}/api/twilio/voice/prequalification?applicationId=${encodeURIComponent(
            String(applicationId)
          )}&q=${nextQuestionIndex}`,
          method: "POST",
          timeout: 12,
          speechTimeout: "auto",
          actionOnEmptyResult: true,
        });

        retry.say(
          voice(),
          `I did not hear your answer clearly. ${QUESTIONS[answerIndex]?.prompt ?? "Please answer the question again."}`
        );
        return twimlResponse(response);
      }

      state = await saveAnswer(applicationId, state, answerIndex, speech);
    }

    if (nextQuestionIndex >= QUESTIONS.length) {
      const completedState: PhoneInterviewState = {
        ...state,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from("entrepreneur_applications")
        .update({
          interview_status: "Completed",
          interview_type: "phone",
          review_status: "Interview Completed",
          qualification_status: "Pending Review",
          application_decision: "Pending",
          interview_notes: JSON.stringify(completedState),
        })
        .eq("id", applicationId);

      if (error) throw error;

      response.say(
        voice(),
        `Thank you. Your EPEW pre-qualification interview is complete. Your responses will now be reviewed together with your application and questionnaire before a qualification decision is made. No qualification decision is being made automatically from this call.`
      );
      response.hangup();
      return twimlResponse(response);
    }

    const question = QUESTIONS[nextQuestionIndex];
    const gather = response.gather({
      input: ["speech"],
      action: `${url.origin}/api/twilio/voice/prequalification?applicationId=${encodeURIComponent(
        String(applicationId)
      )}&q=${nextQuestionIndex + 1}`,
      method: "POST",
      timeout: 12,
      speechTimeout: "auto",
      actionOnEmptyResult: true,
    });

    gather.say(voice(), question.prompt);
    return twimlResponse(response);
  } catch (error) {
    console.error("EPEW phone pre-qualification interview error:", error);

    const response = new twilio.twiml.VoiceResponse();
    response.say(
      voice(),
      "I am sorry. I am having trouble continuing the EPEW pre-qualification interview right now. Please try again later."
    );
    return twimlResponse(response, 500);
  }
}
