// src/pages/OAuthErrorPage.jsx
import { useNavigate } from 'react-router-dom';

export function OAuthErrorPage() {
    const navigate = useNavigate();

    const getErrorMessage = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');

        console.log('🚨 OAuth Error:', error);

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