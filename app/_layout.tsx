import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import SplashScreen from "./SplashScreen";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // replace with AsyncStorage / Firebase
  const [showWelcome, setShowWelcome] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowWelcome(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (showWelcome) router.replace("/auth/welcome");
      else if (isLoggedIn) router.replace("/(tabs)");
      else router.replace("/auth/login");
    }
  }, [isLoading, showWelcome, isLoggedIn]);

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
