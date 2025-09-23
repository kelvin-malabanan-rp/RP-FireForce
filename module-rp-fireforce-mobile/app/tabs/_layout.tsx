// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import {HeaderMenu} from "@/components/header-menu";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "react-native";
import {HapticTab} from "@/components/haptic-tab";
import {IconSymbol} from "@/components/ui/icon-symbol";
// Add this import

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
                headerShown: true, // Change to true to show header
                tabBarButton: HapticTab,
                headerLeft: () => <HeaderMenu />, // Add this line
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? "light"].background,
                },
                headerTintColor: Colors[colorScheme ?? "light"].text,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={28} name="house.fill" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="incidents"
                options={{
                    title: "Incidents",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="exclamationmark.triangle.fill"
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}