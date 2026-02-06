import Toast from "react-native-toast-message";

/**
 * Show toast notification
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {string} text1 - Main title text
 * @param {string} text2 - Subtitle/description text
 * @param {number} duration - Display duration in ms (default: 3000)
 */
export const showToast = (type, text1, text2, duration = 3000) => {
  Toast.show({
    type,
    text1,
    text2,
    visibilityTime: duration,
    autoHide: true,
    topOffset: 50,
    position: 'top',
  });
};

/**
 * Show success toast
 */
export const showSuccessToast = (title, message) => {
  showToast('success', title, message);
};

/**
 * Show error toast
 */
export const showErrorToast = (title, message) => {
  showToast('error', title, message);
};

/**
 * Show info toast
 */
export const showInfoToast = (title, message) => {
  showToast('info', title, message);
};

/**
 * Hide current toast
 */
export const hideToast = () => {
  Toast.hide();
};

