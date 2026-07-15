/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, Car } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white text-slate-800 px-5 py-4.5 shadow-sm border-b border-slate-100 flex justify-between items-center w-full">
      <div className="flex items-center gap-3.5">
        {/* Instituto Colombiano Logo Icon SVG */}
        <svg viewBox="0 0 100 100" className="w-12 h-12 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Protective Crescent */}
          <path 
            d="M 12 32 C 12 65, 28 88, 50 88 C 72 88, 88 65, 88 32 C 82 55, 68 74, 50 74 C 32 74, 18 55, 12 32 Z" 
            fill="#004b93" 
          />
          {/* Yellow Interlocking Loop (Left) */}
          <path 
            d="M 52 38 C 36 38 28 43 28 50 C 28 57 36 62 52 62" 
            stroke="#fcd116" 
            strokeWidth="8" 
            strokeLinecap="round" 
          />
          {/* Light Blue Interlocking Loop (Right) */}
          <path 
            d="M 48 62 C 64 62 72 57 72 50 C 72 43 64 38 48 38" 
            stroke="#00a2e8" 
            strokeWidth="8" 
            strokeLinecap="round" 
          />
        </svg>

        {/* Institutional 5-line typography */}
        <div className="flex flex-col text-left font-sans select-none justify-center">
          <span className="text-[13px] font-black tracking-[0.06em] text-[#004b93] leading-none uppercase">
            Instituto
          </span>
          <span className="text-[7.5px] sm:text-[8px] font-extrabold tracking-[0.02em] text-slate-700 leading-none mt-1 uppercase">
            Colombiano de
          </span>
          <span className="text-[7.5px] sm:text-[8px] font-extrabold tracking-[0.02em] text-slate-700 leading-none mt-0.5 uppercase">
            Seguridad y
          </span>
          <span className="text-[7.5px] sm:text-[8px] font-extrabold tracking-[0.02em] text-slate-700 leading-none mt-0.5 uppercase">
            Salud en el
          </span>
          <span className="text-[7.5px] sm:text-[8px] font-extrabold tracking-[0.02em] text-slate-700 leading-none mt-0.5 uppercase">
            Trabajo
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 text-[9px] font-black uppercase tracking-widest text-[#004b93]">
          PRO EXAM
        </div>
      </div>
    </header>
  );
}
