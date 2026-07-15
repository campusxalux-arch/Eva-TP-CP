import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { 
  initAuth, 
  googleSignIn, 
  logout 
} from "../lib/googleAuth";
import { 
  createGoogleSheet, 
  createGoogleDoc, 
  fetchQuestionsFromDoc 
} from "../lib/workspaceApi";
import { Question } from "../types";
import { 
  FileSpreadsheet, 
  FileText, 
  Check, 
  Plus, 
  Link2, 
  Loader2, 
  LogOut, 
  RefreshCw, 
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface WorkspaceConfigProps {
  onQuestionsLoaded: (questions: Question[], source: string) => void;
  onAuthChanged: (user: User | null, token: string | null) => void;
  onSpreadsheetIdChanged: (spreadsheetId: string | null) => void;
  currentSpreadsheetId: string | null;
  currentDocumentId: string | null;
  onDocumentIdChanged: (documentId: string | null) => void;
}

export default function WorkspaceConfig({
  onQuestionsLoaded,
  onAuthChanged,
  onSpreadsheetIdChanged,
  currentSpreadsheetId,
  currentDocumentId,
  onDocumentIdChanged
}: WorkspaceConfigProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // States for operations
  const [sheetIdInput, setSheetIdInput] = useState(currentSpreadsheetId || "");
  const [docIdInput, setDocIdInput] = useState(currentDocumentId || "");
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Update input values when props change
  useEffect(() => {
    if (currentSpreadsheetId) setSheetIdInput(currentSpreadsheetId);
  }, [currentSpreadsheetId]);

  useEffect(() => {
    if (currentDocumentId) setDocIdInput(currentDocumentId);
  }, [currentDocumentId]);

  // Initial auth check
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        onAuthChanged(currentUser, currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
        onAuthChanged(null, null);
      }
    );
    return () => unsubscribe();
  }, [onAuthChanged]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        onAuthChanged(result.user, result.accessToken);
        setStatusMessage({ type: "success", text: "¡Acceso concedido! Bienvenido, " + result.user.displayName });
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setStatusMessage({ type: "error", text: "Fallo de autenticación: " + (err.message || err) });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setStatusMessage(null);
    try {
      await logout();
      setUser(null);
      setToken(null);
      onAuthChanged(null, null);
      setStatusMessage({ type: "info", text: "Sesión de Google Workspace cerrada." });
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  const handleLinkSheet = () => {
    if (!sheetIdInput.trim()) {
      setStatusMessage({ type: "error", text: "Por favor, ingrese un ID de planilla válido." });
      return;
    }
    // Extract ID from URL if user pasted the full URL
    let extractedId = sheetIdInput.trim();
    const sheetUrlMatch = extractedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetUrlMatch) {
      extractedId = sheetUrlMatch[1];
    }
    
    onSpreadsheetIdChanged(extractedId);
    setSheetIdInput(extractedId);
    setStatusMessage({ type: "success", text: "Planilla de Google Sheets vinculada correctamente." });
  };

  const handleCreateNewSheet = async () => {
    if (!token) return;
    setIsCreatingSheet(true);
    setStatusMessage(null);
    try {
      const sheetId = await createGoogleSheet(token, "Evaluación de Conductores - " + (user?.displayName || "Resultados"));
      onSpreadsheetIdChanged(sheetId);
      setSheetIdInput(sheetId);
      setStatusMessage({ type: "success", text: "¡Planilla creada con éxito en su Google Drive!" });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Error al crear planilla: " + (err.message || err) });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleLinkDoc = () => {
    if (!docIdInput.trim()) {
      setStatusMessage({ type: "error", text: "Por favor, ingrese un ID de documento válido." });
      return;
    }
    // Extract ID from URL if user pasted the full URL
    let extractedId = docIdInput.trim();
    const docUrlMatch = extractedId.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    if (docUrlMatch) {
      extractedId = docUrlMatch[1];
    }

    onDocumentIdChanged(extractedId);
    setDocIdInput(extractedId);
    setStatusMessage({ type: "success", text: "Documento de Google Docs vinculado correctamente." });
  };

  const handleCreateNewDoc = async () => {
    if (!token) return;
    setIsCreatingDoc(true);
    setStatusMessage(null);
    try {
      const docId = await createGoogleDoc(token, "Banco de Preguntas - Examen de Conducción");
      onDocumentIdChanged(docId);
      setDocIdInput(docId);
      setStatusMessage({ type: "success", text: "¡Documento de preguntas creado con éxito en su Google Drive!" });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Error al crear documento: " + (err.message || err) });
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleLoadQuestions = async () => {
    if (!token) return;
    if (!currentDocumentId) {
      setStatusMessage({ type: "error", text: "Primero debe vincular o crear un documento de Google Docs." });
      return;
    }
    setIsLoadingQuestions(true);
    setStatusMessage(null);
    try {
      const questions = await fetchQuestionsFromDoc(token, currentDocumentId);
      if (questions.length === 0) {
        throw new Error("No se pudieron parsear preguntas del documento. Verifique el formato.");
      }
      onQuestionsLoaded(questions, "Google Docs");
      setStatusMessage({ 
        type: "success", 
        text: `¡Éxito! Se cargaron ${questions.length} preguntas correctamente desde Google Docs.` 
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ 
        type: "error", 
        text: "Error al cargar preguntas: " + (err.message || "Asegúrese de que el documento tenga permisos y el formato sea correcto.") 
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
      {/* Header Bar */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 bg-slate-900 text-white flex items-center justify-between font-black uppercase tracking-widest text-[11px] cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-yellow-400" />
          Conexión Google Workspace (Sheets & Docs)
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="p-6 flex flex-col gap-5">
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4.5 rounded-2xl border text-xs font-semibold leading-relaxed flex gap-2.5 ${
              statusMessage.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : statusMessage.type === "error"
                ? "bg-red-50 border-red-100 text-red-800"
                : "bg-blue-50 border-blue-100 text-blue-800"
            }`}>
              {statusMessage.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : statusMessage.type === "error" ? (
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* User Section / Login */}
          {!user ? (
            <div className="flex flex-col gap-4 text-center items-center py-4">
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Conecte su cuenta de Google para almacenar resultados automáticamente en **Google Sheets** y personalizar las preguntas usando **Google Docs**. Todo se guarda directamente en su Drive personal.
              </p>
              
              {/* Material Google Button */}
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button w-full sm:w-auto"
                style={{
                  background: 'white',
                  border: '1px solid #dadce0',
                  borderRadius: '12px',
                  boxShadow: 'none',
                  color: '#3c4043',
                  cursor: 'pointer',
                  fontFamily: 'Roboto, arial, sans-serif',
                  fontSize: '14px',
                  height: '44px',
                  letterSpacing: '0.25px',
                  outline: 'none',
                  overflow: 'hidden',
                  padding: '0 12px',
                  position: 'relative',
                  textAlign: 'center',
                  transition: 'background-color .218s, border-color .218s, box-shadow .218s',
                  verticalAlign: 'middle',
                  whiteSpace: 'nowrap',
                  width: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm font-semibold">Iniciando sesión...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">Conectar con Google</span>
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Profile Card */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ""} className="w-10 h-10 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800">{user.displayName}</p>
                    <p className="text-[10px] text-slate-400">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Grid 1: Google Sheets Setup */}
              <div className="border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 bg-white">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Guardado en Google Sheets</h4>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Defina la planilla donde se registrarán los resultados del examen. Puede crear una nueva o vincular una existente.
                </p>

                {currentSpreadsheetId ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-green-50/40 p-2.5 rounded-xl border border-green-100 text-[11px] font-semibold text-emerald-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">ID: {currentSpreadsheetId}</span>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        Ver en Google Sheets ↗
                      </a>
                      <button 
                        onClick={() => onSpreadsheetIdChanged(null)}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        Desvincular
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        value={sheetIdInput}
                        onChange={(e) => setSheetIdInput(e.target.value)}
                        placeholder="Pegue la URL o el ID de la Planilla"
                        className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <button 
                        onClick={handleLinkSheet}
                        className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Vincular
                      </button>
                    </div>
                    
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-3 text-[9px] text-slate-300 font-bold uppercase tracking-wider">O también</span>
                      <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <button 
                      onClick={handleCreateNewSheet}
                      disabled={isCreatingSheet}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-55"
                    >
                      {isCreatingSheet ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creando planilla...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Crear Nueva Planilla en Drive
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Grid 2: Google Docs Setup */}
              <div className="border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 bg-white">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Preguntas desde Google Docs</h4>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Personalice las preguntas del examen editando un documento de Google Docs. Cree una plantilla o vincule un documento existente.
                </p>

                {currentDocumentId ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-blue-50/40 p-2.5 rounded-xl border border-blue-100 text-[11px] font-semibold text-blue-800">
                      <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="truncate">ID: {currentDocumentId}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <a 
                          href={`https://docs.google.com/document/d/${currentDocumentId}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Editar en Google Docs ↗
                        </a>
                        <button 
                          onClick={() => onDocumentIdChanged(null)}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Desvincular
                        </button>
                      </div>

                      <button 
                        onClick={handleLoadQuestions}
                        disabled={isLoadingQuestions}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-55"
                      >
                        {isLoadingQuestions ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Preguntas del Doc
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        value={docIdInput}
                        onChange={(e) => setDocIdInput(e.target.value)}
                        placeholder="Pegue la URL o el ID del Documento"
                        className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <button 
                        onClick={handleLinkDoc}
                        className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Vincular
                      </button>
                    </div>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-3 text-[9px] text-slate-300 font-bold uppercase tracking-wider">O también</span>
                      <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <button 
                      onClick={handleCreateNewDoc}
                      disabled={isCreatingDoc}
                      className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-55"
                    >
                      {isCreatingDoc ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creando documento...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Crear Documento de Preguntas
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
