/**
 * GOOGLE APPS SCRIPT - WEB APP
 * 
 * Este script actúa como la API para conectar la aplicación con Google Sheets y Google Docs.
 * 
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Cree una hoja de cálculo en Google Sheets.
 * 2. Haga clic en "Extensiones" > "Apps Script".
 * 3. Copie y pegue todo este código en el editor de Apps Script (reemplazando lo que haya).
 * 4. Cambie los IDs correspondientes en las variables de configuración si es necesario (el script intentará autodetectarlos).
 * 5. Haga clic en "Implementar" (Deploy) > "Nueva implementación" (New deployment).
 * 6. Seleccione Tipo: "Aplicación web" (Web app).
 * 7. Configuración:
 *    - Ejecutar como: "Yo" (su cuenta de Google).
 *    - Quién tiene acceso: "Cualquiera" (Anyone).
 * 8. Haga clic en "Implementar". Autorice los permisos solicitados.
 * 9. Copie la URL de la aplicación web obtenida (termina en `/exec`) y agréguela a su archivo `.env` o variables de entorno en Vercel como `GOOGLE_SCRIPT_URL`.
 */

// --- CONFIGURACIÓN ---
var GOOGLE_DOC_ID = "1fILvU6XOHT0kGYdxB1-CyrdEn2ZeI2T4"; // Reemplace con el ID de su documento si cambia
var SHEET_NAME = "Resultados";

/**
 * Maneja las peticiones GET (Lectura de preguntas)
 */
