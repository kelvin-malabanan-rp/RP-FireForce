// src/services/auth-service.ts
import { apiService, ApiResponse } from './apiService';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://incident-webhook-api.rapidresponse.workers.dev';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '283926364231-8si8eo6op627qgd4gh3ud1vqtot0d17m.apps.googleusercontent.com';
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '0v23liEd7rA6wT0SEIVZ';

// ==================== TYPE DEFINITIONS ====================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  avatarUrl?: string;
  role?: string;
  teamId?: string;
  teamRole?: string;
  team_id?: string;     // ✅ Added snake_case version
  team_role?: string;   // ✅ Added snake_case version
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  teamId?: string;
  teamRole?: string;
  token: string;
}

// ✅ UPDATED: Added team fields
export interface OAuthCallbackData {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  firstName?: string;    // ✅ Added
  lastName?: string;     // ✅ Added
  teamId?: string;       // ✅ Added
  teamRole?: string;     // ✅ Added
}

// ==================== AUTH SERVICE ====================

class AuthService {
  /**
   * Regular email/password login
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    try {
      console.log('🔐 Attempting login with email:', credentials.email);

      const response = await apiService.post<any>('/api/auth/login', credentials);
      const apiData = response.data;

      if (apiData && apiData.httpStatus === 'OK' && apiData.data) {
        const userData = apiData.data;

        // Store authentication data
        this.storeAuthData(userData.token, {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          teamId: userData.teamId,
          teamRole: userData.teamRole,
        });

        console.log('✅ Login successful');

        return {
          data: userData,
          success: true,
          status: 200,
          message: apiData.message,
        };
      }

      throw new Error(apiData?.message || 'Login failed');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Invalid email or password',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  }

  /**
   * Initiate Google OAuth flow
   */
  initiateGoogleLogin(): void {
    const redirectUri = `${BACKEND_URL}/auth/google/callback`;
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'select_account');

    console.log('🔵 Initiating Google OAuth...');
    console.log('📍 Redirect URI:', redirectUri);

    // Redirect to Google OAuth
    window.location.href = authUrl.toString();
  }

  /**
   * Initiate GitHub OAuth flow
   */
  initiateGithubLogin(): void {
    const redirectUri = `${BACKEND_URL}/auth/github/callback`;
    const authUrl = new URL('https://github.com/login/oauth/authorize');

    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'read:user user:email');

    console.log('⚫ Initiating GitHub OAuth...');
    console.log('📍 Redirect URI:', redirectUri);

    // Redirect to GitHub OAuth
    window.location.href = authUrl.toString();
  }

  /**
   * ✅ UPDATED: Process OAuth callback data from URL fragment
   * Called by App.jsx when on /auth/success page
   */
  processOAuthCallback(): OAuthCallbackData | null {
    try {
      console.log('🔄 Processing OAuth callback...');
      console.log('📍 Full URL:', window.location.href);
      console.log('📍 Pathname:', window.location.pathname);
      console.log('📍 Hash:', window.location.hash);
      console.log('📍 Search:', window.location.search);

      // Get data from URL fragment (after #)
      const fragment = window.location.hash.substring(1);

      console.log('📍 Fragment extracted:', fragment);

      if (!fragment) {
        console.error('❌ No fragment data found in URL');
        console.log('💡 This might mean the backend redirected incorrectly');
        console.log('💡 Expected format: /auth/success#token=...&userId=...');
        return null;
      }

      const params = new URLSearchParams(fragment);

      const token = params.get('token');
      const userId = params.get('userId');
      const email = params.get('email');
      const displayName = params.get('displayName');
      const avatarUrl = params.get('avatarUrl');
      const firstName = params.get('firstName');      // ✅ Added
      const lastName = params.get('lastName');        // ✅ Added
      const teamId = params.get('teamId');            // ✅ Added
      const teamRole = params.get('teamRole');        // ✅ Added

      console.log('📦 Extracted OAuth data:', {
        hasToken: !!token,
        tokenPreview: token?.substring(0, 20) + '...',
        userId,
        email,
        displayName,
        firstName,          // ✅ Added
        lastName,           // ✅ Added
        teamId,             // ✅ Added
        teamRole,           // ✅ Added
        hasAvatarUrl: !!avatarUrl,
      });

      if (!token || !userId || !email) {
        console.error('❌ Missing required OAuth data');
        console.log('🔍 Token present:', !!token);
        console.log('🔍 UserId present:', !!userId);
        console.log('🔍 Email present:', !!email);
        return null;
      }

      return {
        token,
        userId,
        email,
        displayName: displayName || email,
        avatarUrl: avatarUrl || '',
        firstName: firstName || undefined,      // ✅ Added
        lastName: lastName || undefined,        // ✅ Added
        teamId: teamId || undefined,            // ✅ Added
        teamRole: teamRole || undefined,        // ✅ Added
      };
    } catch (error) {
      console.error('❌ Error processing OAuth callback:', error);
      return null;
    }
  }

  /**
   * ✅ UPDATED: Store OAuth authentication data
   */
  storeOAuthData(data: OAuthCallbackData): void {
    console.log('💾 Storing OAuth authentication data...');
    console.log('📦 OAuth data received:', data);

    // Store token
    apiService.setAuthToken(data.token);
    localStorage.setItem('authToken', data.token);

    // Store user data with team information
    const user: User = {
      id: data.userId,
      email: data.email,
      displayName: data.displayName,
      name: data.displayName,
      avatarUrl: data.avatarUrl,
      avatar: data.avatarUrl,
      firstName: data.firstName,              // ✅ Added
      lastName: data.lastName,                // ✅ Added
      teamId: data.teamId,                    // ✅ Added
      team_id: data.teamId,                   // ✅ Added (snake_case)
      teamRole: data.teamRole,                // ✅ Added
      team_role: data.teamRole,               // ✅ Added (snake_case)
    };

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('isAuthenticated', 'true');

    // ✅ Store additional fields separately for easy access
    if (data.firstName) localStorage.setItem('firstName', data.firstName);
    if (data.lastName) localStorage.setItem('lastName', data.lastName);
    if (data.teamId) localStorage.setItem('teamId', data.teamId);
    if (data.teamRole) localStorage.setItem('userRole', data.teamRole);

    console.log('✅ OAuth data stored successfully');
    console.log('👥 Team ID:', data.teamId);
    console.log('🎭 Team Role:', data.teamRole);
  }

  /**
   * Store regular login authentication data
   */
  private storeAuthData(token: string, user: Partial<User>): void {
    apiService.setAuthToken(token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id || '');
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('isAuthenticated', 'true');

    // Store additional fields if available
    if (user.firstName) localStorage.setItem('firstName', user.firstName);
    if (user.lastName) localStorage.setItem('lastName', user.lastName);
    if (user.teamId) localStorage.setItem('teamId', user.teamId);
    if (user.teamRole) localStorage.setItem('userRole', user.teamRole);
  }

  /**
   * Logout user
   */
  logout(): void {
    console.log('👋 Logging out...');

    apiService.removeAuthToken();

    // Clear all auth-related data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('teamId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentPage');
    localStorage.removeItem('selectedIncidentId');

    console.log('✅ Logout complete');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const isAuth = localStorage.getItem('isAuthenticated');
    const token = localStorage.getItem('authToken');
    return isAuth === 'true' && !!token;
  }

  /**
   * Get current user data
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Check for OAuth error in URL
   */
  checkOAuthError(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('error');
  }
}

// ==================== EXPORT ====================

export const authService = new AuthService();
export default authService;