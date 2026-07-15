/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { QUESTION_BANK } from "./src/questionsData.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper function to clean and retrieve the Google Script URL
  const getScriptUrl = (): string => {
    const rawUrl = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL;
    if (!rawUrl) return "";
    return rawUrl.trim().replace(/^["']|["']$/g, "");
  };

  // Helper function to validate URLs
  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Robust fetch helper that manually handles 301/302 redirects for Google Apps Script
  const fetchWithRedirects = async (
    initialUrl: string,
    options: {
      method: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ) => {
    let currentUrl = initialUrl;
    let method = options.method;
    let headers = { ...options.headers };
    let body = options.body;
    let attempts = 0;
    const maxRedirects = 5;

    while (attempts < maxRedirects) {
      console.log(`[Fetch] ${method} to ${currentUrl}`);
      const response = await fetch(currentUrl, {
        method,
        headers,
        body,
        redirect: "manual"
      });

      console.log(`[Fetch] Response status: ${response.status}`);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (location) {
          currentUrl = new URL(location, currentUrl).toString();
          attempts++;
          
          // Switch to GET for the redirected location (standard browser/redirect behavior for POST)
          method = "GET";
          body = undefined;
          
          // Retain appropriate headers
          const acceptHeader = headers["Accept"] || headers["accept"];
          headers = {};
          if (acceptHeader) {
            headers["Accept"] = acceptHeader;
          }
          continue;
        }
      }
      return response;
    }
    throw new Error("Too many redirects");
  };

  // API Route: Get Questions
  app.get("/api/questions", async (req, res) => {
    const scriptUrl = getScriptUrl();

    if (isValidUrl(scriptUrl)) {
      try {
        console.log("Fetching questions from Google Apps Script:", scriptUrl);
        const response = await fetchWithRedirects(`${scriptUrl}?action=getQuestions`, {
          method: "GET",
          headers: { "Accept": "application/json" }
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            return res.json({ success: true, source: "google-docs", questions: data });
          }
        }
        console.warn("Google Apps Script did not return questions, falling back to local bank.");
      } catch (error) {
        console.error("Error fetching questions from Google Apps Script, falling back:", error);
      }
    } else {
      const rawUrl = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL;
      if (rawUrl) {
        console.warn(`Invalid GOOGLE_SCRIPT_URL provided: "${rawUrl}". Falling back to local bank.`);
      }
    }

    // Fallback to local high-quality questions
    res.json({
      success: true,
      source: "local-bank",
      questions: QUESTION_BANK
    });
  });

  // API Route: Save Results
  app.post("/api/save-results", async (req, res) => {
    const scriptUrl = getScriptUrl();
    const resultData = req.body;

    console.log("Saving exam results for:", resultData?.userData?.fullName);

    if (!isValidUrl(scriptUrl)) {
      console.log("No valid GOOGLE_SCRIPT_URL configured. Simulating successful save.");
      return res.json({
        success: true,
        demoMode: true,
        message: "¡Simulación de guardado exitosa! Para persistir los datos reales en Google Sheets, configure la variable de entorno GOOGLE_SCRIPT_URL con la URL de su Web App de Google Apps Script."
      });
    }

    try {
      console.log("Forwarding results to Google Apps Script:", scriptUrl);
      const response = await fetchWithRedirects(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(resultData)
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { text: responseText };
      }

      if (response.ok) {
        res.json({
          success: true,
          data: responseData
        });
      } else {
        res.status(response.status).json({
          success: false,
          error: "Error en el servidor de Google Apps Script",
          details: responseData
        });
      }
    } catch (error: any) {
      console.error("Error communicating with Google Apps Script:", error);
      res.status(500).json({
        success: false,
        error: "No se pudo conectar con el servicio de almacenamiento",
        message: error.message
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode. Integrating Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in production mode. Serving static files from dist/...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
