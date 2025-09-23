// components/HeaderMenu.tsx
import React, { useState } from "react";
import {
    TouchableOpacity,
    View,
    Text,
    Modal,
    StyleSheet,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export function HeaderMenu() {
    const [menuVisible, setMenuVisible] = useState(false);

    const handleLogout = () => {
        setMenuVisible(false);
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

    return (
        <>
            <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={{ marginLeft: 15 }}
            >
                <Ionicons name="menu" size={28} color="#000" />
            </TouchableOpacity>

            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menu}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setMenuVisible(false);
                                // Navigate to profile
                            }}
                        >
                            <Ionicons name="person-outline" size={20} color="#000" />
                            <Text style={styles.menuText}>Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setMenuVisible(false);
                                // Navigate to settings
                            }}
                        >
                            <Ionicons name="settings-outline" size={20} color="#000" />
                            <Text style={styles.menuText}>Settings</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                            <Text style={[styles.menuText, { color: "#dc2626" }]}>
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    menu: {
        backgroundColor: "white",
        marginTop: 60,
        marginLeft: 10,
        marginRight: 100,
        borderRadius: 8,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 12,
    },
    menuText: {
        fontSize: 16,
        color: "#000",
    },
    divider: {
        height: 1,
        backgroundColor: "#e5e5e5",
        marginVertical: 5,
    },
});