import { useState, useEffect } from 'react'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { authService } from './services'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for OAuth callback
  useEffect(() => {
    // Check if we're on the OAuth callback route
    if (window.location.pathname === '/auth/callback') {
      // Don't check auth yet, let OAuthCallbackPage handle it
      setIsLoading(false);
      return;
    }

    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setIsLoggedIn(isAuth);
      setIsLoading(false);
    };
    
    checkAuth();

    const authCheckInterval = setInterval(() => {
      const isAuth = authService.isAuthenticated();
      if (isAuth !== isLoggedIn) {
        setIsLoggedIn(isAuth);
      }
    }, 1000);

    return () => {
      clearInterval(authCheckInterval);
    };
  }, [isLoggedIn]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Handle OAuth callback route
  if (window.location.pathname === '/auth/callback') {
    return <OAuthCallbackPage />;
  }

  if (isLoggedIn) {
    return <DashboardPage onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={handleLogin} />;
}

export default App
