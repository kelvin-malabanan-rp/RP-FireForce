// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect } from "react";
import * as Notifications from 'expo-notifications';

import { useColorScheme } from "@/hooks/use-color-scheme";
import {usePushNotifications} from "@/hooks/use-push-notifications";

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const {
        expoPushToken,
        registrationStatus,
        permissionStatus,
        fcmToken,
    } = usePushNotifications();

    // Optional: debug so you can see it fired
    useEffect(() => {
        console.log("[RootLayout] hook mounted");
        console.log("[RootLayout] token:", expoPushToken);
        console.log("[RootLayout] fcmToken:", fcmToken);
        console.log("[RootLayout] registration:", registrationStatus);
        console.log("[RootLayout] permission:", permissionStatus);
    }, [expoPushToken, fcmToken, registrationStatus, permissionStatus]);

    useEffect(() => {
        const sub1 = Notifications.addNotificationReceivedListener((n) => {
            const ch = (n.request as any)?.android?.channelId;
            console.log('[rx] received on channel:', ch, 'title:', n.request.content.title);
        });
        const sub2 = Notifications.addNotificationResponseReceivedListener((r) => {
            const ch = (r.notification.request as any)?.android?.channelId;
            console.log('[rx] response for channel:', ch);
        });
        return () => { sub1.remove(); sub2.remove(); };
    }, []);

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
