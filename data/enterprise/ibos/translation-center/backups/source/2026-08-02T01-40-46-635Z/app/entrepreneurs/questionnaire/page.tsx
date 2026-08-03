"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const questions = [
  "Describe your business idea and explain why you want to start this business.",
  "What language are you most comfortable using during your interview and coaching sessions? (English, Haitian Creole, French, Spanish, Tagalog, or another language)",
  "What do you expect from the EPEW team and your assigned coach?",
  "Where do you see yourself and your business in five years?",
  "What problem does your business solve?",
  "Who are your target customers?",
  "What industry are you entering? (Retail, Technology, Food, Consulting, Services, Nonprofit, Education, etc.)",
  "Are you starting completely from scratch, buying an existing business, or expanding an existing business?",
  "What product or service will you offer?",
  "How much funding do you need and why?",
  "How will you use the funding received?",
  "How will your business generate income?",
  "How much time can you commit weekly to building this business?",
  "Who will help you promote or support your business?",
  "Do you currently have a profession or specialized skills? Please describe them.",
  "Are you currently employed or self-employed?",
  "Approximately how much income do you earn per year?",
  "What experience or skills do you have that will help you succeed in this business?",
  "Are you prepared for the possibility of failure, changes, or business pivots?",
  "What are your next three steps before launching?"
];

export default function EntrepreneurQuestionnairePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadQuestionnaire();
  }, []);

  async function loadQuestionnaire() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/entrepreneurs/login");
      return;
    }

    const { data, error } = await supabase
      .from("entrepreneur_applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setApplication(data);

    if (data?.questionnaire_answers) {
      setAnswers(data.questionnaire_answers);
    }

    setLoading(false);
  }

  async function saveQuestionnaire() {
    setSaving(true);
    setMessage("");

    const completedAnswers = answers.filter((answer) => answer.trim() !== "");
    const readinessScore = Math.round((completedAnswers.length / questions.length) * 100);

    const { error } = await supabase
      .from("entrepreneur_applications")
      .update({
        questionnaire_answers: answers,
        readiness_score: readinessScore,
        questionnaire_status:
          readinessScore === 100 ? "Completed" : "In Progress",
      })
      .eq("id", application.id);

    if (error) {
      console.log(error);
      setMessage("There was an error saving your questionnaire.");
    } else {
      setMessage("Questionnaire saved successfully.");
    }

    setSaving(false);
  }

  const completedAnswers = answers.filter((answer) => answer.trim() !== "");
  const readinessScore = Math.round((completedAnswers.length / questions.length) * 100);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <p className="text-3xl font-bold text-[#06245c]">
          Loading questionnaire...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-[#06245c]">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h1 className="text-6xl font-extrabold mb-5">
            Entrepreneur Questionnaire
          </h1>

          <p className="text-2xl text-gray-700">
            Answer these questions to help your coach understand your business,
            evaluate your readiness, and prepare your funding journey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <p className="text-5xl font-bold text-green-700">
             {completedAnswers.length}/{questions.length}
            </p>
            <p className="text-xl font-bold text-gray-700 mt-3">
              Questions Answered
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <p className="text-5xl font-bold text-green-700">
              {readinessScore}%
            </p>
            <p className="text-xl font-bold text-gray-700 mt-3">
              Readiness Score
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <p className="text-4xl font-bold text-green-700">
              {readinessScore === 100 ? "Completed" : "In Progress"}
            </p>
            <p className="text-xl font-bold text-gray-700 mt-3">
              Questionnaire Status
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-8">
            Interview Questions
          </h2>

          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={index}>
                <label className="block text-2xl font-bold mb-3">
                  {index + 1}. {question}
                </label>

                <textarea
                  value={answers[index]}
                  onChange={(e) => {
                    const updatedAnswers = [...answers];
                    updatedAnswers[index] = e.target.value;
                    setAnswers(updatedAnswers);
                  }}
                  className="w-full min-h-[130px] rounded-2xl border border-gray-300 p-5 text-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-green-200"
                  placeholder="Write your answer here..."
                />
              </div>
            ))}
          </div>

          <button
            onClick={saveQuestionnaire}
            disabled={saving || !application}
            className="mt-10 bg-green-700 hover:bg-green-800 text-white text-2xl font-bold px-10 py-4 rounded-2xl disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Questionnaire"}
          </button>

          {message && (
            <p className="mt-6 text-2xl font-bold text-green-700">
              {message}
            </p>
          )}
        </div>

        <div className="bg-[#06245c] text-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold mb-6">
            Coach Evaluation
          </h2>

          <p className="text-2xl text-gray-200">
            Your coach will review your answers, add evaluation notes, and help
            determine whether you are ready for the funding preparation stage.
          </p>

          <div className="bg-white text-[#06245c] rounded-2xl p-6 mt-8">
            <p className="text-2xl">
              <strong>Coach Notes:</strong>{" "}
              {application?.coach_notes || "No coach evaluation added yet."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}