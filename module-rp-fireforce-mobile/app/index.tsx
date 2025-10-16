import { authenticateUser } from "@/api/auth-controller";
import { LoginComponent } from "@/components/login-component";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { storeUserSession } from "@/constants/local-storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Removed: import { useOAuth } from "@/hooks/useOAuth";
// Removed: import { authenticateWithOAuth } from "@/api/auth-controller";

export default function Index() {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Add loading state for auth check

    // Check for existing token on mount
    useEffect(() => {
        checkExistingAuth();
    }, []);

    const checkExistingAuth = async () => {
        try {
            setIsCheckingAuth(true);
            const token = await AsyncStorage.getItem('authToken');

            if (token) {
                console.log('Found existing token, validating...');

                // Validate the token by making a test API call
                const isValid = await validateToken(token);

                if (isValid) {
                    console.log('Token is valid, redirecting to tabs');
                    router.replace("/tabs");
                } else {
                    console.log('Token is invalid, clearing storage');
                    // Clear invalid token
                    await clearAuthStorage();
                }
            } else {
                console.log('No token found, showing login screen');
            }
        } catch (error) {
            console.error('Error checking existing auth:', error);
            // Clear storage on error to be safe
            await clearAuthStorage();
        } finally {
            setIsCheckingAuth(false);
        }
    };

    const validateToken = async (token: string): Promise<boolean> => {
        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://incident-webhook-api.rapidresponse.workers.dev';

            // Make a test API call to validate the token
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, { // or any protected endpoint
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    };

    const clearAuthStorage = async () => {
        try {
            await AsyncStorage.multiRemove([
                'authToken',
                'userId',
                'userEmail',
                'userDisplayName',
                'userAvatarUrl',
            ]);
        } catch (error) {
            console.error('Error clearing auth storage:', error);
        }
    };

    // Traditional login
    const loginAction = async (
        email: string,
        password: string
    ): Promise<{ authError: string } | null> => {
        setIsAuthenticating(true); // Set loading state here
        try {
            const response = await authenticateUser({ email, password });

            if (response && response.httpStatus === "OK") {
                console.log("User authenticated successfully:", response.data);
                await storeUserSession(response.data);

                // Store additional auth data for mobile
                await AsyncStorage.multiSet([
                    ['authToken', response.data.token],
                    ['userId', response.data.id],
                    ['userEmail', response.data.email],
                    ['userDisplayName', `${response.data.firstName} ${response.data.lastName}`.trim()],
                    ['userAvatarUrl', ''],
                ]);

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
        } finally {
            setIsAuthenticating(false); // Clear loading state in finally block
        }
    };

    // Removed: handleOAuthSuccess, handleOAuthError, googleOAuth, githubOAuth

    // Show loading screen while checking authentication
    if (isCheckingAuth) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Checking authentication...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LoginComponent
                onLogin={loginAction}
                // Removed: onGoogleLogin, onGithubLogin, isLoading={isAuthenticating}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});
