import {UserSession} from "@/types/response-types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeUserSession = async (param: UserSession) => {
    console.log("Storing user session:", JSON.stringify(param));
    try {
        await AsyncStorage.setItem(
            "user_session",
            JSON.stringify({
                id: param.id,
                email: param.email,
                password: null,
                firstName: param?.firstName ?? "",
                lastName: param.lastName,
                token: param.token,
            })
        );
    } catch (error) {
        console.error("Error storing user session:", error);
    }
};

export const retrieveUserSession = async (): Promise<UserSession | undefined> => {
    try {
        const session = await AsyncStorage.getItem("user_session");
        if (session !== null && session !== undefined) {
            return JSON.parse(session) as UserSession;
        }
        return undefined;
    } catch (error) {
        console.error("Error retrieving user session:", JSON.stringify(error));
        return undefined;
    }
};