function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "getQuestions") {
    try {
      var questions = getQuestionsFromDoc();
      return ContentService.createTextOutput(JSON.stringify(questions))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        error: true,
        message: "Error al leer el documento de Google Docs: " + err.toString(),
        fallbackToLocal: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    message: "Servicio activo. Use action=getQuestions para obtener preguntas o envíe un POST para guardar resultados."
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Maneja las peticiones POST (Guardar resultados)
 */
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();
    
    var rowData = [
      postData.date || new Date().toLocaleDateString(),
      postData.time || new Date().toLocaleTimeString(),
      postData.userData.idType,
      postData.userData.idNumber,
      postData.userData.fullName.toUpperCase(),
      postData.userData.age,
      postData.userData.companyName.toUpperCase(),
      postData.userData.yearsInCompany,
      postData.userData.licenseType,
      postData.correctTotal,
      postData.incorrectTotal,
      postData.score,
      postData.isApproved ? "Aprobado" : "No aprobado",
      formatTime(postData.timeElapsedSeconds),
      
      // Módulo 1
      postData.moduleResults[0] ? postData.moduleResults[0].correctCount : 0,
      postData.moduleResults[0] ? postData.moduleResults[0].incorrectCount : 0,
      postData.moduleResults[0] ? (postData.moduleResults[0].isApproved ? "Aprobado" : "No aprobado") : "-",
      
      // Módulo 2
      postData.moduleResults[1] ? postData.moduleResults[1].correctCount : 0,
      postData.moduleResults[1] ? postData.moduleResults[1].incorrectCount : 0,
      postData.moduleResults[1] ? (postData.moduleResults[1].isApproved ? "Aprobado" : "No aprobado") : "-",
      
      // Módulo 3
      postData.moduleResults[2] ? postData.moduleResults[2].correctCount : 0,
      postData.moduleResults[2] ? postData.moduleResults[2].incorrectCount : 0,
      postData.moduleResults[2] ? (postData.moduleResults[2].isApproved ? "Aprobado" : "No aprobado") : "-",
      
      // Módulo 4
      postData.moduleResults[3] ? postData.moduleResults[3].correctCount : 0,
      postData.moduleResults[3] ? postData.moduleResults[3].incorrectCount : 0,
      postData.moduleResults[3] ? (postData.moduleResults[3].isApproved ? "Aprobado" : "No aprobado") : "-"
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Resultado guardado correctamente en Google Sheets."
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Obtiene o crea la hoja de cálculo con los encabezados adecuados
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = [
      "Fecha", "Hora", "Tipo de Identificación", "Número de Identificación", "Nombre Completo", 
      "Edad", "Empresa", "Años de Antigüedad", "Tipo de Licencia", "Respuestas Correctas", 
      "Respuestas Incorrectas", "Puntaje Final", "Resultado General", "Tiempo Empleado",
      "M1 Correctas", "M1 Incorrectas", "M1 Estado",
      "M2 Correctas", "M2 Incorrectas", "M2 Estado",
      "M3 Correctas", "M3 Incorrectas", "M3 Estado",
      "M4 Correctas", "M4 Incorrectas", "M4 Estado"
    ];
    sheet.appendRow(headers);
    // Aplicar formato básico a encabezados
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight("bold");
    range.setBackground("#1E3A8A"); // Azul corporativo
    range.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Convierte segundos a formato MM:SS
 */
function formatTime(seconds) {
  if (!seconds) return "00:00";
  var mins = Math.floor(seconds / 60);
  var secs = seconds % 60;
  return (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs;
}

/**
 * Lee y analiza las preguntas desde Google Docs.
 * Si falla, retorna una estructura vacía o lanza un error.
 * Este analizador busca títulos de módulo y parsea las preguntas numeradas.
 */
function getQuestionsFromDoc() {
  var doc = DocumentApp.openById(GOOGLE_DOC_ID);
  var body = doc.getBody();
  var numChildren = body.getNumChildren();
  
  var questions = [];
  var currentModuleId = 0;
  var currentModuleName = "General";
  
  var currentQuestionText = "";
  var currentOptions = [];
  var currentCorrectIndex = -1;
  
  for (var i = 0; i < numChildren; i++) {
    var child = body.getChild(i);
    var type = child.getType();
    
    if (type === DocumentApp.ElementType.PARAGRAPH) {
      var text = child.asParagraph().getText().trim();
      if (!text) continue;
      
      var textUpper = text.toUpperCase();
      
      // Detección de Módulo
      if (textUpper.indexOf("MÓDULO") !== -1 || textUpper.indexOf("MODULO") !== -1) {
        currentModuleId++;
        currentModuleName = text;
        continue;
      }
      
      // Detección de pregunta (ej: "1. ¿Qué es...?")
      var questionMatch = text.match(/^(\d+)[\.\s]+[\¿\?]*(.*)/);
      if (questionMatch) {
        // Guardar pregunta anterior si existía y era válida
        if (currentQuestionText && currentOptions.length > 0) {
          questions.push({
            id: questions.length + 1,
            moduleId: currentModuleId || 1,
            moduleName: currentModuleName,
            question: currentQuestionText,
            options: currentOptions,
            correctOptionIndex: currentCorrectIndex !== -1 ? currentCorrectIndex : 0
          });
        }
        
        // Iniciar nueva pregunta
        currentQuestionText = text;
        currentOptions = [];
        currentCorrectIndex = -1;
        continue;
      }
      
      // Detección de opciones (ej: "A) Opción" o "A. Opción")
      var optionMatch = text.match(/^([A-Da-d])[\)\.\s]+(.*)/);
      if (optionMatch && currentQuestionText) {
        currentOptions.push(optionMatch[2].trim());
        continue;
      }
      
      // Detección de respuesta correcta (ej: "Respuesta correcta: A" o "Respuesta: A")
      var correctMatch = text.match(/(?:Respuesta|Correcta|Rpta)[\s\:]+([A-Da-d])/i);
      if (correctMatch && currentQuestionText) {
        var letter = correctMatch[1].toUpperCase();
        currentCorrectIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        continue;
      }
    }
  }
  
  // Guardar última pregunta
  if (currentQuestionText && currentOptions.length > 0) {
    questions.push({
      id: questions.length + 1,
      moduleId: currentModuleId || 1,
      moduleName: currentModuleName,
      question: currentQuestionText,
      options: currentOptions,
      correctOptionIndex: currentCorrectIndex !== -1 ? currentCorrectIndex : 0
    });
  }
  
  if (questions.length === 0) {
    throw new Error("No se encontraron preguntas legibles en el formato esperado.");
  }
  
  return questions;
}
