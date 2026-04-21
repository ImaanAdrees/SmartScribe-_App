import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useNotifications } from '../context/NotificationContext';
import { showToast } from '../utils/ToastHelper';

/**
 * Handle push notification listeners with dynamic imports to avoid 
 * crashes in Expo Go (Android) where push registration side-effects
 * are removed starting SDK 53.
 */
const PushNotificationHandler = () => {
    const { fetchNotifications } = useNotifications();

    useEffect(() => {
        // Skip all logic in Expo Go on Android to prevent crashes
        if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
            return;
        }

        try {
            // Dynamic import to avoid top-level side-effect crash
            const Notifications = require('expo-notifications');

            const subscription = Notifications.addNotificationReceivedListener((notification: any) => {
                fetchNotifications();
                const { title, body } = notification.request.content;
                showToast('info', title || 'Notification', body || '');
            });

            return () => {
                if (subscription) subscription.remove();
            };
        } catch (error) {
            console.warn('[PushNotificationHandler] Notifications module load failed:', error);
        }
    }, [fetchNotifications]);

    return null;
};

export default PushNotificationHandler;
