// src/components/BottomBar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Archive, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const NavItem: React.FC<{ to: string; icon: React.ElementType; label: string }> = ({ to, icon: Icon, label }) => {
  const { activeTheme } = useTheme();
  
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center justify-center h-full w-full text-xs transition-colors ${
          isActive 
            ? activeTheme.textClass 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={24} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
};

export const BottomBar: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-40">
      <div className="container mx-auto grid grid-cols-3 items-center h-full max-w-lg">
        <NavItem to="/" icon={FileText} label="Input Dati" />
        <NavItem to="/reports" icon={Archive} label="Archivio" />
        <NavItem to="/settings" icon={Settings} label="Impostazioni" />
      </div>
    </nav>
  );
};