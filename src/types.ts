/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: number;
  moduleId: number;
  moduleName: string;
  question: string;
  options: string[];
  correctOptionIndex: number; // 0, 1, 2, or 3
}

export interface UserData {
  idType: string;
  idNumber: string;
  fullName: string;
  age: number;
  companyName: string;
  yearsInCompany: number;
  licenseType: string;
}

export interface ModuleResult {
  moduleId: number;
  moduleName: string;
  correctCount: number;
  incorrectCount: number;
  isApproved: boolean;
}

export interface ExamResult {
  date: string;
  time: string;
  userData: UserData;
  correctTotal: number;
  incorrectTotal: number;
  score: number;
  isApproved: boolean;
  timeElapsedSeconds: number;
  moduleResults: ModuleResult[];
}
