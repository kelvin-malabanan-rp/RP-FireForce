// src/pages/OAuthSuccessPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth-service';

export function OAuthSuccessPage({ onSuccess }) {
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        console.log('🎯 OAuth Success Page mounted');
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
                    <div className="mt-4 text-xs text-white/40">
                        <p>Debug: {processing ? 'Processing...' : 'Complete'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}