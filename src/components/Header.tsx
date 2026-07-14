/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, Car } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-blue-800 text-white p-5 shadow-md border-b-4 border-yellow-400 flex justify-between items-center w-full">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center text-blue-800 font-black text-xl shadow-inner italic select-none">
          TP
        </div>
        <div className="text-left">
          <h1 className="text-base font-black tracking-tight leading-none uppercase">
            Evaluación Teórica
          </h1>
          <p className="text-blue-200 text-[11px] font-medium mt-1">
            Particular • Versión 2026
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="bg-blue-700/50 px-2.5 py-1.5 rounded-full border border-blue-400/30 text-[9px] font-bold uppercase tracking-wider text-blue-100">
          PRO EXAM
        </div>
      </div>
    </header>
  );
}
