import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Auth APIs
export const authAPI = {
  signup: async (name, email, password, role) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: role.toLowerCase(), // Backend expects lowercase
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Store token and user data
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
        }));
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        
        // Fetch full user profile to get name
        const profileHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`,
        };
        
        const profileResponse = await fetch(`${API_URL}/api/users/profile`, {
          method: 'GET',
          headers: profileHeaders,
        });
        
        const profileData = await profileResponse.json();
        
        await AsyncStorage.setItem('userData', JSON.stringify({
          _id: data._id,
          name: profileData._id ? profileData.name : data.name || email.split('@')[0],
          email: profileData._id ? profileData.email : email,
          role: profileData._id ? profileData.role : 'Student',
          isAdmin: data.isAdmin,
        }));
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    try {
      // Clear all stored data
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getStoredUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      return userData ? { user: JSON.parse(userData), token } : null;
    } catch (_error) {
      return null;
    }
  },

  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// User APIs
export const userAPI = {
  getProfile: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Auth API extensions for profile update
authAPI.updateProfile = async (profileData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default API_URL;
