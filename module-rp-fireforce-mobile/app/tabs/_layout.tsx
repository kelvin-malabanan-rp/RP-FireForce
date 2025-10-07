// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { useState } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';

import { SlideMenu } from "@/components/navigation-menu";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: '#F97316', // orange-500
                    tabBarInactiveTintColor: '#64748B', // slate-500
                    headerShown: true,
                    headerTitle: "",
                    tabBarButton: HapticTab,
                    headerTransparent: true,
                    headerBackground: () => (
                        <BlurView
                            intensity={80}
                            tint="dark"
                            style={{ flex: 1 }}
                        />
                    ),
                    tabBarStyle: {
                        position: 'absolute',
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderTopWidth: 1,
                        borderTopColor: '#334155',
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    tabBarBackground: () => (
                        <BlurView
                            intensity={80}
                            tint="dark"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                        />
                    ),
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => setMenuOpen(true)}
                            style={{ marginLeft: 15 }}
                        >
                            <Ionicons
                                name="menu"
                                size={28}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                    ),
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Dashboard",
                        tabBarIcon: ({ color }) => (
                            <IconSymbol size={28} name="house.fill" color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="oncall"
                    options={{
                        title: "On-Call",
                        tabBarIcon: ({ color }) => (
                            Platform.OS === 'ios' ? (
                                <IconSymbol
                                    size={28}
                                    name="phone.circle.fill"
                                    color={color}
                                />
                            ) : (
                                <Ionicons
                                    size={24}
                                    name="call"
                                    color={color}
                                />
                            )
                        ),
                    }}
                />
                <Tabs.Screen
                    name="incidents"
                    options={{
                        title: "Incidents",
                        tabBarIcon: ({ color }) => (
                            Platform.OS === 'ios' ? (
                                <IconSymbol
                                    size={28}
                                    name="exclamationmark.triangle.fill"
                                    color={color}
                                />
                            ) : (
                                <Ionicons
                                    size={28}
                                    name="warning"
                                    color={color}
                                />
                            )
                        ),
                    }}
                />
            </Tabs>
            <SlideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
    );
}