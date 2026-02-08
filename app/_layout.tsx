import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import SplashScreen from "./SplashScreen";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../utils/api";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        setIsLoggedIn(!!token);
      } catch (error) {
        console.error("[RootLayout] Error checking auth status:", error);
      } finally {
        // Wait a bit to show splash screen
        setTimeout(() => setIsLoading(false), 2000);
      }
    };

    // Register callback for auth status changes
    authAPI.onStatusChange = (status: boolean) => {
      console.log("[RootLayout] Auth status changed:", status);
      setIsLoggedIn(status);
    };

    checkAuthStatus();

    // Cleanup callback on unmount
    return () => {
      authAPI.onStatusChange = () => { };
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      console.log("[RootLayout] Auth check - isLoading:", isLoading, "isLoggedIn:", isLoggedIn);
      if (isLoggedIn) {
        console.log("[RootLayout] Redirecting to /(tabs)");
        router.replace("/(tabs)");
      } else {
        console.log("[RootLayout] Redirecting to /auth/login");
        router.replace("/auth/login");
      }
    }
  }, [isLoading, isLoggedIn]);

  if (isLoading) return <SplashScreen />;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="user" />
        <Stack.Screen name="meeting" />
      </Stack>
      <Toast />
    </>
  );
}
