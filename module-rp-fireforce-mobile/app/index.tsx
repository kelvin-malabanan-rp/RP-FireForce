import { authenticateUser, authenticateWithOAuth } from "@/api/auth-controller";
import { LoginComponent } from "@/components/login-component";
import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { storeUserSession } from "@/constants/local-storage";
import { useOAuth } from "@/hooks/useOAuth";

export default function Index() {
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Traditional login
    const loginAction = async (
        email: string,
        password: string
    ): Promise<{ authError: string } | null> => {
        try {
            const response = await authenticateUser({ email, password });

            if (response && response.httpStatus === "OK") {
                console.log("User authenticated successfully:", response.data);
                await storeUserSession(response.data);
                console.log("Successfully stored user session:", response.data);
                router.replace("/tabs");
                return null;
            } else {
                return {
                    authError: response?.message || "Invalid email or password",
                };
            }
        } catch (error: any) {
            console.error("Authentication error:", error);

            if (error.response?.status === 401) {
                return {
                    authError: "Invalid email or password",
                };
            }

            if (error.response?.data?.message) {
                return {
                    authError: error.response.data.message,
                };
            }

            return {
                authError: "Network error. Please try again.",
            };
        }
    };

    // Handle OAuth code exchange
    const handleOAuthSuccess = async (provider: 'google' | 'github', code: string) => {
        try {
            setIsAuthenticating(true);
            console.log(`Processing ${provider} OAuth code...`);

            const response = await authenticateWithOAuth(provider, code);

            if (response && response.httpStatus === "OK") {
                console.log(`${provider} authentication successful:`, response.data);
                await storeUserSession(response.data);
                router.replace("/tabs");
            } else {
                Alert.alert(
                    "Authentication Failed",
                    response?.message || `Failed to authenticate with ${provider}`
                );
            }
        } catch (error: any) {
            console.error(`${provider} authentication error:`, error);
            Alert.alert(
                "Authentication Error",
                error.response?.data?.message ||
                `An error occurred during ${provider} authentication`
            );
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Google OAuth
    const googleOAuth = useOAuth({
        provider: 'google',
        onSuccess: (code) => handleOAuthSuccess('google', code),
        onError: (error) => {
            console.error('Google OAuth error:', error);
            Alert.alert('Google Sign-In Failed', error);
        }
    });

    // GitHub OAuth
    const githubOAuth = useOAuth({
        provider: 'github',
        onSuccess: (code) => handleOAuthSuccess('github', code),
        onError: (error) => {
            console.error('GitHub OAuth error:', error);
            Alert.alert('GitHub Sign-In Failed', error);
        }
    });

    return (
        <View style={styles.container}>
            <LoginComponent
                onLogin={loginAction}
                onGoogleLogin={googleOAuth.initiateOAuth}
                onGithubLogin={githubOAuth.initiateOAuth}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});