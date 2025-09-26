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
import { router } from "expo-router";
import AlertManager from "./alert-manager";

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

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Slide in
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
            // Slide out
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
    }, [fadeAnim, isOpen, slideAnim]);

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
                    onPress: () => router.replace("/"),
                },
            ]
        );
    };

    const handleNotifications = () => {
        setShowAlertManager(true);
    };

    if (!isVisible) {
        return null;
    }

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
                <View style={styles.menuHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Ionicons name="person-circle" size={50} color="#667EEA" />
                        </View>
                        <Text style={styles.userName}>Kelvin Malabanan</Text>
                        <Text style={styles.userEmail}>kelvin.malabanan@rocketpartners.io</Text>
                    </View>
                </View>

                <View style={styles.menuItems}>
                    <TouchableOpacity style={styles.menuItem} onPress={onClose}>
                        <Ionicons name="home-outline" size={24} color="#374151" />
                        <Text style={styles.menuText}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={onClose}>
                        <Ionicons name="person-outline" size={24} color="#374151" />
                        <Text style={styles.menuText}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={onClose}>
                        <Ionicons name="settings-outline" size={24} color="#374151" />
                        <Text style={styles.menuText}>Settings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setShowAlertManager(true); // Open AlertManager modal
                        }}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#374151" />
                        <Text style={styles.menuText}>Notifications</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#dc2626" />
                        <Text style={[styles.menuText, { color: "#dc2626" }]}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>RP Fire Force v1.0.0</Text>
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
                    <View style={styles.alertModalContainer}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowAlertManager(false)}
                        >
                            <Ionicons name="close" size={24} color="#6B7280" />
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
        backgroundColor: "rgba(0,0,0,0.5)",
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
        backgroundColor: "#fff",
        zIndex: 999,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuHeader: {
        backgroundColor: "#f3f4f6",
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    userInfo: {
        alignItems: "center",
    },
    avatar: {
        marginBottom: 10,
    },
    userName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: "#6b7280",
    },
    menuItems: {
        flex: 1,
        paddingTop: 20,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
        gap: 15,
    },
    menuText: {
        fontSize: 16,
        color: "#374151",
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#e5e7eb",
        marginVertical: 10,
        marginHorizontal: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    footerText: {
        fontSize: 12,
        color: "#9ca3af",
        textAlign: "center",
    },
    // AlertManager modal styles
    alertModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    alertModalContainer: {
        backgroundColor: "transparent",
        borderRadius: 16,
        margin: 20,
        position: "relative",
        width: "90%",
        maxHeight: "80%",
    },
    closeButton: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 1000,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});