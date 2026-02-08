import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { onNewNotification } from '../utils/socket';
import { showToast } from '../utils/ToastHelper';
import { Audio } from 'expo-av';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'alert';
    receivedAt: Date;
    isRead: boolean;
    userNotificationId?: string;
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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    const playNotificationSound = useCallback(async () => {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            const { sound: newSound } = await Audio.Sound.createAsync(
                require('../assets/sounds/notification.wav'),
                { shouldPlay: true }
            );
            setSound(newSound);
            await newSound.playAsync();
        } catch (error: any) {
            console.log('[NotificationContext] Sound play skipped (likely file missing or error):', error.message);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

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
        if (!token) return;

        try {
            await axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(prev => {
                const filtered = prev.filter((n: Notification) => n.id !== notificationId);
                const unread = filtered.filter((n: Notification) => !n.isRead).length;
                setUnreadCount(unread);
                return filtered;
            });
        } catch (error) {
            console.error('[NotificationContext] Delete error:', error);
        }
    };

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const setupListener = async () => {
            unsubscribe = await onNewNotification((notification: any) => {
                console.log('[NotificationContext] New notification received:', notification.title);

                const newNotif: Notification = {
                    id: notification.id || `notif_${Date.now()}`,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type || 'info',
                    receivedAt: new Date(),
                    isRead: false,
                };

                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
                playNotificationSound();

                showToast(
                    notification.type === 'alert' ? 'error' : notification.type === 'success' ? 'success' : 'info',
                    notification.title,
                    notification.message
                );
            });
        };

        setupListener();

        return () => {
            if (unsubscribe) unsubscribe();
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
