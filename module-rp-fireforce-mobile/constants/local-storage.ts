import {UserSession} from "@/types/response-types";
import {AlertSettings} from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const STORAGE_KEYS = {
    USER_SESSION: "user_session",
    ALERT_SETTINGS: "alert_settings",
    REGISTRATION_STATUS: "registration_status",
    PUSH_TOKEN: "push_token",
} as const;

// User Session Functions
export const storeUserSession = async (param: UserSession) => {
    console.log("Storing user session:", JSON.stringify(param));
    try {
        await AsyncStorage.setItem(
            STORAGE_KEYS.USER_SESSION,
            JSON.stringify({
                id: param.id,
                email: param.email,
                password: null, // Never store password
                firstName: param?.firstName ?? "",
                lastName: param?.lastName ?? "",
                role: param?.role ?? "",
                teamId: param?.teamId ?? null,
                teamRole: param?.teamRole ?? null,
                token: param?.token ?? "",
            })
        );
    } catch (error) {
        console.error("Error storing user session:", error);
    }
};

export const retrieveUserSession = async (): Promise<UserSession | undefined> => {
    try {
        const session = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
        if (session !== null && session !== undefined) {
            return JSON.parse(session) as UserSession;
        }
        return undefined;
    } catch (error) {
        console.error("Error retrieving user session:", JSON.stringify(error));
        return undefined;
    }
};

export const clearUserSession = async () => {
    console.log("Clearing user session");
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
        console.log("User session cleared successfully");
        await clearAllAlertData();
    } catch (error) {
        console.error("Error clearing user session:", error);
        throw error;
    }
};

// Alert Settings Functions
export const storeAlertSettings = async (settings: AlertSettings) => {
    console.log("Storing alert settings:", JSON.stringify(settings));
    try {
        await AsyncStorage.setItem(
            STORAGE_KEYS.ALERT_SETTINGS,
            JSON.stringify(settings)
        );
    } catch (error) {
        console.error("Error storing alert settings:", error);
        throw error;
    }
};

export const retrieveAlertSettings = async (): Promise<AlertSettings | undefined> => {
    try {
        const settings = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_SETTINGS);
        if (settings !== null && settings !== undefined) {
            return JSON.parse(settings) as AlertSettings;
        }
        return undefined;
    } catch (error) {
        console.error("Error retrieving alert settings:", error);
        return undefined;
    }
};

export const clearAlertSettings = async () => {
    console.log("Clearing alert settings");
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.ALERT_SETTINGS);
        console.log("Alert settings cleared successfully");
    } catch (error) {
        console.error("Error clearing alert settings:", error);
        throw error;
    }
};

// Registration Status Functions
export const storeRegistrationStatus = async (status: string) => {
    console.log("Storing registration status:", status);
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.REGISTRATION_STATUS, status);
    } catch (error) {
        console.error("Error storing registration status:", error);
        throw error;
    }
};

export const retrieveRegistrationStatus = async (): Promise<string | undefined> => {
    try {
        const status = await AsyncStorage.getItem(STORAGE_KEYS.REGISTRATION_STATUS);
        return status ?? undefined;
    } catch (error) {
        console.error("Error retrieving registration status:", error);
        return undefined;
    }
};

export const clearRegistrationStatus = async () => {
    console.log("Clearing registration status");
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.REGISTRATION_STATUS);
        console.log("Registration status cleared successfully");
    } catch (error) {
        console.error("Error clearing registration status:", error);
        throw error;
    }
};

// Push Token Functions
export const storePushToken = async (token: string) => {
    console.log("Storing push token:", token.substring(0, 30) + "...");
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
    } catch (error) {
        console.error("Error storing push token:", error);
        throw error;
    }
};

export const retrievePushToken = async (): Promise<string | undefined> => {
    try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
        return token ?? undefined;
    } catch (error) {
        console.error("Error retrieving push token:", error);
        return undefined;
    }
};

export const clearPushToken = async () => {
    console.log("Clearing push token");
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
        console.log("Push token cleared successfully");
    } catch (error) {
        console.error("Error clearing push token:", error);
        throw error;
    }
};

// Clear all alert-related data
export const clearAllAlertData = async () => {
    console.log("Clearing all alert data");
    try {
        await Promise.all([
            clearAlertSettings(),
            clearRegistrationStatus(),
            clearPushToken(),
        ]);
        console.log("All alert data cleared successfully");
    } catch (error) {
        console.error("Error clearing all alert data:", error);
        throw error;
    }
};