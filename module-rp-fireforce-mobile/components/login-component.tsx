import { LoginProps, LoginData } from "@/types";
import { FONT_FAMILY } from "@/constants/fonts";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ParticleNetwork } from "@/components/animations/particles-network";
import { BlurView } from "expo-blur";
import {Ionicons} from "@expo/vector-icons";

export const LoginComponent = ({ onLogin }: LoginProps) => {
    const [formData, setFormData] = useState<LoginData>({
        email: "keannu.brillante@rocketpartners.io",
        password: "password123",
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const handleChange = (name: keyof LoginData, value: string): void => {
        setFormData((prev: LoginData) => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError("");
    };

    const handleLogin = async () => {
        if (!formData.email || !formData.password) {
            setError("Please fill in all fields");
            return;
        }

        if (!formData.email.includes("@rocketpartners.io")) {
            setError("Please enter a valid rocketpartners.io email address");
            return;
        }

        // ✅ Show multi-device warning
        Alert.alert(
            "⚠️ Device Login",
            "Signing in on this device will log you out from all other devices. Push notifications will only be sent to this device.\n\nDo you want to continue?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => console.log('[login] User cancelled login')
                },
                {
                    text: "Continue",
                    style: "default",
                    onPress: async () => {
                        await proceedWithLogin();
                    }
                }
            ],
            { cancelable: true }
        );
    };

    const proceedWithLogin = async () => {
        setIsLoading(true);
        setError("");

        const errors = await onLogin(formData.email, formData.password);

        if (errors) {
            setError(errors.authError || "");
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#0f172a', '#581c87', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <ParticleNetwork />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Header with Logo */}
                    <View style={styles.headerContainer}>
                        <Image
                            source={require("@/assets/images/rp-fireforce-white.png")}
                            style={styles.logo}
                        />
                        <Text style={styles.appTitle}>RP FireForce</Text>
                        <Text style={styles.appSubtitle}>Welcome to Rocket Partners</Text>
                    </View>

                    <BlurView
                        intensity={80}
                        tint="dark"
                        style={styles.loginCard}
                    >
                        {/* ✅ Error display */}
                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* ✅ Device Warning Info */}
                        <View style={styles.infoContainer}>
                            <Ionicons name="information-circle" size={16} color="#F59E0B" />
                            <Text style={styles.infoText}>
                                Logging in will activate push notifications on this device only
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        focusedInput === 'email' && styles.inputFocused,
                                        error && styles.inputError
                                    ]}
                                    placeholder="Enter your email"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={formData.email}
                                    onChangeText={(value) => handleChange("email", value)}
                                    onFocus={() => setFocusedInput('email')}
                                    onBlur={() => setFocusedInput(null)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.passwordInput,
                                            focusedInput === 'password' && styles.inputFocused,
                                            error && styles.inputError
                                        ]}
                                        placeholder="Enter your password"
                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                        value={formData.password}
                                        onChangeText={(value) => handleChange("password", value)}
                                        onFocus={() => setFocusedInput('password')}
                                        onBlur={() => setFocusedInput(null)}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={22}
                                            color="rgba(255, 255, 255, 0.6)"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* ✅ Forgot Password */}
                            <View style={styles.options}>
                                <TouchableOpacity style={styles.forgotPassword}>
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>

                            {/* ✅ Login Button */}
                            <TouchableOpacity
                                style={styles.loginButtonWrapper}
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#f97316', '#dc2626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.loginButton,
                                        isLoading && styles.loginButtonDisabled,
                                    ]}
                                >
                                    {isLoading ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                            <Text style={styles.buttonText}>Signing In...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.buttonText}>Sign In</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* ✅ Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Don&#39;t have an account? Ask your organization to setup FireForce Account
                            </Text>
                        </View>
                    </BlurView>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        zIndex: 10,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
    },
    headerContainer: {
        alignItems: "center",
        marginBottom: 40,
        zIndex: 10,
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 20,
        borderRadius: 20,
    },
    appTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 8,
        textAlign: "center",
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    appSubtitle: {
        fontSize: 16,
        color: "#E0E7FF",
        textAlign: "center",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    loginCard: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        padding: 24,
        marginHorizontal: 10,
        overflow: 'hidden',
        zIndex: 10,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 20,
    },
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#FCA5A5',
        fontSize: 14,
        textAlign: "center",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    // ✅ NEW: Info container for device warning
    infoContainer: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        color: '#FCD34D',
        fontSize: 12,
        flex: 1,
        lineHeight: 16,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: "500",
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 15,
        color: '#FFFFFF',
        height: 52,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    inputFocused: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: '#f97316',
        borderWidth: 2,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    inputError: {
        borderColor: '#ef4444',
        borderWidth: 2,
    },
    options: {
        alignItems: "flex-end",
    },
    forgotPassword: {
        padding: 4,
    },
    forgotPasswordText: {
        color: '#f97316',
        fontSize: 13,
        fontWeight: "500",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    loginButtonWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    loginButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    loginButtonDisabled: {
        opacity: 0.6,
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
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    footer: {
        alignItems: "center",
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    footerText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: "center",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
        lineHeight: 18,
    },
    passwordContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        padding: 8,
        zIndex: 10,
    },
});