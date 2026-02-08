import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

let socket: any = null;
let notificationListeners: Set<(notification: any) => void> = new Set();

/**
 * Initialize and return the socket connection
 */
export const initializeSocket = async () => {
  if (socket) {
    console.log('[Socket] Socket already initialized, returning existing instance');
    return socket;
  }

  console.log('[Socket] Initializing new socket connection to:', SOCKET_URL);
  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("[Socket] ✅ Connected successfully:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("[Socket] ❌ Disconnected");
  });

  socket.on("error", (error: any) => {
    console.error("[Socket] Error:", error);
  });

  // Register the centralized listener for new_notification events
  socket.on("new_notification", (data: any) => {
    console.log('[Socket] 📢 new_notification event received:', data);
    // Broadcast to all registered listeners
    notificationListeners.forEach(callback => {
      try {
        console.log('[Socket] Calling listener callback');
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
  if (!socket) {
    socket = await initializeSocket();
  }
  if (socket && userId) {
    const roomName = `user_${userId}`;
    console.log('[Socket] Attempting to join room:', roomName);
    socket.emit("join_room", userId);
    console.log('[Socket] Join room event emitted for:', userId);
  } else {
    console.warn('[Socket] Cannot join room - socket or userId missing', { socket: !!socket, userId });
  }
};

/**
 * Listen for new notifications
 * @param {function} callback - Callback function to handle new notifications
 */
export const onNewNotification = async (callback: (notification: any) => void) => {
  console.log('[Socket] Registering notification callback...');
  
  // Add callback to the listeners set
  notificationListeners.add(callback);
  console.log('[Socket] Callback registered. Total listeners:', notificationListeners.size);

  // Ensure socket is initialized
  const socketInstance = await getSocket();
  
  if (!socketInstance) {
    console.error('[Socket] Failed to initialize socket');
  }

  // Return unsubscribe function
  return () => {
    console.log('[Socket] Unregistering notification callback');
    notificationListeners.delete(callback);
    console.log('[Socket] Callback unregistered. Remaining listeners:', notificationListeners.size);
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
    notificationListeners.clear();
    console.log('[Socket] Socket disconnected and listeners cleared');
  }
};
