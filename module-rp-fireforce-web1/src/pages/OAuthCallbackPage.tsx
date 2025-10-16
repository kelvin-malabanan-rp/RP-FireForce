import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { oauthService } from "../services/auth-service";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "@/components/ui/button";

export function OAuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 OAuth callback page loaded');
        
        // Get parameters from URL
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        
        if (error) {
          throw new Error(decodeURIComponent(error));
        }
        
        // Get user data from URL (backend should pass this)
        const userData = params.get('user');
        const token = params.get('token');
        
        if (!userData) {
          throw new Error('No user data received from OAuth');
        }
        
        // Parse user data
        const user = JSON.parse(decodeURIComponent(userData));
        
        console.log('✅ Received OAuth user data:', user);
        
        // Process OAuth callback
        await oauthService.handleCallback({ user, token: token || undefined });
        
        setStatus('success');
        setMessage('Authentication successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
        
      } catch (error: any) {
        console.error('❌ OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        
        // Redirect to login after delay
        setTimeout(() => {
          window.location.href = '/login?error=' + encodeURIComponent(error.message);
        }, 3000);
      }
    };
    
    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/30 backdrop-blur-2xl border border-white/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-orange-500 mb-4" />
              <p className="text-white text-lg">{message}</p>
              <p className="text-white/60 text-sm mt-2">Please wait...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-white text-lg mb-2">Success!</p>
              <p className="text-white/60 text-sm">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-white text-lg mb-2">Authentication Failed</p>
              <p className="text-white/60 text-sm text-center">{message}</p>
              <Button
                onClick={() => window.location.href = '/login'}
                className="mt-4 bg-gradient-to-r from-orange-500 to-red-600"
              >
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}