import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import SplashScreen from "./SplashScreen";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../utils/api";
import API_URL from "../utils/api";
import { initializeSocket, joinNotificationRoom, disconnectSocket, socket } from "../utils/socket";
import { NotificationProvider } from "../context/NotificationContext";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const router = useRouter();
  const segments = useSegments();

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

  // Check Maintenance Status
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await fetch(`${API_URL}/api/maintenance/check-maintenance`);
        const data = await response.json();
        setIsMaintenance(!!data.maintenanceMode);
      } catch (error) {
        console.error("Error checking maintenance status:", error);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 10000); // Check every 10 seconds for faster response

    // Socket Listener for Real-time Updates
    const handleMaintenanceUpdate = (data: any) => {
      console.log("[RootLayout] Real-time maintenance update:", data);
      setIsMaintenance(!!data.maintenanceMode);
    };

    if (socket) {
      socket.on("maintenance_mode_changed", handleMaintenanceUpdate);
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off("maintenance_mode_changed", handleMaintenanceUpdate);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inProtectedGroup = segments[0] === "(tabs)" || segments[0] === "user" || segments[0] === "meeting";

    console.log("[RootLayout] Auth Sync - Path:", segments.join("/"), "| isLoggedIn:", isLoggedIn, "| isMaintenance:", isMaintenance);

    // Maintenance Redirection Logic
    const inMaintenance = segments[0] === "maintenance-screen";

    if (isMaintenance) {
      if (!inMaintenance) {
        console.log("[RootLayout] System in maintenance, redirecting to maintenance screen");
        router.replace("/maintenance-screen");
      }
      return; // Stop further checks if in maintenance
    } else if (inMaintenance) {
      // If maintenance is OFF but we are on the screen, redirect back
      console.log("[RootLayout] Maintenance ended, redirecting back");
      router.replace(isLoggedIn ? "/(tabs)" : "/auth/login");
      return;
    }

    if (!isLoggedIn && inProtectedGroup) {
      console.log("[RootLayout] Unauthorized access attempt, redirecting to /auth/login");
      router.replace("/auth/login");
    } else if (isLoggedIn && inAuthGroup) {
      console.log("[RootLayout] Logged in user in auth screen, redirecting to /(tabs)");
      router.replace("/(tabs)");
    }
  }, [isLoading, isLoggedIn, segments, isMaintenance]);

  useEffect(() => {
    if (isLoggedIn) {
      const setupSocket = async () => {
        try {
          // Get userId from storage
          const userId = await AsyncStorage.getItem("userId");
          if (userId) {
            console.log("[RootLayout] Instant Socket Setup - User ID:", userId);
            await initializeSocket();
            await joinNotificationRoom(userId);
            console.log("[RootLayout] Socket connected and joined user room.");
          } else {
            // Fallback to userData if userId is missing
            const userData = await AsyncStorage.getItem("userData");
            if (userData) {
              const parsed = JSON.parse(userData);
              if (parsed._id) {
                console.log("[RootLayout] Socket Setup via userData - User ID:", parsed._id);
                await initializeSocket();
                await joinNotificationRoom(parsed._id);
              }
            }
          }
        } catch (error) {
          console.error("[RootLayout] Socket connection failed:", error);
        }
      };
      setupSocket();
    } else {
      if (!isLoading) {
        console.log("[RootLayout] Disconnecting socket due to logout");
        disconnectSocket();
      }
    }
  }, [isLoggedIn, isLoading]);

  if (isLoading) return <SplashScreen />;

  return (
    <NotificationProvider isLoggedIn={isLoggedIn}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="user" />
        <Stack.Screen name="meeting" />
        <Stack.Screen name="maintenance-screen" options={{ gestureEnabled: false }} />
      </Stack>
      <Toast />
    </NotificationProvider>
  );
}
