import { LoginData, AuthenticateResponse } from "@/types";
import {BASE_URL_DEV} from "@/utils/backend-url";
import apiManager from "./api-manager";

export const authenticateUser = async (
    data: LoginData
): Promise<AuthenticateResponse> => {
    try {
        const response = await apiManager.post<AuthenticateResponse>(
            `${BASE_URL_DEV}/api/auth/login`,
            data
        );
        return response.data; // Axios wraps in response, so extract .data
    } catch (error) {
        console.error("Authentication error:", error);
        throw error;
    }
};