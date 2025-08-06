// functions/index.js
//

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { VertexAI } = require("@google-cloud/vertexai");

// Inizializza Firebase Admin SDK
initializeApp();

// Configurazione della Cloud Function
const functionOptions = {
  region: "europe-west1", // Assicurati che sia la stessa regione del tuo Firestore
  timeoutSeconds: 300,
  cors: true, // Permetti chiamate dal tuo frontend
};

exports.generateReport = onCall(functionOptions, async (request) => {
  // 1. Controlla che l'utente sia autenticato
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "È necessario essere autenticati per generare un report.");
  }

  // 2. Prendi i dati inviati dal frontend
  const { reportData, historicalData, periodo } = request.data;
  if (!reportData || !periodo) {
    throw new HttpsError("invalid-argument", "Dati mancanti per la generazione del report.");
  }

  // 3. Costruisci il prompt per l'IA (identico a prima, ma sul backend)
  const historicalDataPrompt = historicalData.map(data => 
    `- Data: ${new Date(data.timestamp).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })} | Peso: ${data.peso || 'N/D'} kg, Massa Grassa: ${data.massa_grassa || 'N/D'} %, FC riposo: ${data.fc_riposo || 'N/D'} bpm`
  ).join('');

  const prompt = `Sei un esperto di salute e fitness... (Il resto del prompt rimane identico a prima, usando reportData, periodo e historicalDataPrompt)`; // Ometto il prompt completo per brevità

  try {
    // 4. Inizializza Vertex AI e chiama il modello Gemini
    const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "europe-west1" });
    const model = vertex_ai.getGenerativeModel({ model: "gemini-2.5-pro" });

    const result = await model.generateContent(prompt);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new HttpsError("internal", "L'AI non ha generato una risposta valida.");
    }
    
    // 5. Restituisci il testo del report al frontend
    return { reportText: responseText };

  } catch (error) {
    console.error("Errore durante la chiamata a Vertex AI:", error);
    throw new HttpsError("internal", "Si è verificato un errore durante la generazione del report da parte dell'IA.");
  }
});
