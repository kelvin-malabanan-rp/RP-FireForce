import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';

export function AuthSuccess() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleOAuthSuccess = async () => {
            try {
                // Get data from URL fragment
                const fragment = window.location.hash.substring(1);
                const params = new URLSearchParams(fragment);

                const token = params.get('token');
                const userId = params.get('userId');
                const email = params.get('email');
                const displayName = params.get('displayName');
                const avatarUrl = params.get('avatarUrl');

                if (token && userId && email) {
                    // Store token and user data
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('user', JSON.stringify({
                        id: userId,
                        email,
                        displayName,
                        avatarUrl
                    }));

                    console.log('✅ OAuth success! Redirecting to dashboard...');

                    // Small delay to show success message
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1500);
                } else {
                    setError('Missing authentication data');
                    setTimeout(() => {
                        navigate('/login?error=no_token');
                    }, 3000);
                }
            } catch (error) {
                console.error('OAuth success handling error:', error);
                setError('Failed to process authentication');
                setTimeout(() => {
                    navigate('/login?error=oauth_error');
                }, 3000);
            } finally {
                setLoading(false);
            }
        };

        handleOAuthSuccess();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
                <div className="bg-black/30 backdrop-blur-2xl border border-white/20 rounded-xl p-8 text-center">
                    {loading ? (
                        <>
                            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">Completing Authentication</h1>
                            <p className="text-white/70">Processing your login...</p>
                        </>
                    ) : error ? (
                        <>
                            <div className="text-red-400 text-6xl mb-4">⚠️</div>
                            <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
                            <p className="text-white/70 mb-4">{error}</p>
                            <p className="text-white/50 text-sm">Redirecting to login...</p>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">Login Successful!</h1>
                            <p className="text-white/70 mb-4">Welcome to FireForce</p>
                            <p className="text-white/50 text-sm">Redirecting to dashboard...</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}