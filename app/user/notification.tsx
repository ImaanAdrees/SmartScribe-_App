import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, isLoading, markAsRead, deleteNotification, fetchNotifications } = useNotifications();

  // Refresh notifications on screen focus
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  const handleDelete = (item: any) => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNotification(item.id),
      },
    ]);
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
        onPress={() => markAsRead(item.id)}
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
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
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
