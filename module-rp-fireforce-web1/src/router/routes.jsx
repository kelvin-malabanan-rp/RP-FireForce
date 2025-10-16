// src/router/routes.jsx
// Laravel-style route configuration for FireForce Web App

import { Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { OAuthSuccessPage } from '../pages/OAuthSuccessPage';
import { OAuthErrorPage } from '../pages/OAuthErrorPage';

/**
 * Protected Route Wrapper
 * Similar to Laravel's auth middleware
 */
export const ProtectedRoute = ({ children, isAuthenticated }) => {
    if (!isAuthenticated) {
        console.log('🚫 Protected route - redirecting to login');
        return <Navigate to="/" replace />;
    }
    return children;
};

/**
 * Guest Route Wrapper
 * Redirects authenticated users away from login/register pages
 */
export const GuestRoute = ({ children, isAuthenticated }) => {
    if (isAuthenticated) {
        console.log('✅ Already authenticated - redirecting to dashboard');
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

/**
 * Route Definitions
 * Similar to Laravel's Route::get(), Route::post(), etc.
 * 
 * Structure:
 * {
 *   path: string,
 *   element: ReactElement,
 *   protected: boolean,  // Like Laravel's ->middleware('auth')
 *   guest: boolean,      // Like Laravel's ->middleware('guest')
 * }
 */
export const routes = (isLoggedIn, handleLogin, handleLogout) => [
    // ==================== GUEST ROUTES ====================
    {
        path: '/',
        element: (
            <GuestRoute isAuthenticated={isLoggedIn}>
                <LoginPage onLogin={handleLogin} />
            </GuestRoute>
        ),
        name: 'login',
        middleware: 'guest'
    },

    // ==================== OAUTH ROUTES ====================
    {
        path: '/auth/success',
        element: <OAuthSuccessPage onSuccess={handleLogin} />,
        name: 'oauth.success',
        middleware: 'guest'
    },
    {
        path: '/auth/error',
        element: <OAuthErrorPage />,
        name: 'oauth.error',
        middleware: 'guest'
    },

    // ==================== PROTECTED ROUTES ====================
    {
        path: '/dashboard',
        element: (
            <ProtectedRoute isAuthenticated={isLoggedIn}>
                <DashboardPage onLogout={handleLogout} />
            </ProtectedRoute>
        ),
        name: 'dashboard',
        middleware: 'auth'
    },

    // ==================== FALLBACK ROUTE ====================
    {
        path: '*',
        element: <Navigate to={isLoggedIn ? '/dashboard' : '/'} replace />,
        name: 'fallback'
    }
];

/**
 * Route Groups (like Laravel's Route::group())
 * You can organize routes by prefix, middleware, etc.
 */
export const routeGroups = {
    auth: [
        { path: '/', name: 'login' },
        { path: '/auth/success', name: 'oauth.success' },
        { path: '/auth/error', name: 'oauth.error' },
    ],
    dashboard: [
        { path: '/dashboard', name: 'dashboard' },
    ]
};

/**
 * Named Routes Helper
 * Similar to Laravel's route('name')
 */
export const route = (name) => {
    const routeMap = {
        'login': '/',
        'oauth.success': '/auth/success',
        'oauth.error': '/auth/error',
        'dashboard': '/dashboard',
    };
    
    return routeMap[name] || '/';
};

export default routes;