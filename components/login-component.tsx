import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface LoginData {
  email: string;
  password: string;
}

export const LoginComponent = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleChange = (name: keyof LoginData, value: string): void => {
    setFormData((prev: LoginData) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (): Promise<void> => {
    // setIsLoading(true);
    // setError("");

    // // Basic validation
    // if (!formData.email || !formData.password) {
    //   setError("Please fill in all fields");
    //   setIsLoading(false);
    //   return;
    // }

    // if (!formData.email.includes("@rocketpartners.io")) {
    //   setError("Please enter a valid rocketpartners.io email address");
    //   setIsLoading(false);
    //   return;
    // }

    // try {
    //   // Simulate API call
    //   await new Promise<void>((resolve) => setTimeout(resolve, 1500));

    //   // Replace this with your actual login logic
    //   console.log("Login attempt:", formData);

    //   // For demo purposes
    //   if (
    //     formData.email === "demo@rocketpartners.io" &&
    //     formData.password === "password"
    //   ) {
    //     // Alert.alert("Success", "Login successful!", [
    //     //   {
    //     //     text: "OK",
    //     //     onPress: () => {
    //     //       // Navigate to explore tab after successful login
    //     //       router.push("/(tabs)/explore");
    //     //     },
    //     //   },
    //     // ]);
    //     router.push("/(tabs)/home");
    //   } else {
    //     setError("Invalid email or password");
    //   }
    // } catch (err: unknown) {
    //   setError("Login failed. Please try again.");
    // } finally {
    //   setIsLoading(false);
    // }
    router.push("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with Logo */}
        <View style={styles.headerContainer}>
          <Image
            source={require("@/assets/images/partial-react-logo.png")}
            style={styles.logo}
          />
          <Text style={styles.appTitle}>Welcome to Rocket Partners App</Text>
          <Text style={styles.appSubtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.loginCard}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(value) => handleChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(value) => handleChange("password", value)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.options}>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.buttonText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{" "}
              <Text style={styles.signupLink}>Sign up</Text>
            </Text>
          </View>

          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo credentials:</Text>
            <Text style={styles.demoText}>Email: demo@example.com</Text>
            <Text style={styles.demoText}>Password: password</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#667EEA",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  appSubtitle: {
    fontSize: 18,
    color: "#E0E7FF",
    textAlign: "center",
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  options: {
    alignItems: "flex-end",
    marginVertical: 8,
  },
  forgotPassword: {
    padding: 4,
  },
  forgotPasswordText: {
    color: "#667EEA",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#667EEA",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#667EEA",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signupLink: {
    color: "#667EEA",
    fontWeight: "500",
  },
  demoContainer: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0369A1",
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    color: "#0369A1",
    marginVertical: 2,
  },
});

