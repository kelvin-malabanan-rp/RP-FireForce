import { authenticateUser } from "@/api/auth-controller";
import { LoginComponent } from "@/components/login-component";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function Index() {
  // Change to separate parameters to match LoginProps interface
  const loginAction = async (
    email: string,
    password: string
  ): Promise<{ authError: string } | null> => {
    try {
      const response = await authenticateUser({ email, password });

      if (response.data && response.data.httpStatus === "OK") {
        // Use replace so users can't go back to login
        router.replace("/(tabs)"); // ← Changed from push to replace
        return null;
      } else {
        return {
          authError: response.data?.message || "Invalid email or password",
        };
      }
    } catch (error) {
      console.error("Authentication error:", error);
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
