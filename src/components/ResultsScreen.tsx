/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { UserData, ModuleResult, ExamResult } from "../types";
import { 
  CheckCircle, XCircle, Calendar, Clock, Award, Building, 
  User, CheckCircle2, AlertTriangle, RefreshCw, Smartphone, QrCode
} from "lucide-react";
import { motion } from "motion/react";

import { appendResultsToSheet } from "../lib/workspaceApi";

interface ResultsScreenProps {
  userData: UserData;
  correctTotal: number;
  incorrectTotal: number;
  timeElapsedSeconds: number;
  answersLog: { questionId: number; isCorrect: boolean; moduleId: number }[];
  onRestart: () => void;
  googleAccessToken?: string | null;
  spreadsheetId?: string | null;
}

export default function ResultsScreen({
  userData,
  correctTotal,
  incorrectTotal,
  timeElapsedSeconds,
  answersLog,
  onRestart,
  googleAccessToken,
  spreadsheetId
}: ResultsScreenProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [hasSaved, setHasSaved] = useState(false);

  // 1. Calculate Score (percentage over 100)
  const totalQuestions = correctTotal + incorrectTotal;
  const score = totalQuestions > 0 ? Math.round((correctTotal / totalQuestions) * 100) : 0;
  const isApproved = score >= 80; // Standard passing score is 80% (32/40)

  // 2. Group Results by Module
  const moduleNames = [
    "Aspectos Generales y Señalización Vial",
    "Normas de Tránsito y Comportamiento Vial",
    "Seguridad del Vehículo y Mecánica Básica",
    "Primeros Auxilios y Gestión de Accidentes"
  ];

  const moduleResults: ModuleResult[] = [1, 2, 3, 4].map((modId) => {
    const modAnswers = answersLog.filter((a) => a.moduleId === modId);
    const correct = modAnswers.filter((a) => a.isCorrect).length;
    const incorrect = modAnswers.filter((a) => !a.isCorrect).length;
    
    // A module is approved if 80% or more answers are correct (i.e. at least 8/10)
    const isModApproved = correct >= 8;

    return {
      moduleId: modId,
      moduleName: moduleNames[modId - 1],
      correctCount: correct,
      incorrectCount: incorrect,
      isApproved: isModApproved
    };
  });

  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const timeStr = currentDate.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // 3. Format Time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 4. Save to Google Sheets automatically when the screen loads
  useEffect(() => {
    if (hasSaved) return; // Prevent duplicate submissions on reload/re-render

    const saveExamResults = async () => {
      setSaveStatus("saving");
      
      const payload: ExamResult = {
        date: dateStr,
        time: timeStr,
        userData,
        correctTotal,
        incorrectTotal,
        score,
        isApproved,
        timeElapsedSeconds,
        moduleResults
      };

      try {
        if (googleAccessToken && spreadsheetId) {
          console.log("Directly appending to user Google Sheet...");
          await appendResultsToSheet(googleAccessToken, spreadsheetId, payload);
          setSaveStatus("success");
          setSaveMessage("Los resultados han sido guardados de manera exitosa directamente en su propia planilla de Google Sheets conectada.");
          setHasSaved(true);
        } else {
          // Standard server-side fallback
          const response = await fetch("/api/save-results", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          const data = await response.json();
          
          if (response.ok && data.success) {
            setSaveStatus("success");
            setSaveMessage(data.demoMode ? data.message : "¡Los resultados han sido guardados automáticamente en Google Sheets!");
            setHasSaved(true);
          } else {
            setSaveStatus("error");
            setSaveMessage(data.error || "Hubo un error al comunicarse con el servidor.");
          }
        }
      } catch (error: any) {
        setSaveStatus("error");
        setSaveMessage(error.message || "No se pudo establecer conexión con el servicio de almacenamiento.");
      }
    };

    saveExamResults();
  }, [hasSaved, googleAccessToken, spreadsheetId]);

  // Current page URL to generate dynamic QR Code
  const [currentUrl, setCurrentUrl] = useState("https://vercelexample.com");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.origin);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-5 w-full"
    >
      {/* Step 3 Indicator conforming to Sleek Theme */}
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">3</span>
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Resultado Final</h2>
      </div>

      {/* 1. STATUS HEADER - Styled as a phone emulator screen matching Step 3 of design */}
      <div className={`rounded-[2.5rem] shadow-2xl border-[8px] border-slate-800 flex flex-col overflow-hidden relative p-6 text-center text-white ${
        isApproved 
          ? "bg-blue-900 border-slate-800" 
          : "bg-red-950 border-slate-800"
      }`}>
        {/* Emulator Top notch mockup inside the box */}
        <div className="h-6 bg-slate-800 w-1/3 self-center rounded-b-xl -mt-6 mb-4"></div>

        <div className="flex flex-col items-center h-full">
          <div className="mt-2 mb-2">
            <div className={`inline-block p-2 rounded-full mb-2 ${isApproved ? "bg-green-500/20" : "bg-red-500/20"}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${isApproved ? "bg-green-500" : "bg-red-500"}`}>
                {isApproved ? (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                )}
              </div>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">
              {isApproved ? "¡APROBADO!" : "NO APROBADO"}
            </h3>
            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mt-1">
              {isApproved ? "Evaluación Satisfactoria" : "Evaluación Insatisfactoria"}
            </p>
          </div>

          {/* Translucent Backdrop Box for Details */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-5 mt-4 text-left w-full border border-white/10">
            <div className="grid grid-cols-2 gap-y-4">
              <div className="col-span-2">
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Aspirante</p>
                <p className="text-sm font-bold uppercase truncate">{userData.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Puntaje</p>
                <p className="text-2xl font-black text-yellow-400">{score} / 100</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Correctas</p>
                <p className="text-2xl font-black text-white">{correctTotal}</p>
              </div>
              <div className="col-span-2 pt-3 border-t border-white/10 flex justify-between items-center text-xs text-blue-100">
                <div>
                  <p className="text-[9px] text-blue-200 font-bold uppercase tracking-wider">Fecha</p>
                  <p className="font-semibold">{dateStr}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-blue-200 font-bold uppercase tracking-wider">Licencia</p>
                  <p className="font-bold bg-white/10 px-2 py-0.5 rounded text-[11px]">{userData.licenseType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MODULAR BREAKDOWN - Styled with custom light cards */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
        <h3 className="text-xs font-black text-blue-950 uppercase tracking-widest border-b border-slate-100 pb-2">
          Desempeño Detallado por Módulos
        </h3>
        <p className="text-xs text-slate-400 -mt-1 leading-relaxed">
          Se requiere un mínimo de 8 respuestas correctas (80%) para aprobar de manera individual cada módulo.
        </p>

        <div className="flex flex-col gap-3 mt-1">
          {moduleResults.map((mod) => (
            <div 
              key={mod.moduleId} 
              className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
                mod.isApproved ? "bg-emerald-50/40 border-emerald-100/70" : "bg-orange-50/40 border-orange-100/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase leading-snug max-w-[70%]">
                  Módulo {mod.moduleId}: {mod.moduleName}
                </span>
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  mod.isApproved 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                    : "bg-orange-100 text-orange-800 border-orange-200"
                }`}>
                  {mod.isApproved ? "Aprobado" : "No aprobado"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="text-emerald-700">Correctas: {mod.correctCount} / 10</span>
                <span className="text-orange-700">Incorrectas: {mod.incorrectCount} / 10</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. GOOGLE SHEETS SYNC STATUS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <>
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-950">Sincronizando con Google Sheets...</p>
                <p className="text-[10px] text-gray-500">Espere un momento, enviando datos de manera segura.</p>
              </div>
            </>
          )}

          {saveStatus === "success" && (
            <>
              <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-emerald-950">¡Resultados Sincronizados!</p>
                <p className="text-[10px] text-emerald-600 font-medium">{saveMessage}</p>
                {spreadsheetId && (
                  <a 
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-black text-emerald-800 hover:text-emerald-950 underline decoration-2 uppercase tracking-wide"
                  >
                    Abrir Planilla de Google Sheets ↗
                  </a>
                )}
              </div>
            </>
          )}

          {saveStatus === "error" && (
            <>
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-950">Sincronización Pendiente o en Demostración</p>
                <p className="text-[10px] text-amber-700 font-medium">{saveMessage}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. SHARE / QR CODE SECTION */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-1.5 text-xs font-black text-blue-950 uppercase tracking-widest">
          <QrCode className="w-4 h-4 text-blue-900" /> Compartir Evaluación Móvil
        </div>
        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
          Escanee el siguiente código QR desde cualquier celular para abrir la evaluación instantáneamente.
        </p>

        {/* Dynamic QR Code from public API styled beautifully */}
        <div className="bg-slate-50 p-3 rounded-[2rem] border border-slate-100 shadow-inner flex flex-col items-center gap-2">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(currentUrl)}`} 
            alt="QR Code TP-Carro Particular" 
            className="w-28 h-28 object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="text-[9px] font-black text-blue-900 tracking-widest uppercase bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">
            TP-Carro Particular
          </span>
        </div>
      </div>

      {/* 5. ACTION BUTTON: RESTART */}
      <button
        onClick={onRestart}
        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin-slow" /> Finalizar y Regresar al Inicio
      </button>
    </motion.div>
  );
}
