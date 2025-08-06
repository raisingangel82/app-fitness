// functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { VertexAI } = require("@google-cloud/vertexai");
const cors = require("cors")({ origin: "https://app-fitness-delta.vercel.app" });

// Inizializza Firebase Admin SDK
initializeApp();

// Configurazione della Cloud Function
const functionOptions = {
  region: "europe-west1",
  timeoutSeconds: 300,
};

exports.generateReport = onRequest(functionOptions, (request, response) => {
  // Avvolgi la logica in un middleware CORS
  cors(request, response, async () => {
    
    // Controlla che la richiesta sia di tipo POST
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const { reportData, historicalData, periodo } = request.body.data;
    
    // Se la funzione è protetta da un token, il controllo va fatto qui
    // Se invece è pubblica, questo blocco può essere rimosso.
    // In questo esempio lo lascio commentato per flessibilità.
    /*
    if (!request.headers.authorization) {
        response.status(401).send("Unauthorized");
        return;
    }
    */

    if (!reportData || !periodo) {
      response.status(400).send("Dati mancanti per la generazione del report.");
      return;
    }

    const historicalDataPrompt = historicalData.map(data => 
      `- Data: ${new Date(data.timestamp).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })} | Peso: ${data.peso || 'N/D'} kg, Massa Grassa: ${data.massa_grassa || 'N/D'} %, FC riposo: ${data.fc_riposo || 'N/D'} bpm`
    ).join('\n');

    const prompt = `
Sei un esperto di salute e fitness. Analizza i dati forniti per il periodo "${periodo}" e, se disponibili, confrontali con i dati storici per identificare tendenze e cambiamenti. Fornisci un'analisi dettagliata e consigli personalizzati.

### Dati Anagrafici e Stile di Vita
- Età: ${reportData.eta || 'N/D'}
- Sesso Biologico: ${reportData.sesso || 'N/D'}
- Livello di Attività Fisica: ${reportData.livello_attivita || 'N/D'}
- Report Personal Trainer: ${reportData.report_pt || 'N/D'}
- Referti Medici: ${reportData.report_medici || 'N/D'}

### Dati di questo Mese (${periodo})
- Peso: ${reportData.peso || 'N/D'} kg
- IMC: ${reportData.imc || 'N/D'}
- Massa Grassa: ${reportData.massa_grassa || 'N/D'} %
- Acqua: ${reportData.acqua || 'N/D'} %
- Metabolismo Basale: ${reportData.metabolismo_basale || 'N/D'} kcal
- Grasso Viscerale: ${reportData.grasso_viscerale || 'N/D'}
- Muscoli: ${reportData.muscoli || 'N/D'} kg
- Proteine: ${reportData.proteine || 'N/D'} %
- Massa Ossea: ${reportData.massa_ossea || 'N/D'} kg
- Esercizio Totale: ${reportData.esercizio_kcal || 'N/D'} kcal (valore totale per il mese)
- FC a riposo: ${reportData.fc_riposo || 'N/D'} bpm
- FC min/max: ${reportData.fc_min_max || 'N/D'} bpm
- Media Riposo Notturno: ${reportData.riposo_punti || 'N/D'} punti
- Media Sonno: ${reportData.media_sonno_ore || 'N/D'}
- Sonno Profondo: ${reportData.sonno_profondo_perc || 'N/D'} %
- Sonno Leggero: ${reportData.sonno_leggero_perc || 'N/D'} %
- Sonno REM: ${reportData.sonno_rem_perc || 'N/D'} %
- Regolarità Sonno: ${reportData.regolarita_sonno || 'N/D'} punti
- Stress Medio: ${reportData.stress_medio || 'N/D'} punti
- SPo2 Mensile: ${reportData.spo2 || 'N/D'} %
- Temp. Cutanea: ${reportData.temp_cutanea || 'N/D'} °C
- Energia Alimentare: ${reportData.energia_alimentare || 'N/D'} kcal/giorno
- Carboidrati: ${reportData.carboidrati || 'N/D'} g/giorno
- Proteine (Yazio): ${reportData.proteine_yazio || 'N/D'} g/giorno
- Grassi: ${reportData.grassi || 'N/D'} g/giorno
- Acqua (Yazio): ${reportData.acqua_yazio || 'N/D'} L/giorno
- Passi medi: ${reportData.passi || 'N/D'} al giorno

### Dati Storici per l'Analisi delle Tendenze (se disponibili)
${historicalDataPrompt || 'Nessun dato storico disponibile.'}

Sulla base di tutti questi dati, genera un report in formato HTML. Rispondi solo con il codice HTML, senza tag di apertura o chiusura di markdown (come \`\`\`html) e senza nessun testo aggiuntivo. Il report deve essere strutturato in sezioni chiare con intestazioni (## e ###) e deve coprire i seguenti punti:
1.  **Riepilogo e Analisi Generale:** Un'analisi complessiva dei dati di questo mese e, se presenti, un confronto con le tendenze storiche.
2.  **Analisi Composizione Corporea:** Valuta peso, massa grassa, muscoli, IMC e grasso viscerale.
3.  **Analisi sonno e recupero:** Valuta i dati sul sonno e sulla frequenza cardiaca a riposo.
4.  **Analisi nutrizionale e attività fisica:** Analizza i dati di YAZIO e dell'attività fisica. **Ricorda che l'esercizio totale in kcal è un valore mensile.**
5.  **Punti di Forza e Punti di Debolezza:** Individua i tuoi punti di forza e le aree in cui potresti migliorare.
6.  **Consigli Pratici per il prossimo mese:** Suggerisci 3-5 azioni concrete per ottimizzare i risultati.
`

    try {
      const vertex_ai = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "europe-west1" });
      const model = vertex_ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      const result = await model.generateContent(prompt);
      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error("L'AI non ha generato una risposta valida.");
      }
      
      response.status(200).json({ reportText: responseText });

    } catch (error) {
      console.error("Errore durante la chiamata a Vertex AI:", error);
      response.status(500).json({
        error: "Si è verificato un errore durante la generazione del report da parte dell'IA.",
        details: error.message,
      });
    }
  });
});