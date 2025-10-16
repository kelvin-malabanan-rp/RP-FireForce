import { apiService } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  'https://incident-webhook-api.rapidresponse.workers.dev';

export type OAuthProvider = 'google' | 'microsoft' | 'github';

interface OAuthStartResponse {
  success: boolean;
  httpStatus: string;
  data: {
    authUrl: string;
    state: string;
  };
}

interface OAuthCallbackData {
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    teamId: string | null;
    teamRole: string | null;
    avatar?: string;
  };
  error?: string;
}

class OAuthService {
  /**
   * Initiate OAuth flow
   * Redirects to provider's consent screen
   */
  async startOAuthFlow(provider: OAuthProvider) {
    try {
      console.log(`🔐 Starting ${provider} OAuth flow...`);
      
      // Get authorization URL from backend
      const response = await fetch(
        `${API_BASE_URL}/api/auth/oauth/start?provider=${provider}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to start OAuth flow: ${response.status}`);
      }
      
      const result: OAuthStartResponse = await response.json();
      
      if (result.httpStatus !== 'OK' || !result.data?.authUrl) {
        throw new Error('Invalid OAuth response from server');
      }
      
      // Store state for validation
      sessionStorage.setItem('oauth_state', result.data.state);
      sessionStorage.setItem('oauth_provider', provider);
      
      console.log('✅ Redirecting to OAuth provider:', provider);
      
      // Full page redirect to OAuth provider
      window.location.href = result.data.authUrl;
      
    } catch (error: any) {
      console.error('❌ OAuth start error:', error);
      throw error;
    }
  }
  
  /**
   * Handle OAuth callback
   * Called when OAuth provider redirects back to /auth/callback
   */
  async handleCallback(callbackData: OAuthCallbackData): Promise<void> {
    try {
      console.log('📥 Processing OAuth callback...');
      
      // Check for errors
      if (callbackData.error) {
        throw new Error(callbackData.error);
      }
      
      if (!callbackData.user) {
        throw new Error('No user data received from OAuth');
      }
      
      const user = callbackData.user;
      
      // Store auth data (matching your existing login flow)
      const token = callbackData.token || 'oauth-temp-token';
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('firstName', user.firstName);
      localStorage.setItem('lastName', user.lastName);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Store team info if available
      if (user.teamId) {
        localStorage.setItem('userTeamId', user.teamId);
      }
      if (user.teamRole) {
        localStorage.setItem('userTeamRole', user.teamRole);
      }
      
      // Set token in API service
      apiService.setAuthToken(token);
      
      console.log('✅ OAuth login successful:', {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        teamId: user.teamId
      });
      
    } catch (error: any) {
      console.error('❌ OAuth callback error:', error);
      throw error;
    }
  }
  
  /**
   * Check if user is authenticated via OAuth
   */
  isOAuthUser(): boolean {
    const user = localStorage.getItem('user');
    if (!user) return false;
    
    try {
      const userData = JSON.parse(user);
      return !!userData.oauthProvider;
    } catch {
      return false;
    }
  }
  
  /**
   * Get stored OAuth provider
   */
  getOAuthProvider(): OAuthProvider | null {
    return sessionStorage.getItem('oauth_provider') as OAuthProvider | null;
  }
}

export const oauthService = new OAuthService();
export default oauthService;