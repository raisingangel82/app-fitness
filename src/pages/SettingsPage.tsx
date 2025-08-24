// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Moon, Sun, Palette } from 'lucide-react';
import { themeColorPalettes } from '../data/colorPalette';

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { theme, toggleTheme, activeColor, setActiveColor, activeShade, setActiveShade, activeTheme } = useTheme();
    const [profile, setProfile] = useState({ eta: '', sesso: '', livello_attivita: 'Sedentario' });
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, `users/${user.uid}/profile`, "data");
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as any);
                }
            });
        }
    }, [user]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setProfile(prev => ({...prev, [id]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        setStatus('Salvataggio...');
        try {
            await setDoc(doc(db, `users/${user.uid}/profile`, "data"), profile, { merge: true });
            setStatus('Dati salvati con successo!');
        } catch (error) {
            setStatus('Errore durante il salvataggio.');
        }
        setTimeout(() => setStatus(''), 3000);
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <h1 className="text-3xl font-bold text-center">Impostazioni</h1>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">Dati Anagrafici</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="eta" className="block text-sm font-medium">Età</label>
                        <input type="number" id="eta" value={profile.eta} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="sesso" className="block text-sm font-medium">Sesso Biologico</label>
                        <select id="sesso" value={profile.sesso} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-2">
                            <option value="">Seleziona...</option>
                            <option value="Maschio">Maschio</option>
                            <option value="Femmina">Femmina</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="livello_attivita" className="block text-sm font-medium">Livello Attività Fisica</label>
                        <select id="livello_attivita" value={profile.livello_attivita} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-2">
                            <option value="Sedentario">Sedentario</option>
                            <option value="Leggermente Attivo">Leggermente Attivo</option>
                            <option value="Attivo">Attivo</option>
                            <option value="Molto Attivo">Molto Attivo</option>
                        </select>
                    </div>
                    <div className="text-right">
                        <button onClick={handleSave} className={`py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${activeTheme.bgClass} hover:opacity-90`}>Salva Dati</button>
                        {status && <p className="text-sm text-gray-500 mt-2">{status}</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Palette/> Aspetto</h2>
                <div className="space-y-4 divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="pt-4 first:pt-0 flex items-center justify-between">
                        <label className="font-medium">Modalità</label>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            {theme === 'light' ? <Moon /> : <Sun />}
                        </button>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                        <label className="font-medium">Colore</label>
                        <div className="flex gap-2 flex-wrap justify-end">
                            {themeColorPalettes.map(palette => (
                                <button key={palette.base} onClick={() => setActiveColor(palette.base)} 
                                        className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${activeColor.base === palette.base ? `ring-2 ring-offset-2 ${activeTheme.ringClass} dark:ring-offset-gray-800` : ''}`} 
                                        style={{ backgroundColor: palette.shades['700'].hex }} 
                                        aria-label={`Seleziona colore ${palette.name}`} />
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                        <label className="font-medium">Tonalità</label>
                        <div className="flex rounded-lg p-1 bg-gray-200 dark:bg-gray-700">
                            {(['400', '700', '800'] as const).map(shade => (
                                <button key={shade} onClick={() => setActiveShade(shade)} 
                                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeShade === shade ? `${activeTheme.bgClass} text-white shadow` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600/50'}`}>
                                    {shade}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};