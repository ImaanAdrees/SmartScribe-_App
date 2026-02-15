import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import SplashScreen from "./SplashScreen";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../utils/api";
import API_URL from "../utils/api";
import { initializeSocket, joinNotificationRoom, disconnectSocket, getSocket } from "../utils/socket";
import { NotificationProvider } from "../context/NotificationContext";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceCountdown, setMaintenanceCountdown] = useState<number | null>(null);
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
    // Check Maintenance Status
    // Check Maintenance Status
    const checkMaintenance = async () => {
      try {
        const response = await fetch(`${API_URL}/api/maintenance/check-maintenance`);
        const data = await response.json();
        // Backend now delays setting true, so we can trust this value
        setIsMaintenance(!!data.maintenanceMode);
      } catch (error) {
        console.error("Error checking maintenance status:", error);
      }
    };

    const interval = setInterval(checkMaintenance, 10000); // Check every 10 seconds

    // Socket Listener for Real-time Updates
    const handleMaintenanceWarning = (data: any) => {
      console.log("[RootLayout] Maintenance Warning Received:", data);
      setMaintenanceCountdown(data.duration || 30);
    };

    const handleMaintenanceUpdate = (data: any) => {
      console.log("[RootLayout] Real-time maintenance update:", data);

      if (data.maintenanceMode) {
        // Maintenance confirmed ON (after delay)
        setIsMaintenance(true);
        setMaintenanceCountdown(null);
      } else {
        // Maintenance OFF
        setIsMaintenance(false);
        setMaintenanceCountdown(null);
      }
    };

    const setupSocketListeners = async () => {
      const socket = await getSocket();
      if (socket) {
        console.log("[RootLayout] Attaching maintenance listeners to socket:", socket.id);
        socket.on("maintenance_warning", handleMaintenanceWarning);
        socket.on("maintenance_mode_changed", handleMaintenanceUpdate);
        socket.on("maintenance_warning_cleared", () => setMaintenanceCountdown(null));
      }
    };

    setupSocketListeners();

    return () => {
      clearInterval(interval);
      getSocket().then(socket => {
        if (socket) {
          socket.off("maintenance_warning", handleMaintenanceWarning);
          socket.off("maintenance_mode_changed", handleMaintenanceUpdate);
          socket.off("maintenance_warning_cleared");
        }
      });
    };
  }, []);

  // Countdown Timer Effect
  useEffect(() => {
    if (maintenanceCountdown === null) return;

    if (maintenanceCountdown > 0) {
      const timer = setTimeout(() => {
        setMaintenanceCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (maintenanceCountdown === 0) {
      // Countdown finished, activate maintenance mode
      setIsMaintenance(true);
      setMaintenanceCountdown(null);
    }
  }, [maintenanceCountdown]);

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

      {/* Maintenance Warning Overlay */}
      {maintenanceCountdown !== null && maintenanceCountdown > 0 && (
        <View style={styles.overlay}>
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>System Maintenance</Text>
            <Text style={styles.warningText}>
              Maintenance mode will be enabled in:
            </Text>
            <Text style={styles.countdownText}>{maintenanceCountdown}s</Text>
            <Text style={styles.subText}>Please save your work.</Text>
          </View>
        </View>
      )}
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 16,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  warningBox: {
    alignItems: 'center',
  },
  warningTitle: {
    color: '#ffdd00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 4,
  },
  countdownText: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  subText: {
    color: '#cccccc',
    fontSize: 12,
  },
});
