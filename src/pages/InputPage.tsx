// src/pages/InputPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // 1. Importa useTheme
import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs, query } from 'firebase/firestore';

type FormData = { [key: string]: any };

export const InputPage: React.FC = () => {
    const { user } = useAuth();
    const { activeTheme } = useTheme(); // 2. Recupera il tema attivo
    const [formData, setFormData] = useState<FormData>({});
    const [reportResult, setReportResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        setFormData(prev => ({...prev, periodo: `${year}-${month}`}));

        if (user) {
            const userDocRef = doc(db, `users/${user.uid}/profile`, "data");
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    setFormData(prev => ({ ...prev, ...docSnap.data() }));
                }
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSaveDraft = () => {
        try {
            localStorage.setItem('healthFormDataDraft', JSON.stringify(formData));
            alert('Bozza salvata con successo nel browser!');
        } catch (e) {
            alert('Impossibile salvare la bozza.');
        }
    };
    
    const handleLoadDraft = () => {
        const draft = localStorage.getItem('healthFormDataDraft');
        if (draft) {
            setFormData(JSON.parse(draft));
            alert('Bozza caricata!');
        } else {
            alert('Nessuna bozza trovata.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        const periodo = formData.periodo;
        if (!periodo) {
            alert("Per favore, seleziona un mese e un anno per il report.");
            return;
        }

        const reportDocRef = doc(db, `users/${user.uid}/monthly_reports`, periodo);
        const docSnap = await getDoc(reportDocRef);

        if (docSnap.exists()) {
            if (!window.confirm(`Esiste già un report per ${periodo}. Vuoi sovrascriverlo?`)) {
                return;
            }
        }

        setIsLoading(true);
        setError('');
        setReportResult('');
        setStatus('Salvataggio dati in corso...');

        const profileData = { eta: formData.eta, sesso: formData.sesso, livello_attivita: formData.livello_attivita };
        const reportData = { ...formData, timestamp: new Date(`${periodo}-01T12:00:00Z`).toISOString() };
        
        try {
            await setDoc(doc(db, `users/${user.uid}/profile`, "data"), profileData, { merge: true });
            await setDoc(reportDocRef, reportData, { merge: true });
            setStatus('Dati salvati. Generazione del report AI...');

            const historicalData = (await getDocs(query(collection(db, `users/${user.uid}/monthly_reports`)))).docs.map(doc => doc.data());
            historicalData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            const functionUrl = "https://europe-west1-mio-report-fitness.cloudfunctions.net/generateReport";
            const response = await fetch(functionUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: { reportData, historicalData, periodo } }),
            });

            if (!response.ok) throw new Error(`Errore dalla Cloud Function: ${response.statusText}`);
            
            const result = await response.json();
            if (!result.reportText) throw new Error("La Cloud Function non ha restituito un report valido.");
            
            const formattedHtml = result.reportText.replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>').replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/^\* (.*)/gm, '<li class="ml-4 list-disc">$1</li>');
            
            await setDoc(reportDocRef, { generatedReportHTML: formattedHtml }, { merge: true });
            setReportResult(formattedHtml);
            setStatus('Report generato e salvato con successo!');

        } catch (err: any) {
            setError(`Si è verificato un errore: ${err.message}`);
            setStatus('');
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatus(''), 5000);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold">Dashboard Salute & Fitness</h1>
                <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Compila il form per generare la tua analisi personalizzata.</p>
            </header>
            
            <div className="flex gap-4 mb-6">
                <button type="button" onClick={handleSaveDraft} className="w-full justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">Salva Bozza</button>
                <button type="button" onClick={handleLoadDraft} className="w-full justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">Carica Bozza</button>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-indigo-50 dark:bg-gray-700/50">
                    <label htmlFor="periodo">Seleziona il mese e l'anno:</label>
                    <input type="month" id="periodo" name="periodo" value={formData.periodo || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-2" />
                </div>
                
                <details className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"><summary className="font-semibold text-lg cursor-pointer">Dati Bilancia Impedenziometrica</summary><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {['peso', 'imc', 'massa_grassa', 'acqua', 'metabolismo_basale', 'grasso_viscerale', 'muscoli', 'proteine', 'massa_ossea'].map(id => (
                        <div key={id}><label htmlFor={id} className="capitalize block text-sm font-medium text-gray-700 dark:text-gray-300">{id.replace('_', ' ')}</label><input type="number" step="any" id={id} value={formData[id] || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-2" /></div>
                    ))}
                </div></details>

                <details className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"><summary className="font-semibold text-lg cursor-pointer">Dati App Salute (Orologio)</summary><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                     {['esercizio_kcal', 'fc_riposo', 'fc_min_max', 'riposo_punti', 'media_sonno_ore', 'sonno_profondo_perc', 'sonno_leggero_perc', 'sonno_rem_perc', 'regolarita_sonno', 'stress_medio', 'spo2', 'temp_cutanea'].map(id => (
                        <div key={id}><label htmlFor={id} className="capitalize block text-sm font-medium text-gray-700 dark:text-gray-300">{id.replace('_', ' ')}</label><input type={id.includes('perc') || id.includes('kcal') || id.includes('punti') ? 'number' : 'text'} id={id} value={formData[id] || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-2" /></div>
                    ))}
                </div></details>
                
                <details className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"><summary className="font-semibold text-lg cursor-pointer">Dati App YAZIO (Nutrizione)</summary><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                     {['energia_alimentare', 'carboidrati', 'proteine_yazio', 'grassi', 'acqua_yazio', 'passi'].map(id => (
                        <div key={id}><label htmlFor={id} className="capitalize block text-sm font-medium text-gray-700 dark:text-gray-300">{id.replace('_', ' ')}</label><input type="number" step="any" id={id} value={formData[id] || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-2" /></div>
                    ))}
                </div></details>
                
                <details className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"><summary className="font-semibold text-lg cursor-pointer">Note e Referti</summary><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div><label htmlFor="report_pt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Report Personal Trainer</label><textarea id="report_pt" rows={4} value={formData.report_pt || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-2"></textarea></div>
                    <div><label htmlFor="report_medici" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referti Medici</label><textarea id="report_medici" rows={4} value={formData.report_medici || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-2"></textarea></div>
                </div></details>
                
                <div className="text-center">
                    {/* 3. Applica il colore del tema al pulsante */}
                    <button type="submit" disabled={isLoading} className={`inline-flex justify-center py-3 px-6 border border-transparent shadow-lg text-base font-medium rounded-full text-white ${activeTheme.bgClass} hover:opacity-90 disabled:bg-gray-400 dark:disabled:bg-gray-600`}>
                        {isLoading ? 'Generazione...' : 'Salva e Genera Report'}
                    </button>
                    {status && <p className="text-sm text-gray-500 mt-2">{status}</p>}
                </div>
            </form>

            {reportResult && (
                <div className="mt-10 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-center mb-6">Il Tuo Report Mensile</h2>
                    <div dangerouslySetInnerHTML={{ __html: reportResult }} className="prose dark:prose-invert max-w-none" />
                </div>
            )}
            {error && (
                 <div className="mt-10 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                    <p><strong className="font-bold">Errore!</strong> {error}</p>
                </div>
            )}
        </div>
    );
};