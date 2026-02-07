import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import axios from 'axios';
import { initializeSocket, joinNotificationRoom, onNewNotification, disconnectSocket } from '../../utils/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function NotificationsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Function to play notification sound
  const playNotificationSound = async () => {
    try {
      // Set audio mode to allow playing sound even in silent mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Load and play the notification sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/notification.wav'),
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      // Play the sound
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Get user ID and initialize socket on mount
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('userToken');
        
        if (storedUserId) {
          setUserId(storedUserId);
          
          // Fetch stored notifications from database
          if (token) {
            try {
              console.log('Fetching notifications from:', `${API_URL}/api/notifications/user/list`);
              const { data } = await axios.get(`${API_URL}/api/notifications/user/list`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              console.log('Notifications response:', data);

              if (data.notifications && Array.isArray(data.notifications)) {
                console.log('Setting notifications:', data.notifications);
                const storedNotifications = data.notifications.map((notif: any) => ({
                  id: notif.id,
                  title: notif.title,
                  message: notif.message,
                  type: notif.type || 'info',
                  receivedAt: new Date(notif.receivedAt),
                  isRead: notif.isRead,
                  userNotificationId: notif.userNotificationId,
                }));
                setNotifications(storedNotifications);
              }
            } catch (error: any) {
              console.error('Error fetching stored notifications:', error.response?.status, error.response?.data || error.message);
              Toast.show({
                type: 'error',
                position: 'bottom',
                text1: 'Error loading notifications',
                text2: error.response?.data?.message || error.message,
                duration: 3000,
              });
            }
          } else {
            console.warn('No token available for fetching notifications');
          }

          // Initialize socket connection
          await initializeSocket();
          // Join user's notification room
          await joinNotificationRoom(storedUserId);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();

    return () => {
      // Cleanup on unmount
      disconnectSocket();
    };
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    console.log('[Notifications] Setting up real-time listener...');
    
    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        unsubscribe = await onNewNotification((notification: any) => {
          console.log('=== NEW NOTIFICATION RECEIVED ===', notification);
          
          try {
            // Add new notification to the top of the list
            const newNotif = {
              id: notification.id || `notif_${Date.now()}`,
              title: notification.title,
              message: notification.message,
              type: notification.type || 'info',
              time: 'just now',
              receivedAt: new Date(),
            };

            console.log('[Notifications] Adding to UI:', newNotif);
            setNotifications((prevNotifications) => [newNotif, ...prevNotifications]);

            // Play notification sound
            playNotificationSound();

            // Show toast notification
            Toast.show({
              type: notification.type === 'alert' ? 'error' : notification.type === 'success' ? 'success' : 'info',
              position: 'top',
              text1: notification.title,
              text2: notification.message,
              duration: 5000,
            });
          } catch (e) {
            console.error('[Notifications] Error processing notification:', e);
          }
        });

        console.log('[Notifications] Real-time listener attached');
      } catch (e) {
        console.error('[Notifications] Error setting up listener:', e);
      }
    })();

    return () => {
      console.log('[Notifications] Cleaning up real-time listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const formatTime = (date: Date | undefined) => {
    if (!date) return 'just now';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const deleteNotification = async (item: any) => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            if (token && item.id) {
              // Delete from database
              await axios.delete(`${API_URL}/api/notifications/${item.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
            }
            // Remove from local list
            setNotifications((prev) => prev.filter((n) => n.id !== item.id));
            Toast.show({
              type: 'success',
              position: 'bottom',
              text1: 'Notification deleted',
              duration: 2000,
            });
          } catch (error) {
            console.error('Error deleting notification:', error);
            Toast.show({
              type: 'error',
              position: 'bottom',
              text1: 'Failed to delete notification',
              duration: 2000,
            });
          }
        },
      },
    ]);
  };

  const markAsRead = async (item: any) => {
    if (item.isRead) return;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token && item.id) {
        await axios.put(`${API_URL}/api/notifications/${item.id}/read`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'success':
          return '#4CAF50';
        case 'alert':
          return '#FF5252';
        case 'warning':
          return '#FFC107';
        default:
          return '#2196F3';
      }
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'success':
          return 'checkmark-circle';
        case 'alert':
          return 'alert-circle';
        case 'warning':
          return 'warning';
        default:
          return 'information-circle';
      }
    };

    return (
      <TouchableOpacity 
        onPress={() => markAsRead(item)}
        style={[
          styles.item, 
          { 
            borderLeftColor: getTypeColor(item.type), 
            borderLeftWidth: 4,
            backgroundColor: item.isRead ? '#f8f9fa' : '#f0f5ff',
          }
        ]}
      >
        <Ionicons name={getTypeIcon(item.type)} size={24} color={getTypeColor(item.type)} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={[styles.title, { flex: 1 }]}>{item.title}</Text>
            {!item.isRead && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>New</Text>
              </View>
            )}
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{formatTime(item.receivedAt)}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNotification(item)}>
          <Ionicons name="close" size={20} color="#E53935" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>

      <Text style={styles.header}>Notifications</Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 12, color: '#666' }}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off" size={64} color="#CCC" />
          <Text style={{ marginTop: 12, color: '#999', fontSize: 16 }}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#1a1a1a' },
  message: { fontSize: 14, color: '#555', marginBottom: 6, lineHeight: 20 },
  time: { fontSize: 12, color: '#999' },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 10, padding: 4 },
  deleteText: { color: '#E53935', fontWeight: '600' },
  unreadBadge: {
    backgroundColor: '#4F46E5',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
