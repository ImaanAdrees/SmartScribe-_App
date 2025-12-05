import React, { useEffect, useState } from "react";
import { Stack, Redirect } from "expo-router";
import SplashScreen from "./SplashScreen";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // later you can check AsyncStorage or Firebase
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowWelcome(true);
    }, 2000); // 2 sec splash
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <SplashScreen />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth group */}
      <Stack.Screen name="auth" />
      {/* User group */}
      <Stack.Screen name="user" />
      
       <Stack.Screen name="meeting" />

      {/* Redirect Logic */}
      {showWelcome ? (
        <Redirect href="/auth/welcome" />
      ) : isLoggedIn ? (
        <Redirect href="/user/home" />
      ) : (
        <Redirect href="/auth/login" />
      )}
    </Stack>
  );
}
