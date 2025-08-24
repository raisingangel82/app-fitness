// src/pages/ReportsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // 1. Importa useTheme
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Report {
    id: string;
    generatedReportHTML: string;
    peso?: string;
    massa_grassa?: string;
}

export const ReportsPage: React.FC = () => {
    const { user } = useAuth();
    const { activeTheme } = useTheme(); // 2. Recupera il tema attivo
    const [reports, setReports] = useState<Report[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;

        const fetchReports = async () => {
            setIsLoading(true);
            setError('');
            try {
                const reportsCollection = collection(db, `users/${user.uid}/monthly_reports`);
                const q = query(reportsCollection, where("generatedReportHTML", "!=", ""));
                
                const querySnapshot = await getDocs(q);
                let fetchedReports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[];
                
                fetchedReports.sort((a, b) => b.id.localeCompare(a.id));
                
                setReports(fetchedReports);
            } catch (err) {
                console.error("Errore nel caricamento dei report:", err);
                setError("Impossibile caricare i report. Controlla le regole di Firestore e la tua connessione.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReports();
    }, [user]);

    // 3. Nuova funzione per gestire la selezione a fisarmonica
    const handleSelectReport = (report: Report) => {
        if (selectedReport?.id === report.id) {
            setSelectedReport(null); // Se clicco lo stesso report, lo chiudo
        } else {
            setSelectedReport(report); // Altrimenti, apro quello nuovo
        }
    };

    if (isLoading) return <div className="text-center p-8">Caricamento report archiviati...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <h1 className="text-3xl font-bold text-center">Archivio Report</h1>
            {reports.length === 0 ? (
                <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-gray-500 dark:text-gray-400">Nessun report trovato.</p>
                </div>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reports.map(report => (
                        <div key={report.id} onClick={() => handleSelectReport(report)} className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md cursor-pointer hover:shadow-xl transition-all border-2 ${selectedReport?.id === report.id ? activeTheme.ringClass.replace('ring-','border-') : 'border-transparent'}`}>
                            {/* 4. Applica il colore del tema al titolo */}
                            <h3 className={`font-bold text-lg ${activeTheme.textClass}`}>Report {report.id}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Peso: {report.peso || 'N/D'} kg</p>
                        </div>
                    ))}
                </div>
            )}
            {selectedReport && (
                <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Dettaglio Report: {selectedReport.id}</h2>
                    <div dangerouslySetInnerHTML={{ __html: selectedReport.generatedReportHTML }} className="prose dark:prose-invert max-w-none" />
                </div>
            )}
        </div>
    );
};