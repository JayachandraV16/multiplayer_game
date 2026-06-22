import React, { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import './App.css';

const AppContent = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-maroon-dark text-gold font-display gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin"></div>
        <p className="text-xs uppercase tracking-widest animate-pulse">Consulting the Sutradhar...</p>
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
