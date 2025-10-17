import React, { useEffect, useState } from "react";
import { Stack, Redirect } from "expo-router";
import SplashScreen from "./SplashScreen";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track auth state

  useEffect(() => {
    const timer = setTimeout(() => {
      // 🔹 Replace this with AsyncStorage or Firebase auth check later
      const userToken = null; // simulate: not logged in
      setIsLoggedIn(!!userToken);
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  // ✅ Define both stacks: auth and user
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="user" />

      {/* Redirect logic */}
      {!isLoggedIn ? (
        <Redirect href="/auth/login" />
      ) : (
        <Redirect href="/user/home" />
      )}
    </Stack>
  );
}
