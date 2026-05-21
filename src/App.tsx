import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EyeTrackingProvider } from './contexts/EyeTrackingContext'; // ← NEW
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Terms from './pages/Terms';
import Dashboard from './pages/Dashboard';
import ScreenieDetail from './pages/ScreenieDetail';
import { Page } from './hooks/useNavigate';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [params, setParams] = useState<{ id?: string }>({});

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<{ page: Page; params?: { id?: string } }>;
      setCurrentPage(customEvent.detail.page);
      setParams(customEvent.detail.params || {});
    };

    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  useEffect(() => {
    if (!loading && user && currentPage === 'landing') {
      setCurrentPage('dashboard');
    }
  }, [user, loading, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (currentPage === 'screenie-detail' && params.id) {
    return <ScreenieDetail id={params.id} onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'dashboard' && user) {
    return <Dashboard />;
  }

  if (currentPage === 'register') {
    return <Register />;
  }

  if (currentPage === 'login') {
    return <Login />;
  }

  if (currentPage === 'terms') {
    return <Terms />;
  }

  return <Landing />;
}

function App() {
  return (
    <AuthProvider>
      <EyeTrackingProvider> {/* ← NEW */}
        <AppContent />
      </EyeTrackingProvider> {/* ← NEW */}
    </AuthProvider>
  );
}

export default App;