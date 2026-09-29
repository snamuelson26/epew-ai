import {
  type State,
  type Message,
  questionFor,
  asksForRepeat,
  asksForMeaning,
  clarificationFor,
  nextTopic,
  welcomeAndIntroduction,
  acknowledgement,
  transitionFor,
  coachPreparationSummary,
  missionClarification,
} from "@/lib/interviews/prequalification";
import {
  coachLanguage,
  languageDigit,
  needsLanguageChoice,
  translateCoachText,
} from "@/lib/twilio/coachLanguage";
import { languageMenu } from "./config";
export async function whatsappInterviewTurn(
  state: State,
  app: Parameters<typeof questionFor>[1],
  input: string,
  choosingLanguage: boolean,
) {
  const now = new Date().toISOString();
  const updated: State = { ...state, messages: [...state.messages] };
  const language = coachLanguage(state.language);
  const translate = async (text: string) =>
    language === "en" ? text : translateCoachText(text, language);
  if (updated.completed_at)
    return {
      state: updated,
      reply: await translate(
        "Your interview is complete. Your Personal Coach will review the next steps.",
      ),
      choosingLanguage: false,
      complete: false,
    };
  if (choosingLanguage) {
    const selected = languageDigit(input.trim());
    if (!selected)
      return {
        state: updated,
        reply: languageMenu,
        choosingLanguage: true,
        complete: false,
      };
    updated.language = selected;
    const text =
      questionFor(updated.current_topic, app) +
      " You may reply with text or a short voice note. Send LANGUAGE to change languages, or REPEAT to repeat the question.";
    return {
      state: updated,
      reply:
        selected === "en" ? text : await translateCoachText(text, selected),
      choosingLanguage: false,
      complete: false,
    };
  }
  if (
    input.trim().toUpperCase() === "LANGUAGE" ||
    needsLanguageChoice(input, "")
  )
    return {
      state: updated,
      reply: languageMenu,
      choosingLanguage: true,
      complete: false,
    };
  if (input.trim().toUpperCase() === "REPEAT")
    return {
      state: updated,
      reply: await translate(questionFor(updated.current_topic, app)),
      choosingLanguage: false,
      complete: false,
    };
  const english =
    language === "en" ? input : await translateCoachText(input, "en");
  if (needsLanguageChoice(english, ""))
    return {
      state: updated,
      reply: languageMenu,
      choosingLanguage: true,
      complete: false,
    };
  if (asksForRepeat(english) || asksForMeaning(english))
    return {
      state: updated,
      reply: await translate(
        asksForRepeat(english)
          ? questionFor(updated.current_topic, app)
          : clarificationFor(updated.current_topic),
      ),
      choosingLanguage: false,
      complete: false,
    };
  const answer: Message = {
    role: "entrepreneur",
    topic: updated.current_topic,
    content: input,
    english_translation: english,
    language,
    at: now,
  };
  updated.messages.push(answer);
  const answered = updated.current_topic;
  const next = nextTopic(answered, app, english);
  if (!next) {
    updated.completed_at = now;
    return {
      state: updated,
      reply: await translate(
        "Thank you. Your interview is complete and will be reviewed by your Personal Coach.",
      ),
      choosingLanguage: false,
      complete: true,
    };
  }
  updated.current_topic = next;
  let reply =
    answered === "business_verification"
      ? welcomeAndIntroduction()
      : `${acknowledgement(answered, english)} ${transitionFor(next)} ${next === "mission_orientation" ? coachPreparationSummary() : ""} ${answered === "mission_orientation" ? missionClarification() : ""} ${questionFor(next, app)}`.trim();
  updated.messages.push({
    role: "coach",
    topic: next,
    content: reply,
    language,
    at: now,
  });
  reply = await translate(reply);
  return { state: updated, reply, choosingLanguage: false, complete: false };
}
