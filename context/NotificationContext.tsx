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
    socketConnected: boolean;
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
    const [socketConnected, setSocketConnected] = useState(false);

    // SDK 54+ Audio implementation
    const player = useAudioPlayer(require('../assets/sounds/notification.wav'));

    // Ensure audio mode is correct on mount
    useEffect(() => {
        const setupAudio = async () => {
            try {
                const { AudioModule } = require('expo-audio');
                await AudioModule.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    interruptionModeIOS: 1, // InterruptionModeIOS.DoNotMix
                    allowsRecordingIOS: false,
                    shouldRouteThroughEarpieceAndroid: false,
                    interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
                    shouldDuckAndroid: true,
                    playThroughReceiverDuringCallAndroid: false,
                });
                console.log('[NotificationContext] Audio mode configured');
            } catch (error) {
                console.warn('[NotificationContext] Failed to set audio mode:', error);
            }
        };
        setupAudio();
    }, []);

    const playNotificationSound = useCallback(async () => {
        try {
            if (player) {
                // Non-blocking pause/seek for speed
                player.pause();
                player.seekTo(0);

                // Fire and forget play locally
                player.play();
            }
        } catch (error: any) {
            console.error('[NotificationContext] Sound play error:', error.message);
        }
    }, [player]);

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

        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        setNotifications(prev => prev.filter((n: Notification) => n.id !== notificationId));
        setUnreadCount(prev => {
            const deletedNotif = previousNotifications.find(n => n.id === notificationId);
            return deletedNotif && !deletedNotif.isRead ? Math.max(0, prev - 1) : prev;
        });

        try {
            await axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showToast('success', 'Deleted', 'Notification removed');
        } catch (error: any) {
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);
            showToast('error', 'Sync Failed', error.message);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchNotifications();
        }
    }, [isLoggedIn, fetchNotifications]);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const setupListener = async () => {
            try {
                // Central check for socket room re-join as a secondary safeguard
                if (isLoggedIn) {
                    const userId = await AsyncStorage.getItem('userId');
                    const { getSocket, joinNotificationRoom } = require('../utils/socket');
                    if (userId) {
                        await joinNotificationRoom(userId);
                    }

                    const socket = await getSocket();
                    if (socket) {
                        setSocketConnected(socket.connected);
                        socket.on('connect', () => setSocketConnected(true));
                        socket.on('disconnect', () => setSocketConnected(false));
                    }
                }

                unsubscribe = await onNewNotification((notification: any) => {
                    // 1. Trigger sound immediately for zero latency
                    playNotificationSound().catch(() => { });

                    // 2. Process state updates
                    const newNotif: Notification = {
                        id: notification.id || `notif_${Date.now()}`,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type || 'info',
                        receivedAt: new Date(),
                        isRead: false,
                        tag: notification.tag || 'SmartScribe',
                    };

                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // 3. Show visual feedback
                    const toastType = notification.type === 'alert' ? 'error' : notification.type === 'success' ? 'success' : 'info';
                    showToast(toastType, notification.title, notification.message);
                });
            } catch (error: any) {
                console.error('[NotificationContext] Failed to setup listener:', error);
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isLoggedIn, playNotificationSound]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isLoggedIn) fetchNotifications();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isLoggedIn, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            socketConnected,
            fetchNotifications,
            markAsRead,
            deleteNotification
        }}>
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
