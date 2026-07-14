/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import RegistrationForm from "./components/RegistrationForm";
import ExamScreen from "./components/ExamScreen";
import ResultsScreen from "./components/ResultsScreen";
import { Question, UserData } from "./types";
import { QUESTION_BANK } from "./questionsData";
import { ShieldCheck, Smartphone } from "lucide-react";

type Step = "loading" | "register" | "exam" | "results";

export default function App() {
  const [step, setStep] = useState<Step>("loading");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Results details
  const [correctTotal, setCorrectTotal] = useState(0);
  const [incorrectTotal, setIncorrectTotal] = useState(0);
  const [timeElapsedSeconds, setTimeElapsedSeconds] = useState(0);
  const [answersLog, setAnswersLog] = useState<{ questionId: number; isCorrect: boolean; moduleId: number }[]>([]);

  // Fetch questions from the API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log("Fetching questions from backend...");
        const response = await fetch("/api/questions");
        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.questions)) {
          setAllQuestions(data.questions);
        } else {
          console.warn("Backend questions fetch failed, loading local questions bank.");
          setAllQuestions(QUESTION_BANK);
        }
      } catch (error) {
        console.error("Error fetching questions from API:", error);
        setAllQuestions(QUESTION_BANK);
      } finally {
        setStep("register");
      }
    };

    fetchQuestions();
  }, []);

  const handleStartExam = (data: UserData) => {
    setUserData(data);
    setStep("exam");
  };

  const handleFinishExam = (
    correct: number,
    incorrect: number,
    log: { questionId: number; isCorrect: boolean; moduleId: number }[],
    time: number
  ) => {
    setCorrectTotal(correct);
    setIncorrectTotal(incorrect);
    setAnswersLog(log);
    setTimeElapsedSeconds(time);
    setStep("results");
  };

  const handleRestart = () => {
    setUserData(null);
    setCorrectTotal(0);
    setIncorrectTotal(0);
    setAnswersLog([]);
    setTimeElapsedSeconds(0);
    setStep("register");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center sm:p-4 md:p-6 overflow-y-auto">
      {/* Mobile Viewport Container Simulator with Sleek physical borders */}
      <div className="w-full max-w-md bg-slate-50 rounded-[2.5rem] shadow-2xl border-[8px] border-slate-800 flex flex-col min-h-screen sm:min-h-[820px] overflow-hidden relative shadow-slate-900/30">
        
        {/* Elegant Dynamic Notch & Status Bar */}
        <div className="hidden sm:flex h-9 bg-slate-800 justify-between items-center px-6 text-slate-300 text-[10px] font-bold select-none relative">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-yellow-400" /> Particular</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-28 h-4 bg-slate-800 rounded-b-xl border-x border-b border-slate-700/50"></div>
          <span className="flex items-center gap-1 font-mono text-slate-400">100% ⚡</span>
        </div>

        {/* Corporate Header */}
        <Header />

        {/* Main View Area */}
        <main className="flex-1 p-4 flex flex-col">
          {step === "loading" && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-blue-900 border-t-yellow-400 animate-spin"></div>
              <p className="text-sm font-semibold text-blue-900 tracking-tight">Cargando base de datos vial...</p>
            </div>
          )}

          {step === "register" && (
            <RegistrationForm onStartExam={handleStartExam} />
          )}

          {step === "exam" && userData && (
            <ExamScreen
              userData={userData}
              allQuestions={allQuestions}
              onFinishExam={handleFinishExam}
            />
          )}

          {step === "results" && userData && (
            <ResultsScreen
              userData={userData}
              correctTotal={correctTotal}
              incorrectTotal={incorrectTotal}
              timeElapsedSeconds={timeElapsedSeconds}
              answersLog={answersLog}
              onRestart={handleRestart}
            />
          )}
        </main>

        {/* Footer / System Info conforming to the Sleek Interface design */}
        <footer className="bg-white p-4 border-t border-slate-200 flex justify-between items-center text-left">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Conectado a:</span>
              <span className="text-[11px] font-semibold flex items-center gap-1 text-emerald-600">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Sheets API
              </span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Banco de Preguntas:</span>
              <span className="text-[11px] font-semibold text-slate-600">4 Módulos</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-900 uppercase">TP-PARTICULAR</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Licencia B1</p>
            </div>
          </div>
        </footer>

        {/* Home Indicator Bar on Desktop */}
        <div className="hidden sm:flex h-5 bg-slate-100 border-t border-gray-100 justify-center items-center">
          <div className="w-28 h-1 bg-slate-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
