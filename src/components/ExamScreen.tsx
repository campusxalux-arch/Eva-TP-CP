/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Question, UserData } from "../types";
import { CheckCircle2, XCircle, Clock, User, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExamScreenProps {
  userData: UserData;
  allQuestions: Question[];
  onFinishExam: (correctCount: number, incorrectCount: number, answersLog: { questionId: number; isCorrect: boolean; moduleId: number }[], timeElapsedSeconds: number) => void;
}

export default function ExamScreen({ userData, allQuestions, onFinishExam }: ExamScreenProps) {
  // 1. Prepare 40 randomized questions (10 per module)
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  
  // Keep track of answer history for modular breakdown
  const [answersLog, setAnswersLog] = useState<{ questionId: number; isCorrect: boolean; moduleId: number }[]>([]);

  // Timer
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize and select questions
  useEffect(() => {
    // Split questions by module
    const m1 = allQuestions.filter((q) => q.moduleId === 1);
    const m2 = allQuestions.filter((q) => q.moduleId === 2);
    const m3 = allQuestions.filter((q) => q.moduleId === 3);
    const m4 = allQuestions.filter((q) => q.moduleId === 4);

    // Shuffle helper
    const shuffle = (array: any[]) => {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // Pick 10 random from each, with fallbacks if there aren't enough
    const pick10 = (moduleQuestions: Question[]) => {
      const shuffled = shuffle(moduleQuestions);
      return shuffled.slice(0, Math.min(10, shuffled.length));
    };

    const selectedM1 = pick10(m1);
    const selectedM2 = pick10(m2);
    const selectedM3 = pick10(m3);
    const selectedM4 = pick10(m4);

    // Combine and shuffle the entire selected set of 40 questions
    const finalExam = shuffle([
      ...selectedM1,
      ...selectedM2,
      ...selectedM3,
      ...selectedM4,
    ]);

    // Ensure we have exactly 40 (or the max available)
    setExamQuestions(finalExam.slice(0, 40));

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [allQuestions]);

  const currentQuestion = examQuestions[currentQuestionIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return; // Prevent changing answer
    setSelectedOptionIndex(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctOptionIndex;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
    }

    setAnswersLog((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        isCorrect,
        moduleId: currentQuestion.moduleId,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswered(false);

      // Smooth scroll back to top of the screen/container
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Finished the exam
      if (timerRef.current) clearInterval(timerRef.current);
      onFinishExam(correctCount, incorrectCount, answersLog, timeElapsed);
    }
  };

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (examQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-blue-900 border-t-yellow-400 animate-spin"></div>
        <p className="text-sm font-medium text-blue-900">Preparando examen personalizado...</p>
      </div>
    );
  }

  const progressPercent = ((currentQuestionIndex) / examQuestions.length) * 100;
  const progressPercentDisplay = ((currentQuestionIndex + 1) / examQuestions.length) * 100;

  return (
    <div ref={containerRef} className="flex flex-col gap-4 w-full">
      
      {/* Step 2 Indicator conforming to Sleek Theme */}
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">2</span>
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Evaluación en Curso</h2>
      </div>

      {/* Participant and Timer Panel */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 max-w-[65%]">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Aspirante</p>
            <p className="text-xs font-bold text-slate-800 truncate uppercase">{userData.fullName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl text-yellow-400 font-mono text-xs font-bold shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          {formatTime(timeElapsed)}
        </div>
      </div>

      {/* Progress Bar Card with Yellow-400 indicator */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-end justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
          <span className="truncate max-w-[200px] text-blue-800">{currentQuestion.moduleName}</span>
          <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap bg-slate-100 px-2.5 py-1 rounded-full">
            {currentQuestionIndex + 1} de {examQuestions.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: `${progressPercent}%` }}
            animate={{ width: `${progressPercentDisplay}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-yellow-400 rounded-full"
          />
        </div>
      </div>

      {/* Question Card with custom italic displays and rounded styling */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-md flex flex-col gap-5 min-h-[300px]"
        >
          {/* Module Pill */}
          <span className="self-start text-[9px] font-black tracking-widest bg-blue-50 text-blue-800 px-3 py-1.5 rounded-full uppercase">
            Módulo {currentQuestion.moduleId}
          </span>

          {/* Question Text styled in high-fidelity italic format */}
          <h3 className="text-base font-bold leading-snug text-slate-800 italic">
            ¿{currentQuestion.question}
          </h3>

          {/* Options List with sleek border response styles */}
          <div className="flex flex-col gap-3 mt-1">
            {currentQuestion.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = selectedOptionIndex === idx;
              const isCorrectOption = idx === currentQuestion.correctOptionIndex;

              let buttonStyles = "border-2 border-slate-100 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-200";
              let labelStyles = "bg-white text-slate-400 border-slate-200";
              let isCorrectFeedback = false;
              let isIncorrectFeedback = false;

              if (isAnswered) {
                if (isSelected) {
                  if (isCorrectOption) {
                    buttonStyles = "border-2 border-green-500 bg-green-50 text-green-900 font-bold";
                    labelStyles = "bg-green-500 text-white border-green-600";
                    isCorrectFeedback = true;
                  } else {
                    buttonStyles = "border-2 border-orange-500 bg-orange-50 text-orange-900 font-bold";
                    labelStyles = "bg-orange-500 text-white border-orange-600";
                    isIncorrectFeedback = true;
                  }
                } else if (isCorrectOption) {
                  buttonStyles = "border-2 border-green-500 bg-green-50 text-green-900 font-bold";
                  labelStyles = "bg-green-500 text-white border-green-600";
                  isCorrectFeedback = true;
                } else {
                  buttonStyles = "border-2 border-slate-50 bg-white text-slate-400 opacity-50";
                  labelStyles = "bg-slate-50 text-slate-300 border-slate-100";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full min-h-[56px] p-4 rounded-2xl text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer gap-3 ${buttonStyles}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex-shrink-0 rounded-lg border text-[11px] font-black flex items-center justify-center shadow-inner ${labelStyles}`}>
                      {letter}
                    </span>
                    <span className="leading-tight">{option}</span>
                  </div>
                  {isCorrectFeedback && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
                      ✅ Correcta
                    </span>
                  )}
                  {isIncorrectFeedback && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full whitespace-nowrap">
                      ❌ Incorrecta
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Continuar Button (Sleek Slate-900 action layout) */}
          {isAnswered && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNextQuestion}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold mt-4 flex items-center justify-center gap-2 uppercase tracking-widest text-[11px] transition-all cursor-pointer"
            >
              {currentQuestionIndex < examQuestions.length - 1 ? (
                <>
                  Siguiente Pregunta <ArrowRight className="w-4 h-4 text-yellow-400" />
                </>
              ) : (
                <>
                  Ver Resultados Finales <ArrowRight className="w-4 h-4 text-yellow-400" />
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
