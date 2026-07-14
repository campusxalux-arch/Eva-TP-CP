/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserData } from "../types";
import { User, Shield, Building, Award, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface RegistrationFormProps {
  onStartExam: (data: UserData) => void;
}

export default function RegistrationForm({ onStartExam }: RegistrationFormProps) {
  const [formData, setFormData] = useState<UserData>({
    idType: "Cédula de ciudadanía",
    idNumber: "",
    fullName: "",
    age: "" as any,
    companyName: "",
    yearsInCompany: "" as any,
    licenseType: "B1",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "fullName" || name === "companyName") {
      finalValue = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "El número de identificación es obligatorio";
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es obligatorio";
    } else if (formData.fullName.trim().length < 5) {
      newErrors.fullName = "Ingrese su nombre y apellido completo";
    }
    
    const ageNum = Number(formData.age);
    if (!formData.age) {
      newErrors.age = "La edad es obligatoria";
    } else if (isNaN(ageNum) || ageNum < 16 || ageNum > 90) {
      newErrors.age = "La edad debe estar entre 16 y 90 años";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "La empresa es obligatoria";
    }

    const yearsNum = Number(formData.yearsInCompany);
    if (formData.yearsInCompany === undefined || formData.yearsInCompany === null || isNaN(yearsNum)) {
      newErrors.yearsInCompany = "Los años de antigüedad son obligatorios";
    } else if (yearsNum < 0 || yearsNum > 60) {
      newErrors.yearsInCompany = "Ingrese un valor válido entre 0 y 60";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onStartExam({
        ...formData,
        age: Number(formData.age),
        yearsInCompany: Number(formData.yearsInCompany),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-4"
    >
      {/* Step 1 Indicator conforming to Sleek Theme */}
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">1</span>
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Registro de Aspirante</h2>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 flex flex-col gap-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">Bienvenido</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Complete la información para iniciar su evaluación.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Identificación */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-600" /> Tipo de ID
            </label>
            <select
              name="idType"
              value={formData.idType}
              onChange={handleTextChange}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="Cédula de ciudadanía">Cédula de Ciudadanía</option>
              <option value="Cédula de extranjería">Cédula de Extranjería</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="Permiso Especial">Permiso Especial</option>
            </select>
          </div>

          {/* Número Identificación */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-600" /> Número de ID
            </label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleTextChange}
              placeholder="Ej: 1020304050"
              className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.idNumber ? "border-red-500 bg-red-50/20" : "border-slate-200"
              }`}
            />
            {errors.idNumber && <p className="text-[10px] text-red-500 font-bold">{errors.idNumber}</p>}
          </div>

          {/* Nombre Completo */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <User className="w-3 h-3 text-blue-600" /> Nombre Completo
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleTextChange}
              placeholder="Ej: JUAN CARLOS PÉREZ"
              className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-sm font-bold text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.fullName ? "border-red-500 bg-red-50/20" : "border-slate-200"
              }`}
            />
            {errors.fullName && <p className="text-[10px] text-red-500 font-bold">{errors.fullName}</p>}
          </div>

          {/* Edad */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <User className="w-3 h-3 text-blue-600" /> Edad
            </label>
            <input
              type="number"
              name="age"
              value={formData.age === "" as any ? "" : formData.age}
              onChange={handleTextChange}
              placeholder="Ej: 28"
              min="16"
              max="90"
              className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.age ? "border-red-500 bg-red-50/20" : "border-slate-200"
              }`}
            />
            {errors.age && <p className="text-[10px] text-red-500 font-bold">{errors.age}</p>}
          </div>

          {/* Empresa */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Building className="w-3 h-3 text-blue-600" /> Empresa donde Labora
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleTextChange}
              placeholder="Ej: DISTRIBUIDORA DE LOGÍSTICA"
              className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-sm font-bold text-slate-700 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.companyName ? "border-red-500 bg-red-50/20" : "border-slate-200"
              }`}
            />
            {errors.companyName && <p className="text-[10px] text-red-500 font-bold">{errors.companyName}</p>}
          </div>

          {/* Antigüedad & Tipo de Licencia */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 truncate">
                Antigüedad (Años)
              </label>
              <input
                type="number"
                name="yearsInCompany"
                value={formData.yearsInCompany === "" as any ? "" : formData.yearsInCompany}
                onChange={handleTextChange}
                placeholder="Ej: 3"
                min="0"
                max="60"
                className={`w-full h-11 px-3 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.yearsInCompany ? "border-red-500 bg-red-50/20" : "border-slate-200"
                }`}
              />
              {errors.yearsInCompany && <p className="text-[9px] text-red-500 font-bold leading-tight">{errors.yearsInCompany}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                Licencia
              </label>
              <select
                name="licenseType"
                value={formData.licenseType}
                onChange={handleTextChange}
                className="w-full h-11 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="B3">B3</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
                <option value="C3">C3</option>
              </select>
            </div>
          </div>

          {/* Botón Iniciar */}
          <button
            type="submit"
            className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-blue-200 uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border-t border-blue-600"
          >
            Iniciar Examen <ArrowRight className="w-4 h-4 text-yellow-400" />
          </button>

        </form>
      </div>
    </motion.div>
  );
}
