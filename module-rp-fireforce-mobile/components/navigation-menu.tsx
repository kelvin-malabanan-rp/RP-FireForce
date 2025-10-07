// components/SlideMenu.tsx
import React, { useRef, useEffect, useState } from "react";
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Alert,
    TouchableWithoutFeedback,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import AlertManager from "./alert-manager";
import { clearUserSession, retrieveUserSession } from "@/constants/local-storage";
import { UserSession } from "@/types";
import { FONT_FAMILY } from "@/constants/fonts";

const { width } = Dimensions.get("window");
const MENU_WIDTH = width * 0.7;

interface SlideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SlideMenu({ isOpen, onClose }: SlideMenuProps) {
    const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isVisible, setIsVisible] = useState(false);
    const [showAlertManager, setShowAlertManager] = useState(false);
    const [userSession, setUserSession] = useState<UserSession | null>(null);

    useEffect(() => {
        const loadUserSession = async () => {
            try {
                const session = await retrieveUserSession();
                setUserSession(session || null);
            } catch (error) {
                console.error('Error loading user session:', error);
                setUserSession(null);
            }
        };

        loadUserSession();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -MENU_WIDTH,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsVisible(false);
            });
        }
    }, [isOpen]);

    const handleLogout = () => {
        onClose();
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await clearUserSession();
                            router.replace("/");
                        } catch (error) {
                            console.error("Logout failed:", error);
                            Alert.alert("Error", "Failed to logout. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <>
            <Animated.View
                style={[
                    styles.overlay,
                    {
                        opacity: fadeAnim,
                    },
                ]}
                pointerEvents={isOpen ? "auto" : "none"}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.overlayTouchable} />
                </TouchableWithoutFeedback>
            </Animated.View>

            <Animated.View
                style={[
                    styles.menuContainer,
                    {
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                {/* Menu Header with Gradient */}
                <LinearGradient
                    colors={['#F97316', '#DC2626']} // orange to red gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.menuHeader}
                >
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Ionicons name="person-circle" size={60} color="#FFFFFF" />
                        </View>
                        <Text style={styles.userName}>
                            {userSession ? `${userSession.firstName} ${userSession.lastName}` : 'Guest User'}
                        </Text>
                        <Text style={styles.userEmail}>
                            {userSession?.email || 'No email available'}
                        </Text>
                    </View>
                </LinearGradient>

                <View style={styles.menuItems}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            onClose();
                            router.push('/tabs');
                        }}
                    >
                        <Ionicons name="home-outline" size={24} color="#CBD5E1" />
                        <Text style={styles.menuText}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={onClose}>
                        <Ionicons name="person-outline" size={24} color="#CBD5E1" />
                        <Text style={styles.menuText}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => {
                        setShowAlertManager(true);
                    }}>
                        <Ionicons name="settings-outline" size={24} color="#CBD5E1" />
                        <Text style={styles.menuText}>Settings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onClose}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#CBD5E1" />
                        <Text style={styles.menuText}>Notifications</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                        <Text style={[styles.menuText, { color: "#EF4444" }]}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>RP Fire Force v1.0.0</Text>
                    <Text style={styles.footerSubtext}>Powered by Rocket Partners</Text>
                </View>
            </Animated.View>

            {/* AlertManager Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showAlertManager}
                onRequestClose={() => setShowAlertManager(false)}
            >
                <TouchableOpacity
                    style={styles.alertModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAlertManager(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <AlertManager />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 998,
    },
    overlayTouchable: {
        flex: 1,
    },
    menuContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: MENU_WIDTH,
        backgroundColor: '#1E293B', // slate-800
        zIndex: 999,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 10,
    },
    menuHeader: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    userInfo: {
        alignItems: "center",
    },
    avatar: {
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 40,
        padding: 4,
    },
    userName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 4,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    userEmail: {
        fontSize: 13,
        color: "rgba(255, 255, 255, 0.8)",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
        marginBottom: 8,
    },
    roleBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    roleText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '700',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    menuItems: {
        flex: 1,
        paddingTop: 20,
        backgroundColor: '#1E293B',
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 15,
    },
    menuText: {
        fontSize: 15,
        color: "#CBD5E1",
        fontWeight: "500",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    divider: {
        height: 1,
        backgroundColor: "#334155",
        marginVertical: 10,
        marginHorizontal: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#334155",
        backgroundColor: '#1E293B',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: "#94A3B8",
        textAlign: "center",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 10,
        color: "#64748B",
        textAlign: "center",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    alertModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        padding: 10,
    },
    closeButton: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 1000,
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
});