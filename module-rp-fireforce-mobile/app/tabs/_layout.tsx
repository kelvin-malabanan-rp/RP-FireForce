// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { useState } from "react";
import {Platform, TouchableOpacity, useColorScheme} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {SlideMenu} from "@/components/navigation-menu";
import {Colors} from "@/constants/theme";
import {HapticTab} from "@/components/haptic-tab";
import {IconSymbol} from "@/components/ui/icon-symbol";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
                    headerShown: true,
                    headerTitle: "",
                    tabBarButton: HapticTab,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => setMenuOpen(true)}
                            style={{ marginLeft: 15 }}
                        >
                            <Ionicons
                                name="menu"
                                size={28}
                                color={Colors[colorScheme ?? "light"].text}
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