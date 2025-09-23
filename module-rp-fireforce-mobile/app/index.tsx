import { authenticateUser } from "@/api/auth-controller";
import { LoginComponent } from "@/components/login-component";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function Index() {
    // Change to separate parameters to match LoginProps interface
    // In your login action
    const loginAction = async (
        email: string,
        password: string
    ): Promise<{ authError: string } | null> => {
        try {
            const response = await authenticateUser({ email, password });

            // response is AuthenticateResponse type
            if (response && response.httpStatus === "OK") {
                router.replace("/tabs");
                return null;
            } else {
                return {
                    authError: response?.message || "Invalid email or password",
                };
            }
        } catch (error: any) {
            console.error("Authentication error:", error);

            // Handle API error responses
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

  return (
    <View style={styles.container}>
      <LoginComponent onLogin={loginAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
