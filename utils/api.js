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
  onStatusChange: (status) => {}, // Callback to notify root layout of auth changes

  sendSignupOtp: async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  resendSignupOtp: async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  verifySignupOtp: async (email, otp) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  sendForgotPasswordOtp: async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_parseError) {
        data = null;
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: data?.message || `Request failed (${response.status})`,
        };
      }

      return { success: true, data, status: response.status };
    } catch (error) {
      return { success: false, status: 0, error: error.message };
    }
  },

  resendForgotPasswordOtp: async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_parseError) {
        data = null;
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: data?.message || `Request failed (${response.status})`,
        };
      }

      return { success: true, data, status: response.status };
    } catch (error) {
      return { success: false, status: 0, error: error.message };
    }
  },

  verifyForgotPasswordOtp: async (email, otp) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_parseError) {
        data = null;
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: data?.message || `Request failed (${response.status})`,
        };
      }

      return { success: true, data, status: response.status };
    } catch (error) {
      return { success: false, status: 0, error: error.message };
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, channel: 'app' }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_parseError) {
        data = null;
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: data?.message || `Request failed (${response.status})`,
        };
      }

      return { success: true, data, status: response.status };
    } catch (error) {
      return { success: false, status: 0, error: error.message };
    }
  },

  resetPasswordWithToken: async (token, password, confirmPassword) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  signup: async (name, email, password, role, phone, organization, city, country) => {
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
          phone,
          organization,
          city,
          country,
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
          phone: data.phone || null,
          organization: data.organization || null,
          city: data.city || null,
          country: data.country || null,
          image: data.image || null,
        }));
        await AsyncStorage.setItem('userId', data._id);
        
        if (authAPI.onStatusChange) authAPI.onStatusChange(true);
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
        const message = data?.message || 'Login failed';
        const isDisabledAccount =
          response.status === 403 && message.toLowerCase().includes('disabled');

        return {
          success: false,
          error: message,
          code: isDisabledAccount ? 'ACCOUNT_DISABLED' : undefined,
          status: response.status,
        };
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

        if (!profileResponse.ok) {
          const message = profileData?.message || 'Failed to fetch profile';

          if (
            profileResponse.status === 403 &&
            String(message).toLowerCase().includes('disabled')
          ) {
            await AsyncStorage.multiRemove(['userToken', 'userData', 'userId']);
            if (authAPI.onStatusChange) authAPI.onStatusChange(false);
            return {
              success: false,
              error: message,
              code: 'ACCOUNT_DISABLED',
              status: profileResponse.status,
            };
          }
        }
        
        console.log('[authAPI] Profile data received:', profileData);
        
        await AsyncStorage.setItem('userData', JSON.stringify({
          _id: data._id,
          name: profileData._id ? profileData.name : data.name || email.split('@')[0],
          email: profileData._id ? profileData.email : email,
          role: profileData._id ? profileData.role : 'Student',
          phone: profileData._id ? (profileData.phone || null) : null,
          organization: profileData._id ? (profileData.organization || null) : null,
          city: profileData._id ? (profileData.city || null) : null,
          country: profileData._id ? (profileData.country || null) : null,
          isDisabled: profileData._id ? !!profileData.isDisabled : false,
          isAdmin: data.isAdmin,
          image: profileData.image || null,
        }));
        await AsyncStorage.setItem('userId', data._id);

        if (authAPI.onStatusChange) authAPI.onStatusChange(true);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  validateActiveUser: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'GET',
        headers,
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_parseError) {
        data = null;
      }

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: data?.message || `Request failed (${response.status})`,
          code:
            response.status === 403 && (data?.message || '').toLowerCase().includes('disabled')
              ? 'ACCOUNT_DISABLED'
              : undefined,
        };
      }

      return { success: true, status: response.status, data };
    } catch (error) {
      return { success: false, status: 0, error: error.message };
    }
  },

  logout: async () => {
    try {
      const headers = await getAuthHeaders();
      // Notify the backend about the logout
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers,
        });
      } catch (backendError) {
        console.warn('[API] Backend logout call failed:', backendError.message);
        // We still proceed with local cleanup to ensure user can "log out" locally
      }

      // Clear all stored data including token, user info, and any cached state
      await AsyncStorage.multiRemove(['userToken', 'userData', 'userId']);
      
      // Notify listeners if any (like RootLayout)
      if (authAPI.onStatusChange) {
        authAPI.onStatusChange(false);
      }
      
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

  updateProfile: async (profileData) => {
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

// Send Expo push token to backend
export const sendExpoPushToken = async (expoPushToken) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/expo-push-token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ expoPushToken }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to save Expo push token');
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Summary APIs ---
export const summaryAPI = {

  // Update a summary by id
  update: async (summaryId, summaryText) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/summary/${summaryId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ summaryText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update summary');
      return { success: true, summary: data.summary };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

    // Get all summaries for the logged-in user
    getAllForUser: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/summary/user/all`, {
          method: 'GET',
          headers,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch summaries');
        return { success: true, summaries: data.summaries };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  // Generate or fetch summary for a recording
  generate: async (recordingId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/summary/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ recordingId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate summary');
      return { success: true, summary: data.summary };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get all summaries for a recording (history)
  getByRecording: async (recordingId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/summary/recording/${recordingId}`, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch summaries');
      return { success: true, summaries: data.summaries };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get a specific summary by id
  getById: async (summaryId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/summary/${summaryId}`, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch summary');
      return { success: true, summary: data.summary };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default API_URL;
