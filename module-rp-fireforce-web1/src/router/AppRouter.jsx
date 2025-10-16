// src/router/AppRouter.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { authService } from '../services/auth-service';

// ==================== OAUTH SUCCESS HANDLER ====================
function OAuthSuccessHandler({ onSuccess }) {
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        console.log('🎯 OAuth Success Handler mounted');
        console.log('📍 Current URL:', window.location.href);
        console.log('📍 Pathname:', window.location.pathname);
        console.log('📍 Hash:', window.location.hash);
        
        const processCallback = async () => {
            try {
                // Extract OAuth data from URL fragment
                const oauthData = authService.processOAuthCallback();

                if (!oauthData) {
                    console.error('❌ Failed to extract OAuth data - redirecting to login with error');
                    setProcessing(false);
                    navigate('/?error=oauth_incomplete', { replace: true });
                    return;
                }

                console.log('✅ OAuth data extracted successfully');
                console.log('💾 Storing OAuth data...');

                // Store authentication data
                authService.storeOAuthData(oauthData);

                console.log('✅ OAuth data stored in localStorage');
                console.log('🔐 Calling onSuccess to update login state...');

                // Update login state FIRST
                onSuccess();

                console.log('⏱️ Waiting 1.5s before redirect...');

                // Show success briefly, then redirect to dashboard
                setTimeout(() => {
                    console.log('🚀 Redirecting to /dashboard');
                    setProcessing(false);
                    navigate('/dashboard', { replace: true });
                }, 1500);

            } catch (error) {
                console.error('❌ OAuth processing error:', error);
                setProcessing(false);
                navigate('/?error=oauth_error', { replace: true });
            }
        };

        processCallback();
    }, [navigate, onSuccess]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
                <div className="bg-black/30 backdrop-blur-2xl border border-white/20 rounded-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold text-white mb-2">Authentication Successful!</h1>
                    <p className="text-white/70 mb-4">Completing your login...</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Redirecting to dashboard</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== OAUTH ERROR HANDLER ====================
function OAuthErrorHandler() {
    const navigate = useNavigate();

    const getErrorMessage = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');

        switch (error) {
            case 'no_code':
                return 'Authorization code was not received from the provider.';
            case 'authentication_failed':
                return 'Authentication failed. Your account may not be authorized.';
            case 'server_error':
                return 'A server error occurred during authentication.';
            case 'oauth_incomplete':
                return 'OAuth data was incomplete. Please try again.';
            case 'oauth_error':
                return 'An error occurred while processing your authentication.';
            default:
                return 'An unknown authentication error occurred.';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
                <div className="bg-black/30 backdrop-blur-2xl border border-red-500/20 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
                    <p className="text-white/70 mb-6">{getErrorMessage()}</p>
                    <button
                        onClick={() => navigate('/', { replace: true })}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==================== PROTECTED ROUTE ====================
function ProtectedRoute({ children, isAuthenticated }) {
    if (!isAuthenticated) {
        console.log('🚫 Protected route - not authenticated, redirecting to login');
        return <Navigate to="/" replace />;
    }

    return children;
}

// ==================== MAIN APP ROUTER ====================
export function AppRouter() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('🎬 AppRouter mounted - checking authentication...');
        
        // Check if user is authenticated
        const isAuth = authService.isAuthenticated();
        console.log('🔐 Authentication status:', isAuth);
        
        setIsLoggedIn(isAuth);
        setIsLoading(false);
    }, []);

    const handleLogin = () => {
        console.log('✅ handleLogin called - updating state to logged in');
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        console.log('👋 Logging out...');
        authService.logout();
        setIsLoggedIn(false);
    };

    // Show loading screen
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <div className="text-white text-lg">Loading...</div>
                </div>
            </div>
        );
    }

    console.log('🎨 Rendering routes - isLoggedIn:', isLoggedIn);

    return (
        <Routes>
            {/* Login Route */}
            <Route 
                path="/" 
                element={
                    isLoggedIn ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <LoginPage onLogin={handleLogin} />
                    )
                } 
            />

            {/* OAuth Success Route */}
            <Route 
                path="/auth/success" 
                element={<OAuthSuccessHandler onSuccess={handleLogin} />} 
            />

            {/* OAuth Error Route */}
            <Route 
                path="/auth/error" 
                element={<OAuthErrorHandler />} 
            />

            {/* Dashboard Route (Protected) */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute isAuthenticated={isLoggedIn}>
                        <DashboardPage onLogout={handleLogout} />
                    </ProtectedRoute>
                } 
            />

            {/* Catch-all - redirect to login or dashboard */}
            <Route 
                path="*" 
                element={<Navigate to={isLoggedIn ? "/dashboard" : "/"} replace />} 
            />
        </Routes>
    );
}

export default AppRouter;