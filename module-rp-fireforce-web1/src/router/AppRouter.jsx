// src/router/AppRouter.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth-service';
import { ProtectedRoute } from './routes';

// Import pages
import { LoginPage } from '../pages/LoginPage';
import { OAuthSuccessPage } from '../pages/OAuthSuccessPage';
import { OAuthErrorPage } from '../pages/OAuthErrorPage';

// Import Dashboard components
import { DashboardTopNav } from '../components/layout/DashboardTopNav';
import { DashboardSideNav } from '../components/layout/DashboardSideNav';
import { GlobalAlertModal } from '../components/modals/GlobalAlertModal';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { AnalyticsPage } from '../components/dashboard/AnalyticsPage';
import { IncidentsPage } from '../components/dashboard/IncidentsPage';
import { OnCallPage } from '../components/dashboard/OnCallPageClean';
import { TeamsPage } from '../components/dashboard/TeamsPage';
import { AuditTrailPage } from '../components/dashboard/AuditTrailPage';
import { SettingsPage } from '../components/dashboard/SettingsPage';

// ==================== DASHBOARD LAYOUT WRAPPER ====================
function DashboardLayoutWrapper({ onLogout }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleNavigate = (page) => {
        console.log('📍 DashboardLayout handleNavigate called:', page);
        
        if (page === "logout") {
            onLogout();
            return;
        }
        
        // Don't navigate here - let the sidebar handle it with React Router
        console.log('⚠️ Navigation should be handled by sidebar directly');
    };

    // Get current page from URL
    const currentPage = location.pathname.split('/')[2] || 'overview';
    console.log('📍 Current page from URL:', currentPage, '(full path:', location.pathname, ')');

    return (
        <div className="min-h-screen bg-background">
            {/* Global alert modal */}
            <GlobalAlertModal />
            
            {/* Top Navigation */}
            <DashboardTopNav 
                onMenuToggle={toggleSidebar} 
                isSidebarOpen={isSidebarOpen}
                onNavigate={handleNavigate}
            />

            <div className="flex">
                {/* Side Navigation */}
                <DashboardSideNav
                    isOpen={isSidebarOpen}
                    onNavigate={handleNavigate}
                    onToggle={toggleSidebar}
                    currentPage={currentPage}
                />

                {/* Main Content - This is where nested routes render */}
                <main className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                    <div className="w-full max-w-[1600px] mx-auto p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
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
            {/* ==================== GUEST ROUTES ==================== */}
            
            {/* Login */}
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

            {/* OAuth Success */}
            <Route 
                path="/auth/success" 
                element={<OAuthSuccessPage onSuccess={handleLogin} />} 
            />

            {/* OAuth Error */}
            <Route 
                path="/auth/error" 
                element={<OAuthErrorPage />} 
            />

            {/* ==================== DASHBOARD ROUTES (NESTED) ==================== */}
            
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute isAuthenticated={isLoggedIn}>
                        <DashboardLayoutWrapper onLogout={handleLogout} />
                    </ProtectedRoute>
                }
            >
                {/* Nested Dashboard Routes */}
                <Route index element={<DashboardOverview />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="incidents" element={<IncidentsPage />} />
                <Route path="on-call" element={<OnCallPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="audit-trail" element={<AuditTrailPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* ==================== FALLBACK ==================== */}
            <Route 
                path="*" 
                element={<Navigate to={isLoggedIn ? '/dashboard' : '/'} replace />} 
            />
        </Routes>
    );
}

export default AppRouter;