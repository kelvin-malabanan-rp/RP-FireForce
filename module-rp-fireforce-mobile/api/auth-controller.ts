import { LoginData, APIResponse, AuthenticateResponse } from "@/types";
import { BASE_API } from "@/utils/backend-url";
import apiManager from "./api-manager";

export const authenticateUser = async (
  data: LoginData
): Promise<APIResponse<AuthenticateResponse>> => {
  try {
    const response = await apiManager.post<APIResponse<AuthenticateResponse>>(
      `${BASE_API}/v1/api/authentication`,
      data
    );
    return response.data; // Axios wraps the response, so we need .data
  } catch (error) {
    // Handle error appropriately - throw it or return an error response
    console.error("Authentication error:", error);
    throw error; // Re-throw to let the caller handle it
  }
};
