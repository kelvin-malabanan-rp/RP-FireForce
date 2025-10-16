import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function AuthError() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const error = searchParams.get('error');

    const getErrorMessage = (error: string | null) => {
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

    const getErrorTitle = (error: string | null) => {
        switch (error) {
            case 'server_error':
                return 'Server Error';
            case 'authentication_failed':
                return 'Authentication Failed';
            default:
                return 'Authentication Error';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
                <div className="bg-black/30 backdrop-blur-2xl border border-red-500/20 rounded-xl p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-4">{getErrorTitle(error)}</h1>
                    <p className="text-white/70 mb-6">{getErrorMessage(error)}</p>
                    <div className="space-y-3">
                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="w-full border-white/20 text-white hover:bg-white/10"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}