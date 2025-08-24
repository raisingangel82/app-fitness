// src/components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, UserCog, Moon, Sun } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme, activeTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  return (
    <header className="flex-shrink-0 h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-50">
      <h1 className={`text-lg font-semibold ${activeTheme.textClass}`}>
        Report Fitness
      </h1>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none" aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-10 h-10 ${activeTheme.bgClass} text-white flex items-center justify-center rounded-full focus:outline-none focus:ring-2 ${activeTheme.ringClass} focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-semibold`}
          >
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </button>
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-50 py-1">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-sm truncate">{user?.isAnonymous ? 'Ospite' : user?.email}</p>
              </div>
              <Link to="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <UserCog size={16} /> Impostazioni
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};