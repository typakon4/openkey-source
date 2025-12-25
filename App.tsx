import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Registration from './pages/Registration';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SearchPage from './pages/Search';
import { AppProvider, useApp } from './context';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useApp();
  const [showRegistration, setShowRegistration] = useState<boolean>(false);

  // Reset to Welcome screen when logged out
  useEffect(() => {
    if (!isAuthenticated) {
      setShowRegistration(false);
    }
  }, [isAuthenticated]);

  const handleStart = () => {
    setShowRegistration(true);
  };

  // Auth Flow
  if (!isAuthenticated) {
    if (showRegistration) {
      return <Registration />;
    }
    return <Welcome onStart={handleStart} />;
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ChatList />} />
          <Route path="/chat/:id" element={<ChatRoom />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;