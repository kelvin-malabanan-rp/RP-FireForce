// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect } from "react";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PushNotificationProvider } from '@/context/push-notification-context';

import { useColorScheme } from "@/hooks/use-color-scheme";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();

    // Load fonts
    const [fontsLoaded] = useFonts({
        'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
        'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
        'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
        'Poppins-Thin': require('../assets/fonts/Poppins-Thin.ttf'),
        'Poppins-ExtraLight': require('../assets/fonts/Poppins-ExtraLight.ttf'),
        'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
        'Poppins-Black': require('../assets/fonts/Poppins-Black.ttf'),
        // Add italic versions if needed
        'Poppins-Italic': require('../assets/fonts/Poppins-Italic.ttf'),
        'Poppins-MediumItalic': require('../assets/fonts/Poppins-MediumItalic.ttf'),
        'Poppins-SemiBoldItalic': require('../assets/fonts/Poppins-SemiBoldItalic.ttf'),
        'Poppins-BoldItalic': require('../assets/fonts/Poppins-BoldItalic.ttf'),
    });

    // Handle font loading
    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <PushNotificationProvider>
                <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="inner-incident-page" options={{ headerShown: false, title: "", headerTitle: ""  }} />
                    <Stack.Screen name="create-override" options={{ headerShown: false, title: "", headerTitle: "", presentation: 'modal' }} />
                    <Stack.Screen name="escalate-incident" options={{ headerShown: false, title: "", headerTitle: "", presentation: 'modal'}} />
                    <Stack.Screen name="tabs" options={{ headerShown: false, title: "", headerTitle: "" }} />
                    <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
                </Stack>
            </PushNotificationProvider>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}