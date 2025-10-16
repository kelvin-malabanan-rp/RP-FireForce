import { Button } from '../components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

// @ts-ignore
export function AuthError({ onBackToLogin }) {
    const getErrorMessage = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');

        switch (error) {
            case 'no_code':
                return 'Authorization code was not received. Please try again.';
            case 'authentication_failed':
                return 'Authentication failed. Please check your account and try again.';
            case 'server_error':
                return 'A server error occurred. Please try again later.';
            case 'no_token':
                return 'Authentication token was not received.';
            case 'oauth_error':
                return 'An error occurred during OAuth processing.';
            default:
                return 'An unknown error occurred during authentication.';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
                <div className="bg-black/30 backdrop-blur-2xl border border-red-500/20 rounded-xl p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
                    <p className="text-white/70 mb-6">{getErrorMessage()}</p>
                    <Button
                        onClick={onBackToLogin}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Button>
                </div>
            </div>
        </div>
    );
}