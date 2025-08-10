import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import LoadingSpinner from './components/LoadingSpinner';
import OfflineMessage from './components/OfflineMessage';
import { useState, useEffect } from 'react';

function AppContent() {
  const { user, loading } = useAuth();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check if we're in production (GitHub Pages) and show offline message
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    setIsOffline(isProduction);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <OfflineMessage isOffline={isOffline} />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

        {user ? (
          <Route path="/" element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/:projectId" element={<ProjectBoard />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
