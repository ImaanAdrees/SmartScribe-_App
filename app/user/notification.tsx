import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
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

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          color: '#10B981',
          bg: '#D1FAE5',
          icon: 'checkmark-circle',
          gradient: ['#10B981', '#059669']
        };
      case 'alert':
        return {
          color: '#EF4444',
          bg: '#FEE2E2',
          icon: 'alert-circle',
          gradient: ['#EF4444', '#DC2626']
        };
      case 'warning':
        return {
          color: '#F59E0B',
          bg: '#FEF3C7',
          icon: 'warning',
          gradient: ['#F59E0B', '#D97706']
        };
      default:
        return {
          color: '#6366F1',
          bg: '#E0E7FF',
          icon: 'information-circle',
          gradient: ['#6366F1', '#4F46E5']
        };
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const typeConfig = getTypeConfig(item.type);
    
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
      >
        <LinearGradient
          colors={item.isRead ? ['#FFFFFF', '#F9FAFB'] : ['#EEF2FF', '#FFFFFF']}
          style={[
            styles.item,
            item.isRead && styles.readItem
          ]}
        >
          <TouchableOpacity
            style={styles.itemContent}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.7}
          >
            {/* Icon Circle */}
            <LinearGradient
              colors={typeConfig.gradient}
              style={styles.iconCircle}
            >
              <Ionicons name={typeConfig.icon as any} size={24} color="#FFF" />
            </LinearGradient>

            <View style={styles.itemTextContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.title}</Text>
                {!item.isRead && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>NEW</Text>
                  </View>
                )}
              </View>
              
              {item.tag && (
                <View style={[styles.tagBadge, { backgroundColor: `${typeConfig.color}15` }]}>
                  <Text style={[styles.tagText, { color: typeConfig.color }]}>{item.tag}</Text>
                </View>
              )}
              
              <Text style={styles.message}>{item.message}</Text>
              
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text style={styles.time}>{formatTime(item.receivedAt)}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={['#FEE2E2', '#FECACA']}
              style={styles.deleteBtnGradient}
            >
              <Ionicons name="close" size={16} color="#EF4444" />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    alerts: notifications.filter(n => n.type === 'alert').length,
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#6366F1', '#4F46E5', '#1E3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#4F46E5" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.statCard}>
            <View style={styles.statIconBg}>
              <Ionicons name="notifications" size={20} color="#6366F1" />
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </LinearGradient>

          <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="mail-unread" size={20} color="#EF4444" />
            </View>
            <Text style={styles.statNumber}>{stats.unread}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </LinearGradient>

          <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>{stats.alerts}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <Animated.View entering={FadeInUp.springify()} style={styles.emptyContainer}>
          <LinearGradient
            colors={['#EEF2FF', '#FFFFFF']}
            style={styles.emptyCard}
          >
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off" size={64} color="#6366F1" />
            </View>
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={styles.emptyMessage}>
              When you receive notifications, they'll appear here
            </Text>
          </LinearGradient>
        </Animated.View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
          <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.modalHeaderGradient}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="trash-outline" size={32} color="#FFF" />
              </View>
            </LinearGradient>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>Delete Notification</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete "{itemToDelete?.title}"?
              </Text>
              <Text style={styles.modalWarning}>
                This action cannot be undone.
              </Text>
            </View>

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
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>Delete</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  placeholder: { width: 40 },
  
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  
  // List Items
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  item: {
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  readItem: {
    opacity: 0.85,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  itemTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 16,
  },
  deleteBtnGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    width: width - 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Loading State
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeaderGradient: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  modalWarning: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});