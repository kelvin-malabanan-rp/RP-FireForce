// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePushNotifications } from "@/hooks/use-push-notifications"; // 👈 import your hook

export default function RootLayout() {
    const colorScheme = useColorScheme();

    // 👇 calling the hook at the root ensures its useEffect runs on app start
    const {
        expoPushToken,
        registrationStatus,
        permissionStatus,
    } = usePushNotifications();

    // Optional: debug so you can see it fired
    useEffect(() => {
        console.log("[RootLayout] hook mounted");
        console.log("[RootLayout] token:", expoPushToken);
        console.log("[RootLayout] registration:", registrationStatus);
        console.log("[RootLayout] permission:", permissionStatus);
    }, [expoPushToken, registrationStatus, permissionStatus]);

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="tabs" options={{ headerShown: false, title: "", headerTitle: "" }} />
                <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
