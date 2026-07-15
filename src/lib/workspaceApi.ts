import { Question, ExamResult } from "../types";

export interface DocQuestion {
  id: number;
  moduleId: number;
  moduleName: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

// Default questions template to seed a new Google Doc
const DEFAULT_DOC_TEMPLATE = `MÓDULO 1: Aspectos Generales y Señalización Vial

1. ¿Cuál es el significado de una línea doble amarilla continua en la carretera?
A) Se permite adelantar en ambos sentidos
B) Prohibido adelantar en ambos sentidos
C) Carril exclusivo para buses de servicio público
D) Zona de estacionamiento permitido las 24 horas
Respuesta correcta: B

2. ¿Qué indica una señal de tránsito con forma octogonal, fondo rojo y letras blancas?
A) Ceder el paso al vehículo de la derecha
B) Pare / Alto obligatorio
C) Curva peligrosa a la izquierda
D) Límite de velocidad máxima permitida
Respuesta correcta: B

MÓDULO 2: Normas de Tránsito y Comportamiento Vial

3. Al adelantar a un ciclista en carretera, ¿cuál es la distancia lateral mínima que debe mantener?
A) 0.5 metros
B) 1.5 metros
C) 2.0 metros
D) No es necesario mantener distancia específica
Respuesta correcta: B

4. ¿A qué velocidad máxima se debe transitar por zonas escolares y residenciales en Colombia?
A) 30 km/h
B) 50 km/h
C) 60 km/h
D) 80 km/h
Respuesta correcta: A

MÓDULO 3: Seguridad del Vehículo y Mecánica Básica

5. ¿Cuál es la función principal del sistema de frenos ABS en un vehículo?
A) Acortar siempre la distancia de frenado a cero
B) Evitar que las ruedas se bloqueen y mantener el control de la dirección
C) Aumentar la potencia del motor durante el frenado
D) Lubricar las pastillas de freno automáticamente
Respuesta correcta: B

6. ¿Cada cuánto tiempo o kilometraje se recomienda verificar la presión de inflado de los neumáticos?
A) Cada año durante la revisión técnico-mecánica
B) Cada mes o antes de realizar un viaje largo en carretera
C) Solo cuando visualmente se observen desinflados
D) Cada 50,000 kilómetros recorridos
Respuesta correcta: B

MÓDULO 4: Primeros Auxilios y Gestión de Accidentes

7. En caso de un accidente de tránsito con heridos, ¿cuál es el orden correcto de actuación según la conducta PAS?
A) Prevenir, Avisar, Socorrer
B) Proteger, Alertar, Socorrer
C) Presionar, Auxiliar, Sanar
D) Primero el herido, Avisar, Salvar
Respuesta correcta: B

8. Si un motociclista accidentado está inconsciente en el suelo, ¿qué regla de primeros auxilios debe aplicar sobre su casco?
A) Retirar el casco inmediatamente para que pueda respirar mejor
B) No retirar el casco bajo ninguna circunstancia, excepto si es personal capacitado
C) Aflojar el casco golpeándolo suavemente
D) Retirar el casco solo si se queja de dolor de cuello
Respuesta correcta: B
`;

/**
 * Creates a brand new Google Sheet in the user's Google Drive.
 */
export async function createGoogleSheet(accessToken: string, title: string): Promise<string> {
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "No se pudo crear la hoja de cálculo.");
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Rename "Sheet1" to "Resultados"
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: 0,
              title: "Resultados",
            },
            fields: "title",
          },
        },
      ],
    }),
  });

  // Append Headers
  const headers = [
    "Fecha", "Hora", "Tipo de Identificación", "Número de Identificación", "Nombre Completo",
    "Edad", "Empresa", "Años de Antigüedad", "Tipo de Licencia", "Respuestas Correctas",
    "Respuestas Incorrectas", "Puntaje Final", "Resultado General", "Tiempo Empleado",
    "M1 Correctas", "M1 Incorrectas", "M1 Estado",
    "M2 Correctas", "M2 Incorrectas", "M2 Estado",
    "M3 Correctas", "M3 Incorrectas", "M3 Estado",
    "M4 Correctas", "M4 Incorrectas", "M4 Estado",
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      "Resultados!A1:Z1"
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [headers],
      }),
    }
  );

  return spreadsheetId;
}

/**
 * Appends a row of test results to a specified Google Sheet.
 */
