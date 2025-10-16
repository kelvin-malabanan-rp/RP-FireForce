import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { BASE_URL_DEV } from '@/utils/backend-url';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'github';

interface OAuthUserData {
    token: string;
    userId: string;
    email: string;
    displayName: string;
    avatarUrl: string;
}

interface UseOAuthProps {
    provider: OAuthProvider;
    onSuccess: (userData: OAuthUserData) => void;
    onError: (error: string) => void;
}

export const useOAuth = ({ provider, onSuccess, onError }: UseOAuthProps) => {
    const [isLoading, setIsLoading] = useState(false);

    // OAuth endpoints
    const getAuthUrl = (provider: OAuthProvider) => {
        const clientId = provider === 'google'
            ? '283926364231-8si8eo6op627qgd4gh3ud1vqtot0d17m.apps.googleusercontent.com'
            : 'Ov23liEd7rA6wT0SEIVZ';

        const redirectUri = `${BASE_URL_DEV}/auth/${provider}/callback`;

        if (provider === 'google') {
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'openid profile email',
                access_type: 'offline'
            });
            return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        } else {
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: 'read:user user:email'
            });
            return `https://github.com/login/oauth/authorize?${params.toString()}`;
        }
    };

    // Listen for deep link redirect from backend
    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const url = new URL(event.url);

            if (url.hostname === 'auth' && url.pathname === '/callback') {
                const params = new URLSearchParams(url.search);
                const error = params.get('error');

                if (error) {
                    onError(error);
                    setIsLoading(false);
                    return;
                }

                const token = params.get('token');
                const userId = params.get('userId');
                const email = params.get('email');
                const displayName = params.get('displayName');
                const avatarUrl = params.get('avatarUrl');

                if (token && userId && email) {
                    onSuccess({
                        token,
                        userId,
                        email,
                        displayName: displayName || '',
                        avatarUrl: avatarUrl || ''
                    });
                } else {
                    onError('Invalid response from authentication server');
                }

                setIsLoading(false);
            }
        };

        // Add event listener
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened with a deep link
        Linking.getInitialURL().then(url => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => {
            subscription.remove();
        };
    }, [onSuccess, onError]);

    const initiateOAuth = async () => {
        try {
            setIsLoading(true);
            console.log(`Initiating ${provider} OAuth...`);

            const authUrl = getAuthUrl(provider);
            console.log('Auth URL:', authUrl);

            // Open browser for OAuth
            await WebBrowser.openBrowserAsync(authUrl);

        } catch (error: any) {
            console.error(`${provider} OAuth error:`, error);
            onError(error.message || 'Failed to start authentication');
            setIsLoading(false);
        }
    };

    return {
        initiateOAuth,
        isLoading
    };
};