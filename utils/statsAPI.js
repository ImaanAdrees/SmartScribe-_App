import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const statsAPI = {
  getUserStats: async () => {
    try {
      const headers = await getAuthHeaders();
      // Fetch all for user
      const [recordingsRes, transcriptionsRes, summariesRes] = await Promise.all([
        fetch(`${API_URL}/api/recording/user`, { method: 'GET', headers }),
        fetch(`${API_URL}/api/transcription/user/all`, { method: 'GET', headers }),
        fetch(`${API_URL}/api/summary/user/all`, { method: 'GET', headers }),
      ]);
      const recordings = (await recordingsRes.json()).recordings || [];
      const transcriptions = (await transcriptionsRes.json()).transcriptions || [];
      const summaries = (await summariesRes.json()).summaries || [];
      return {
        success: true,
        stats: {
          recordings: recordings.length,
          transcriptions: transcriptions.length,
          summaries: summaries.length,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
