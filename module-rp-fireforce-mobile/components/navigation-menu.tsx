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
const MENU_WIDTH = width * 0.75;

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

    const getInitials = () => {
        if (userSession?.firstName && userSession?.lastName) {
            return `${userSession.firstName[0]}${userSession.lastName[0]}`.toUpperCase();
        }
        return userSession?.email?.[0].toUpperCase() || 'U';
    };

    const getFullName = () => {
        if (userSession?.firstName && userSession?.lastName) {
            return `${userSession.firstName} ${userSession.lastName}`;
        }
        return userSession?.email?.split('@')[0] || 'User';
    };

    const menuItems = [
        {
            icon: 'home',
            label: 'Home',
            color: '#3B82F6',
            onPress: () => {
                onClose();
                router.push('/tabs');
            }
        },
        {
            icon: 'person',
            label: 'Profile',
            color: '#8B5CF6',
            onPress: () => {
                onClose();
                router.push('/profile');
            }
        },
        {
            icon: 'notifications',
            label: 'Notifications',
            color: '#F59E0B',
            onPress: () => {
                setShowAlertManager(true);
            }
        },
        {
            icon: 'help-circle',
            label: 'Help & Support',
            color: '#10B981',
            onPress: () => {
                Alert.alert('Support', 'Contact: support@rocketpartners.io');
            }
        },
    ];

    if (!isVisible) return null;

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
                {/* Profile Header */}
                <LinearGradient
                    colors={['#F97316', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileHeader}
                >
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials()}</Text>
                        </View>
                    </View>
                    <Text style={styles.profileName}>{getFullName()}</Text>
                    <Text style={styles.profileEmail}>{userSession?.email || 'No email'}</Text>
                </LinearGradient>

                {/* Navigation Menu */}
                <View style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuItem,
                                index === menuItems.length - 1 && { borderBottomWidth: 0 }
                            ]}
                            onPress={item.onPress}
                        >
                            <Ionicons name={item.icon as any} size={24} color={item.color} />
                            <Text style={styles.menuItemText}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#475569" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* App Info */}
                <View style={styles.infoSection}>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="information-circle" size={16} color="#3B82F6" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Version</Text>
                                <Text style={styles.infoValue}>v1.0.0</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="code-slash" size={16} color="#8B5CF6" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Build</Text>
                                <Text style={styles.infoValue}>Production</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Spacer */}
                <View style={{ flex: 1 }} />

                {/* Logout Button */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity
                        style={styles.logoutButtonWrapper}
                        onPress={handleLogout}
                    >
                        <View style={styles.logoutButton}>
                            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
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
                <View style={styles.alertModalOverlay}>
                    <View style={styles.alertModalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowAlertManager(false)}
                        >
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <AlertManager />
                    </View>
                </View>
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
        backgroundColor: '#0F172A',
        zIndex: 999,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 10,
    },
    profileHeader: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 12,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    profileEmail: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    roleBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    menuSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#CBD5E1',
        flex: 1,
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    infoSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#334155',
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    logoutSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    logoutButtonWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#EF4444',
        gap: 8,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    footerText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    footerSubtext: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    alertModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    alertModalContent: {
        width: '100%',
        maxWidth: 400,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        zIndex: 1000,
        backgroundColor: '#EF4444',
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});