import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  let token;
  // Guard for Expo Go on Android
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo && Platform.OS === 'android') {
    console.log('[pushNotifications] Skipping push registration in Expo Go (Android)');
    return null;
  }

  try {
    // Dynamic import to avoid top-level side-effect crash in Expo Go
    const Notifications = require('expo-notifications');

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return null;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      return null;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (error) {
    console.warn('[pushNotifications] Failed to load notifications module:', error);
    return null;
  }

  return token;
}
