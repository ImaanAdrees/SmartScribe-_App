import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

let socket: any = null;

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
  console.log('[Socket] Registering new_notification listener...');
  const socketInstance = await getSocket();
  
  if (socketInstance && socketInstance.on) {
    socketInstance.on("new_notification", (data: any) => {
      console.log('[Socket] ✅ Received new_notification event:', data);
      callback(data);
    });
    console.log('[Socket] Listener registered successfully');
  } else {
    console.error('[Socket] Socket instance not available');
  }

  // Return unsubscribe function
  return () => {
    console.log('[Socket] Unregistering new_notification listener');
    if (socketInstance && socketInstance.off) {
      socketInstance.off("new_notification");
    }
  };
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
