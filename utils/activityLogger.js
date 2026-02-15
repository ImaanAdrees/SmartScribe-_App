import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
/**
 * Log user activity to the backend
 * @param {string} action - Action type (e.g., "Transcription Created", "Login", etc.)
 * @param {string} description - Optional description of the action
 * @param {object} metadata - Optional metadata about the action
 */
export const logUserActivity = async (action, description = null, metadata = {}) => {
  try {
    const token = await SecureStore.getItemAsync("userToken");

    if (!token) {
      console.warn("User token not found, skipping activity log");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/activity/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action,
        description,
        metadata,
      }),
    });

    if (!response.ok) {
      console.error("Failed to log activity:", response.status);
      return;
    }

    console.log(`Activity logged: ${action}`);
  } catch (error) {
    console.error("Error logging user activity:", error.message);
    // Don't throw error - activity tracking shouldn't break main functionality
  }
};

/**
 * Convenience functions for common actions
 */

export const logLogin = async () => {
  await logUserActivity("Login");
};

export const logLogout = async () => {
  await logUserActivity("Logout");
};

export const logTranscriptionCreated = async (metadata = {}) => {
  await logUserActivity("Transcription Created", "User created a new transcription", metadata);
};

export const logSummaryGenerated = async (metadata = {}) => {
  await logUserActivity("Summary Generated", "User generated a summary", metadata);
};

export const logProfileUpdated = async (metadata = {}) => {
  await logUserActivity("Profile Updated", "User updated their profile", metadata);
};

export const logFileUpload = async (metadata = {}) => {
  await logUserActivity("File Upload", "User uploaded a file", metadata);
};

export const logFileDownload = async (metadata = {}) => {
  await logUserActivity("File Download", "User downloaded a file", metadata);
};

export const logRecordingStarted = async (metadata = {}) => {
  await logUserActivity("Recording Started", "User started a recording", metadata);
};

export const logRecordingCompleted = async (metadata = {}) => {
  await logUserActivity("Recording Completed", "User completed a recording", metadata);
};

export const logExportPDF = async (metadata = {}) => {
  await logUserActivity("Export PDF", "User exported to PDF", metadata);
};

export const logNotificationViewed = async (metadata = {}) => {
  await logUserActivity("Notification Viewed", "User viewed a notification", metadata);
};

export const logShareDocument = async (metadata = {}) => {
  await logUserActivity("Share Document", "User shared a document", metadata);
};
