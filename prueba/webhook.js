// webhook.js

/**
 * Este servidor Express expone el endpoint "/webhook/circleback" y:
 *  1) Guarda el payload completo en un archivo JSON (circleback-<timestamp>.json)
 *  2) Extrae y guarda por separado:
 *     - Meeting notes    → meeting-notes-<timestamp>.txt
 *     - Action items     → action-items-<timestamp>.json
 *     - Transcript       → transcript-<timestamp>.txt
 *     - Insights         → insights-<timestamp>.json
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1) Middleware para parsear JSON y verificar validez ---
app.use(
  express.json({
    limit: "10mb",     // Ajusta si prevés payloads muy grandes
    strict: true,
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        console.error("❌ Payload no es JSON válido:", e.message);
        throw new Error("Invalid JSON");
      }
    },
  })
);

// --- 2) Ruta POST para recibir el webhook ---
app.post("/webhook/circleback", (req, res) => {
  try {
    const payload = req.body;
    console.log("✅ Payload recibido desde Circleback.");

    // Generamos timestamp legible y sin caracteres inválidos de file name
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-"); // p.ej.: 2025-05-31T15-42-07-123Z

    // 2.1) Guardar payload completo
    const fullFilename = `circleback-${timestamp}.json`;
    const fullFilePath = path.join(__dirname, fullFilename);
    fs.writeFileSync(fullFilePath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`📁 Guardado payload completo en: ${fullFilename}`);

    // --- 3) Extraer y guardar cada sección por separado si existe ---

    // 3.1) Meeting Notes
    if (payload.meeting_notes) {
      // Asumimos que meeting_notes es un string (texto). Si es objeto, conviértelo a JSON o a texto
      const notes = typeof payload.meeting_notes === "string"
        ? payload.meeting_notes
        : JSON.stringify(payload.meeting_notes, null, 2);

      const notesFilename = `meeting-notes-${timestamp}.txt`;
      const notesPath = path.join(__dirname, notesFilename);
      fs.writeFileSync(notesPath, notes, "utf8");
      console.log(`✏️  Guardado Meeting Notes en: ${notesFilename}`);
    } else {
      console.log("ℹ️  No se encontró 'meeting_notes' en el payload.");
    }

    // 3.2) Action Items
    if (payload.action_items) {
      // Asumimos que action_items es un arreglo u objeto
      const items = JSON.stringify(payload.action_items, null, 2);
      const itemsFilename = `action-items-${timestamp}.json`;
      const itemsPath = path.join(__dirname, itemsFilename);
      fs.writeFileSync(itemsPath, items, "utf8");
      console.log(`📋 Guardado Action Items en: ${itemsFilename}`);
    } else {
      console.log("ℹ️  No se encontró 'action_items' en el payload.");
    }

    // 3.3) Transcript
    if (payload.transcript) {
      // Asumimos que transcript puede ser string largo; si viene como arreglo, convertimos a texto
      const transcriptText = Array.isArray(payload.transcript)
        ? payload.transcript.join("\n")
        : typeof payload.transcript === "string"
        ? payload.transcript
        : JSON.stringify(payload.transcript, null, 2);

      const transcriptFilename = `transcript-${timestamp}.txt`;
      const transcriptPath = path.join(__dirname, transcriptFilename);
      fs.writeFileSync(transcriptPath, transcriptText, "utf8");
      console.log(`📝 Guardado Transcript en: ${transcriptFilename}`);
    } else {
      console.log("ℹ️  No se encontró 'transcript' en el payload.");
    }

    // 3.4) Insights
    if (payload.insights) {
      // Asumimos que insights es un arreglo u objeto (listado de “insights” generados)
      const insightsJSON = JSON.stringify(payload.insights, null, 2);
      const insightsFilename = `insights-${timestamp}.json`;
      const insightsPath = path.join(__dirname, insightsFilename);
      fs.writeFileSync(insightsPath, insightsJSON, "utf8");
      console.log(`🔍 Guardado Insights en: ${insightsFilename}`);
    } else {
      console.log("ℹ️  No se encontró 'insights' en el payload.");
    }

    // 4) Respondemos 200 OK a Circleback
    return res.status(200).json({
      success: true,
      message: "Payload procesado y archivos guardados correctamente.",
      files: {
        full: fullFilename,
        ...(payload.meeting_notes && { meeting_notes: `meeting-notes-${timestamp}.txt` }),
        ...(payload.action_items && { action_items: `action-items-${timestamp}.json` }),
        ...(payload.transcript && { transcript: `transcript-${timestamp}.txt` }),
        ...(payload.insights && { insights: `insights-${timestamp}.json` }),
      },
    });
  } catch (error) {
    console.error("❌ Error procesando el webhook:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error interno procesando el webhook." });
  }
});

// --- 5) Ruta GET para verificar que el servidor está activo ---
app.get("/", (req, res) => {
  res.send("Servidor de Webhook Circleback activo.");
});

// --- 6) Iniciar el servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Webhook escuchando en http://localhost:${PORT}`);
});
