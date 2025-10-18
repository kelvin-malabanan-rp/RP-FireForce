// components/login.component.tsx

import { LoginProps, LoginData } from "@/types";
import { FONT_FAMILY } from "@/constants/fonts";
import { Image } from "expo-image";
import React, { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { registerPushToken } from '@/api/alert-controller';
import { loginWithGoogle } from '@/api/auth-controller';
import {
    retrieveAlertSettings,
    retrievePushToken,
    retrieveRegistrationStatus,
    storeAlertSettings,
    storePushToken,
    storeRegistrationStatus,
    retrieveUserSession,
    storeUserSession,
} from "@/constants/local-storage";
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

interface LoginComponentProps extends LoginProps {
    onLogin: (email: string, password: string) => Promise<any>;
}

export const LoginComponent = ({ onLogin }: LoginComponentProps) => {
    const [formData, setFormData] = useState<LoginData>({
        email: "kelvin.malabanan@rocketpartners.io",
        password: "password123",
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOAuthLoading, setIsOAuthLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // ✅ Get platform-specific Google Client ID
    const getGoogleClientId = () => {
        const oauth = Constants.expoConfig?.extra?.googleOAuth;

        if (Platform.OS === 'ios') {
            return oauth?.iosClientId;
        } else if (Platform.OS === 'android') {
            return oauth?.androidClientId;
        }
        return oauth?.webClientId;
    };

    // ✅ Google OAuth Configuration
    const googleRedirectUri = AuthSession.makeRedirectUri({
        scheme: 'rpfireforcepager',
        path: 'auth/callback'
    });

    console.log('[oauth] Platform:', Platform.OS);
    console.log('[oauth] Google Client ID:', getGoogleClientId());
    console.log('[oauth] Google redirect URI:', googleRedirectUri);

    const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
        {
            clientId: getGoogleClientId(),
            scopes: ['profile', 'email'],
            redirectUri: googleRedirectUri,
        },
        {
            authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        }
    );

    // ✅ Handle Google OAuth Response
    useEffect(() => {
        if (googleResponse?.type === 'success') {
            const { code } = googleResponse.params;
            handleGoogleOAuthSuccess(code);
        } else if (googleResponse?.type === 'error') {
            console.error('Google OAuth error:', googleResponse.error);
            Alert.alert('Login Failed', 'Could not complete Google sign-in');
            setIsOAuthLoading(false);
        }
    }, [googleResponse]);

    const handleGoogleOAuthSuccess = async (code: string) => {
        try {
            setIsOAuthLoading(true);
            console.log('[oauth] Processing Google login...');

            const response = await loginWithGoogle(code, googleRedirectUri);

            if (response.httpStatus === 'OK' && response.data) {
                // ✅ Store session WITHOUT password field
                await storeUserSession({
                    id: response.data.id,
                    email: response.data.email,
                    firstName: response.data.firstName,
                    lastName: response.data.lastName,
                    role: response.data.role,
                    teamId: response.data.teamId,
                    teamRole: response.data.teamRole,
                    token: response.data.token
                });

                console.log('✅ Google OAuth login successful:', response.data.email);

                // Auto-register for push notifications
                await autoRegisterDevice(response.data.id);

                // Navigate to main app
                router.replace('/(tabs)');
            } else {
                throw new Error(response.message || 'OAuth login failed');
            }
        } catch (error) {
            console.error('Google OAuth error:', error);
            Alert.alert('Login Failed', 'Could not complete Google sign-in. Please try again.');
            setIsOAuthLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsOAuthLoading(true);
        setError("");
        await googlePromptAsync();
    };

    const handleChange = (name: keyof LoginData, value: string): void => {
        setFormData((prev: LoginData) => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError("");
    };

    const autoRegisterDevice = async (userId: string) => {
        try {
            console.log('🔔 Auto-registering device for user:', userId);

            await Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                    shouldShowBanner: false,
                    shouldShowList: false,
                }),
            });

            const { status } = await Notifications.requestPermissionsAsync();
            console.log('Permission status:', status);

            if (status !== 'granted') {
                console.log('⚠️ Permissions not granted, skipping registration');
                return;
            }

            const savedRegStatus = await retrieveRegistrationStatus();
            const savedToken = await retrievePushToken();

            if (savedRegStatus === 'registered' && savedToken) {
                console.log('✅ Device already registered, skipping API call');
                return;
            }

            console.log('📝 Registering device...');

            const tokenData = await Notifications.getExpoPushTokenAsync();
            await storePushToken(tokenData.data);

            let platformToken = null;
            if (Platform.OS === 'android') {
                platformToken = await Notifications.getDevicePushTokenAsync();
            }

            let settings = await retrieveAlertSettings();
            if (!settings) {
                settings = {
                    enableAlerts: true,
                    criticalOnly: false,
                    soundEnabled: true,
                    vibrationEnabled: true,
                    reminderConfig: {
                        enabled: true,
                        maxReminders: 3,
                        intervalSeconds: 10
                    }
                };
                await storeAlertSettings(settings);
            }

            const response = await registerPushToken({
                userId: userId,
                token: tokenData.data,
                deviceType: Platform.OS,
                fcmToken: Platform.OS === 'android' && platformToken ? (platformToken as any).data : undefined,
                settings
            });

            if (response.httpStatus === 'OK' || response.data?.success) {
                await storeRegistrationStatus('registered');
                console.log('✅ Device registered successfully');
            } else {
                await storeRegistrationStatus('failed');
                console.warn('⚠️ Device registration failed:', response);
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('critical-alerts-v4', {
                    name: 'Critical Incidents',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#DC2626',
                    sound: 'alarm_sound.mp3',
                });
            }
        } catch (error) {
            console.error('❌ Auto-registration error:', error);
            await storeRegistrationStatus('failed');
        }
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

        await proceedWithLogin();
    };

    const proceedWithLogin = async () => {
        setIsLoading(true);
        setError("");

        const errors = await onLogin(formData.email, formData.password);

        if (errors) {
            setError(errors.authError || "");
            setIsLoading(false);
        } else {
            try {
                const session = await retrieveUserSession();
                if (session?.id) {
                    autoRegisterDevice(session.id)
                        .then(() => console.log('✅ Device registration completed'))
                        .catch(err => console.warn('⚠️ Device registration failed:', err));
                }
            } catch (error) {
                console.error('Error retrieving session for auto-registration:', error);
            }
        }
    };

    const isAnyLoading = isLoading || isOAuthLoading;

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
                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

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
                                    editable={!isAnyLoading}
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
                                        editable={!isAnyLoading}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowPassword(!showPassword)}
                                        disabled={isAnyLoading}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={22}
                                            color="rgba(255, 255, 255, 0.6)"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Email/Password Login Button */}
                            <TouchableOpacity
                                style={styles.loginButtonWrapper}
                                onPress={handleLogin}
                                disabled={isAnyLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#f97316', '#dc2626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.loginButton,
                                        isAnyLoading && styles.loginButtonDisabled,
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

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Don&apos;t have an account? Ask your organization to setup FireForce Account
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
    // ✅ OAuth Styles
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    dividerText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    oauthButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    oauthButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    oauthButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
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