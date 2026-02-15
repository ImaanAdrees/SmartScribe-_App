import React from 'react';
import { createContext } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { onNewNotification } from '../utils/socket';
import { showToast } from '../utils/ToastHelper';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'alert';
    receivedAt: Date;
    isRead: boolean;
    userNotificationId?: string;
    tag?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode; isLoggedIn?: boolean }> = ({
    children,
    isLoggedIn = false
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // SDK 54+ Audio implementation
    const player = useAudioPlayer(require('../assets/sounds/notification.wav'));

    const playNotificationSound = useCallback(async () => {
        try {
            console.log('[NotificationContext] Attempting to play sound, player status:', player?.playing);
            if (player) {
                console.log('[NotificationContext] Playing notification sound...');
                await player.play();
                console.log('[NotificationContext] Sound played successfully');
            } else {
                console.warn('[NotificationContext] Audio player not initialized');
            }
        } catch (error: any) {
            console.error('[NotificationContext] Sound play error:', error.message, error);
        }
    }, [player]);

    useEffect(() => {
        // useAudioPlayer cleans up itself usually when component unmounts
    }, []);

    const fetchNotifications = useCallback(async () => {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        setIsLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/notifications/user/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.notifications && Array.isArray(data.notifications)) {
                const formatted = data.notifications.map((notif: any) => ({
                    ...notif,
                    receivedAt: new Date(notif.receivedAt),
                }));
                setNotifications(formatted);
                const unread = formatted.filter((n: Notification) => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (error: any) {
            console.error('[NotificationContext] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const markAsRead = async (notificationId: string) => {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        try {
            await axios.put(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('[NotificationContext] Mark as read error:', error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            console.error('[NotificationContext] No token found, cannot delete notification');
            showToast('error', 'Error', 'Please login to delete notifications');
            return;
        }

        // 1. Save current state for rollback
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        // 2. Optimistically update UI
        setNotifications(prev => prev.filter((n: Notification) => n.id !== notificationId));
        setUnreadCount(prev => {
            const deletedNotif = previousNotifications.find(n => n.id === notificationId);
            return deletedNotif && !deletedNotif.isRead ? Math.max(0, prev - 1) : prev;
        });

        try {
            console.log('[NotificationContext] Optimistically deleted. Syncing with backend:', notificationId);

            await axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('[NotificationContext] Backend sync successful');
            showToast('success', 'Deleted', 'Notification removed');
        } catch (error: any) {
            console.error('[NotificationContext] Sync failed, rolling back:', error.response?.data || error.message);

            // 3. Rollback state on failure
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);

            const errorMessage = error.response?.data?.message || 'Failed to sync deletion with server';
            showToast('error', 'Sync Failed', errorMessage);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            console.log('[NotificationContext] User logged in, fetching notifications...');
            fetchNotifications();
        }
    }, [isLoggedIn, fetchNotifications]);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const setupListener = async () => {
            try {
                console.log('[NotificationContext] Setting up notification listener...');
                unsubscribe = await onNewNotification((notification: any) => {
                    console.log('[NotificationContext] New notification received:', notification);

                    const newNotif: Notification = {
                        id: notification.id || `notif_${Date.now()}`,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type || 'info',
                        receivedAt: new Date(),
                        isRead: false,
                        tag: notification.tag || 'SmartScribe',
                    };

                    console.log('[NotificationContext] Adding notification to state:', newNotif);
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Play sound with error handling
                    playNotificationSound().catch((error: any) => {
                        console.warn('[NotificationContext] Failed to play sound:', error);
                    });

                    // Show toast with error handling
                    try {
                        const toastType = notification.type === 'alert' ? 'error' : notification.type === 'success' ? 'success' : 'info';
                        const messageWithSender = `${notification.message}\n📧 Sent by SmartScribe`;
                        console.log('[NotificationContext] Showing toast:', toastType, notification.title, messageWithSender);
                        showToast(toastType, notification.title, messageWithSender);
                    } catch (error: any) {
                        console.error('[NotificationContext] Failed to show toast:', error);
                    }
                });
                console.log('[NotificationContext] Listener setup completed');
            } catch (error: any) {
                console.error('[NotificationContext] Failed to setup listener:', error);
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) {
                console.log('[NotificationContext] Cleaning up notification listener');
                unsubscribe();
            }
        };
    }, [playNotificationSound]);

    useEffect(() => {
        fetchNotifications();

        // Refresh every 5 minutes as a fallback
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, fetchNotifications, markAsRead, deleteNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
