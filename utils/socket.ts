import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Alert } from "react-native";

// Use the same fallback logic as api.js
const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

let socket: any = null;
let notificationListeners: Set<(notification: any) => void> = new Set();
let currentUserId: string | null = null;

/**
 * Initialize and return the socket connection
 */
export const initializeSocket = async () => {
  if (socket) {
    return socket;
  }

  console.log('[Socket] Initializing connection to:', SOCKET_URL);

  // Basic URL check for mobile
  if (Platform.OS !== 'web' && (SOCKET_URL.includes('localhost') || SOCKET_URL.includes('127.0.0.1'))) {
    console.warn('[Socket] WARNING: Localhost detected on mobile. Socket will likely fail.');
  }

  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    transports: Platform.OS === 'web' ? ["polling", "websocket"] : ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("[Socket] ✅ Connected:", socket.id);

    // Optional: Alert for debugging on mobile if specified
    if (__DEV__ && Platform.OS !== 'web') {
      const { showToast } = require('./ToastHelper');
      showToast('success', 'Connected', 'Real-time link established');
    }

    if (currentUserId) {
      console.log('[Socket] Re-joining room for user:', currentUserId);
      socket.emit("join_room", currentUserId);
    }
  });

  socket.on("connect_error", (error: any) => {
    console.error("[Socket] ❌ Connection error:", error.message);
    if (__DEV__ && Platform.OS !== 'web') {
      // Alert.alert('Socket Error', `Failed to connect to ${SOCKET_URL}: ${error.message}`);
    }
  });

  socket.on("disconnect", (reason: string) => {
    console.log("[Socket] ❌ Disconnected. Reason:", reason);
  });

  socket.on("error", (error: any) => {
    console.error("[Socket] Error:", error);
  });

  // Centralized listener for new_notification events
  socket.on("new_notification", (data: any) => {
    console.log('[Socket] 📢 new_notification event received:', data);
    notificationListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error: any) {
        console.error('[Socket] Error in notification callback:', error);
      }
    });
  });

  return socket;
};

/**
 * Get the existing socket instance or initialize if needed
 */
export const getSocket = async () => {
  if (!socket) {
    return await initializeSocket();
  }
  return socket;
};

/**
 * Join user to their personal notification room
 * @param {string} userId - The user ID
 */
export const joinNotificationRoom = async (userId: string) => {
  console.log('[Socket] Request to join room for userId:', userId);
  currentUserId = userId; // Store the ID for re-connects

  if (!socket) {
    console.log('[Socket] No socket instance found, initializing...');
    socket = await initializeSocket();
  }

  if (socket && userId) {
    const roomName = `user_${userId}`;
    console.log('[Socket] Emitting join_room for:', userId, 'Socket ID:', socket.id, 'Connected:', socket.connected);
    socket.emit("join_room", userId);

    // As a backup, if it's already connected but the previous emit might have failed
    if (socket.connected) {
      console.log('[Socket] Socket already connected, join_room emitted immediately');
    } else {
      console.log('[Socket] Socket not yet connected, emit queued by socket.io');
    }
  } else {
    console.warn('[Socket] Cannot join room - socket or userId missing', { socket: !!socket, userId });
  }
};

/**
 * Listen for new notifications
 * @param {function} callback - Callback function to handle new notifications
 */
export const onNewNotification = async (callback: (notification: any) => void) => {
  // Add callback to the listeners set
  notificationListeners.add(callback);

  // Ensure socket is initialized
  await getSocket();

  // Return unsubscribe function
  return () => {
    notificationListeners.delete(callback);
  };
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('[Socket] Disconnecting socket...');
    socket.disconnect();
    socket = null;
    currentUserId = null; // Clear tracking
    notificationListeners.clear();
    console.log('[Socket] Socket disconnected and listeners cleared');
  }
};
