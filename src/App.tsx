// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { BottomBar } from './components/BottomBar';
import { LoginPage } from './components/LoginPage';
import { InputPage } from './pages/InputPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Componente per il layout principale con Header e BottomBar
const AppLayout: React.FC = () => (
  <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
    <Header />
    <main className="flex-1 overflow-y-auto pb-20">
      {/* Outlet renderizza la pagina corrente (es. InputPage, ReportsPage) */}
      <Outlet />
    </main>
    <BottomBar />
  </div>
);

// Componente per proteggere le rotte
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Caricamento...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<InputPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      {/* Redireziona qualsiasi rotta non trovata alla home */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;