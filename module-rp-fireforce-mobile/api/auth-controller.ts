// api/auth-controller.ts

import { LoginData, AuthenticateResponse } from "@/types";
import { BASE_URL_DEV } from "@/utils/backend-url";
import apiManager from "./api-manager";
import { storeUserSession } from "@/constants/local-storage";

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

// api/auth-controller.ts
export const loginWithGoogle = async (code: string, redirectUri: string) => {
    const response = await apiManager.post<AuthenticateResponse>('/auth/google/mobile', {
        code,
        redirectUri
    });
    return response.data;
};

// ✅ GitHub OAuth Login
export const loginWithGithub = async (
    code: string,
    redirectUri: string
): Promise<AuthenticateResponse> => {
    try {
        const response = await apiManager.post<AuthenticateResponse>(
            `${BASE_URL_DEV}/auth/mobile/github`,
            {
                code: code,
                redirectUri: redirectUri
            }
        );
        return response.data;
    } catch (error) {
        console.error("GitHub OAuth error:", error);
        throw error;
    }
};