import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const activityAPI = {
  getRecent: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/activity/recent`, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch recent activities');
      return { success: true, activities: data.activities };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