export async function appendResultsToSheet(
  accessToken: string,
  spreadsheetId: string,
  result: ExamResult
): Promise<void> {
  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const rowData = [
    result.date,
    result.time,
    result.userData.idType,
    result.userData.idNumber,
    result.userData.fullName.toUpperCase(),
    result.userData.age,
    result.userData.companyName.toUpperCase(),
    result.userData.yearsInCompany,
    result.userData.licenseType,
    result.correctTotal,
    result.incorrectTotal,
    result.score,
    result.isApproved ? "Aprobado" : "No aprobado",
    formatSeconds(result.timeElapsedSeconds),

    // Módulo 1
    result.moduleResults[0] ? result.moduleResults[0].correctCount : 0,
    result.moduleResults[0] ? result.moduleResults[0].incorrectCount : 0,
    result.moduleResults[0] ? (result.moduleResults[0].isApproved ? "Aprobado" : "No aprobado") : "-",

    // Módulo 2
    result.moduleResults[1] ? result.moduleResults[1].correctCount : 0,
    result.moduleResults[1] ? result.moduleResults[1].incorrectCount : 0,
    result.moduleResults[1] ? (result.moduleResults[1].isApproved ? "Aprobado" : "No aprobado") : "-",

    // Módulo 3
    result.moduleResults[2] ? result.moduleResults[2].correctCount : 0,
    result.moduleResults[2] ? result.moduleResults[2].incorrectCount : 0,
    result.moduleResults[2] ? (result.moduleResults[2].isApproved ? "Aprobado" : "No aprobado") : "-",

    // Módulo 4
    result.moduleResults[3] ? result.moduleResults[3].correctCount : 0,
    result.moduleResults[3] ? result.moduleResults[3].incorrectCount : 0,
    result.moduleResults[3] ? (result.moduleResults[3].isApproved ? "Aprobado" : "No aprobado") : "-",
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      "Resultados!A:Z"
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "No se pudieron guardar los resultados en Sheets.");
  }
}

/**
 * Creates a brand new Google Doc with pre-loaded question templates.
 */
export async function createGoogleDoc(accessToken: string, title: string): Promise<string> {
  const response = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "No se pudo crear el documento.");
  }

  const doc = await response.json();
  const documentId = doc.documentId;

  // Insert the template content
  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: DEFAULT_DOC_TEMPLATE,
          },
        },
      ],
    }),
  });

  return documentId;
}

/**
 * Fetches and parses a list of questions from a specified Google Doc.
 */
export async function fetchQuestionsFromDoc(accessToken: string, documentId: string): Promise<Question[]> {
  const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "No se pudo abrir el documento.");
  }

  const docData = await response.json();
  const docQuestions = parseGoogleDoc(docData);

  // Convert DocQuestion format to the standard app's Question format
  return docQuestions.map((dq) => ({
    id: dq.id,
    moduleId: dq.moduleId,
    moduleName: dq.moduleName,
    question: dq.question,
    options: dq.options,
    correctOptionIndex: dq.correctOptionIndex,
  }));
}

/**
 * Parses questions from Google Docs body JSON structure
 */
function parseGoogleDoc(docData: any): DocQuestion[] {
  const content = docData.body?.content || [];
  const paragraphs: string[] = [];

  for (const element of content) {
    if (element.paragraph) {
      let text = "";
      const elements = element.paragraph.elements || [];
      for (const el of elements) {
        if (el.textRun && el.textRun.content) {
          text += el.textRun.content;
        }
      }
      const trimmed = text.trim();
      if (trimmed) {
        paragraphs.push(trimmed);
      }
    }
  }

  const questions: DocQuestion[] = [];
  let currentModuleId = 0;
  let currentModuleName = "General";

  let currentQuestionText = "";
  let currentOptions: string[] = [];
  let currentCorrectIndex = -1;

  for (const text of paragraphs) {
    const textUpper = text.toUpperCase();

    // Module detection (e.g. "MÓDULO 1: Aspectos Generales" or "MODULO 2...")
    if (textUpper.includes("MÓDULO") || textUpper.includes("MODULO")) {
      // Find digit in text if any, otherwise increment
      const modDigitMatch = text.match(/(?:MÓDULO|MODULO)\s*(\d+)/i);
      if (modDigitMatch) {
        currentModuleId = parseInt(modDigitMatch[1], 10);
      } else {
        currentModuleId++;
      }
      currentModuleName = text;
      continue;
    }

    // Question detection (e.g. "1. ¿Qué es...?" or "12. ¿Cuál...?")
    const questionMatch = text.match(/^(\d+)[\.\s]+[\¿\?]*(.*)/);
    if (questionMatch) {
      if (currentQuestionText && currentOptions.length > 0) {
        questions.push({
          id: questions.length + 1,
          moduleId: currentModuleId || 1,
          moduleName: currentModuleName,
          question: currentQuestionText,
          options: [...currentOptions],
          correctOptionIndex: currentCorrectIndex !== -1 ? currentCorrectIndex : 0,
        });
      }
      currentQuestionText = questionMatch[2].trim();
      currentOptions = [];
      currentCorrectIndex = -1;
      continue;
    }

    // Option detection (e.g. "A) Opción" or "A. Opción")
    const optionMatch = text.match(/^([A-Da-d])[\)\.\s]+(.*)/);
    if (optionMatch && currentQuestionText) {
      currentOptions.push(optionMatch[2].trim());
      continue;
    }

    // Correct answer detection (e.g. "Respuesta correcta: A" or "Respuesta: A")
    const correctMatch = text.match(/(?:Respuesta|Correcta|Rpta)[\s\:]+([A-Da-d])/i);
    if (correctMatch && currentQuestionText) {
      const letter = correctMatch[1].toUpperCase();
      currentCorrectIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      continue;
    }
  }

  // Push last question
  if (currentQuestionText && currentOptions.length > 0) {
    questions.push({
      id: questions.length + 1,
      moduleId: currentModuleId || 1,
      moduleName: currentModuleName,
      question: currentQuestionText,
      options: [...currentOptions],
      correctOptionIndex: currentCorrectIndex !== -1 ? currentCorrectIndex : 0,
    });
  }

  return questions;
}
