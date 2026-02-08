import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { showToast } from '../../utils/ToastHelper';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, isLoading, markAsRead, deleteNotification, fetchNotifications } = useNotifications();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

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
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      console.log('[NotificationScreen] Deleting notification:', itemToDelete.id);
      await deleteNotification(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
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
      <View
        style={[
          styles.item,
          {
            borderLeftColor: getTypeColor(item.type),
            borderLeftWidth: 4,
            backgroundColor: item.isRead ? '#f8f9fa' : '#f0f5ff',
          }
        ]}
      >
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => markAsRead(item.id)}
          activeOpacity={0.7}
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
            {item.tag && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
            )}
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{formatTime(item.receivedAt)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#E53935" />
        </TouchableOpacity>
      </View>
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

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={28} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>Delete Notification</Text>
            </View>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.08)",
  },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
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
  tagBadge: {
    backgroundColor: '#E8F4FD',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tagText: {
    color: '#0288D1',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)",
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
