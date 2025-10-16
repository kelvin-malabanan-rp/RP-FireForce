import { useEffect } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Alert } from "react-native";
import { storeUserSession } from "@/constants/local-storage";

export default function AuthCallback() {
    useEffect(() => {
        const handleDeepLink = async (url: string) => {
            try {
                const parsed = Linking.parse(url);
                const params = parsed.queryParams || {};

                console.log("🔗 Received deep link:", params);

                if (params.error) {
                    Alert.alert("Login Failed", params.error as string);
                    return;
                }

                if (!params.token || !params.email) {
                    Alert.alert("Invalid login response", "Missing required user data");
                    return;
                }

                const userData = {
                    token: params.token as string,
                    email: params.email as string,
                    id: params.userId as string,
                    displayName: params.displayName as string,
                    avatarUrl: params.avatarUrl as string,
                };

                await storeUserSession(userData);
                console.log("✅ Stored OAuth user session:", userData);

                // Navigate to the Tabs (Dashboard)
                router.replace("/tabs");
            } catch (err) {
                console.error("❌ Deep link handling error:", err);
                Alert.alert("Error", "Failed to complete login");
            }
        };

        // Handle case where app is launched by a link
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink(url);
        });

        // Handle case where app is already open
        const subscription = Linking.addEventListener("url", ({ url }) =>
            handleDeepLink(url)
        );

        return () => subscription.remove();
    }, []);

    return null; // You could render a spinner here if you like
}
