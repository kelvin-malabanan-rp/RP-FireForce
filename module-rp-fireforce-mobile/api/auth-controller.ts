import { LoginData, AuthenticateResponse } from "@/types";
import { BASE_URL_DEV } from "@/utils/backend-url";
import apiManager from "./api-manager";

export const authenticateUser = async (
    data: LoginData
): Promise<AuthenticateResponse> => {
    try {
        const response = await apiManager.post<AuthenticateResponse>(
            `${BASE_URL_DEV}/api/auth/login`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Authentication error:", error);
        throw error;
    }
};

// OAuth authentication - send authorization code to backend
export const authenticateWithOAuth = async (
    provider: 'google' | 'github',
    code: string
): Promise<AuthenticateResponse> => {
    try {
        const response = await apiManager.post<AuthenticateResponse>(
            `${BASE_URL_DEV}/api/auth/oauth/${provider}`,
            { code }
        );
        return response.data;
    } catch (error) {
        console.error(`${provider} OAuth authentication error:`, error);
        throw error;
    }
};