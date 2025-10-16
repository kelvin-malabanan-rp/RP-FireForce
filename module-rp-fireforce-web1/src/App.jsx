import { useState, useEffect } from 'react'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { authService } from './services'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';


function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [currentView, setCurrentView] = useState('loading') // 'loading', 'login', 'dashboard', 'auth-processing'

    useEffect(() => {
        // Check if we're on OAuth success page
        if (window.location.pathname === '/auth/success' && window.location.hash) {
            console.log('🎯 OAuth success page detected!');
            setCurrentView('auth-processing');
            handleOAuthCallback();
            return;
        }

        // Check if we have an error
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        if (error) {
            console.log('🚨 OAuth error detected:', error);
            // Clear the error from URL and show login
            window.history.replaceState({}, document.title, '/');
            setCurrentView('login');
            setIsLoading(false);
            return;
        }

        // Regular auth check
        const checkAuth = () => {
            const isAuth = authService.isAuthenticated();
            setIsLoggedIn(isAuth);
            setCurrentView(isAuth ? 'dashboard' : 'login');
            setIsLoading(false);
        };

        checkAuth();

        // Periodically check auth status
        const authCheckInterval = setInterval(() => {
            if (currentView === 'dashboard' || currentView === 'login') {
                const isAuth = authService.isAuthenticated();
                if (isAuth !== isLoggedIn) {
                    setIsLoggedIn(isAuth);
                    setCurrentView(isAuth ? 'dashboard' : 'login');
                }
            }
        }, 1000);

        return () => {
            clearInterval(authCheckInterval);
        };
    }, [isLoggedIn, currentView]);

    const handleOAuthCallback = async () => {
        try {
            console.log('🔄 Processing OAuth callback...');

            // Get data from URL fragment
            const fragment = window.location.hash.substring(1);
            const params = new URLSearchParams(fragment);

            const token = params.get('token');
            const userId = params.get('userId');
            const email = params.get('email');
            const displayName = params.get('displayName');
            const avatarUrl = params.get('avatarUrl');

            console.log('📦 OAuth data:', {
                hasToken: !!token,
                tokenPreview: token?.substring(0, 20) + '...',
                userId,
                email,
                displayName
            });

            if (token && userId && email) {
                // Store authentication data
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify({
                    id: userId,
                    email,
                    displayName,
                    avatarUrl
                }));

                console.log('✅ OAuth data stored successfully!');

                // Clear URL and redirect to dashboard
                window.history.replaceState({}, document.title, '/');

                // Set logged in after a brief delay to show success
                setTimeout(() => {
                    setIsLoggedIn(true);
                    setCurrentView('dashboard');
                }, 2000);
            } else {
                console.error('❌ Missing required OAuth data');
                window.history.replaceState({}, document.title, '/?error=oauth_incomplete');
                setCurrentView('login');
            }
        } catch (error) {
            console.error('❌ OAuth processing error:', error);
            window.history.replaceState({}, document.title, '/?error=oauth_error');
            setCurrentView('login');
        }
    };

    const handleLogin = () => {
        setIsLoggedIn(true);
        setCurrentView('dashboard');
    };

    const handleLogout = () => {
        authService.logout();
        setIsLoggedIn(false);
        setCurrentView('login');
    };

    // Show loading screen
    if (isLoading || currentView === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    // Show OAuth processing screen
    if (currentView === 'auth-processing') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-black/30 backdrop-blur-2xl border border-white/20 rounded-xl p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <h1 className="text-2xl font-bold text-white mb-2">Completing Authentication</h1>
                        <p className="text-white/70">Processing your login...</p>
                        <div className="mt-4 text-xs text-white/50">
                            <p>URL: {window.location.href.substring(0, 60)}...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'dashboard') {
        return <DashboardPage onLogout={handleLogout} />;
    }

    return <LoginPage onLogin={handleLogin} />;
}

export default App