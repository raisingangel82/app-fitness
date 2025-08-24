// src/components/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Questa funzione si aspetta un'altra funzione come argomento
  const handleAuth = async (authFn: () => Promise<any>) => {
    setError('');
    try {
      await authFn();
      navigate('/');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/wrong-password': setError("Password errata. Riprova."); break;
        case 'auth/user-not-found': setError("Nessun utente trovato con questa email."); break;
        case 'auth/email-already-in-use': setError("Questa email è già stata registrata."); break;
        default: setError("Si è verificato un errore.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Bentornato!</h1>
          <p className="text-gray-600 mt-2">Accedi o registrati per generare il tuo report fitness.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <form onSubmit={(e) => { e.preventDefault(); handleAuth(() => signInWithEmailAndPassword(auth, email, password)); }} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} id="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} id="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            {error && <div className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Accedi</button>
              <button type="button" onClick={() => handleAuth(() => createUserWithEmailAndPassword(auth, email, password))} className="w-full inline-flex justify-center py-2 px-4 border border-indigo-600 shadow-sm text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50">Registrati</button>
            </div>
          </form>
          {/* La modifica è qui: abbiamo aggiunto '() =>' prima di signInAnonymously */}
          <button onClick={() => handleAuth(() => signInAnonymously(auth))} className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Continua come ospite</button>
        </div>
      </div>
    </div>
  );
};