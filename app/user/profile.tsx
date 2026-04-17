import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Alert,
  Linking,
  Pressable,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL, { authAPI } from "../../utils/api";
import { showToast } from "../../utils/ToastHelper";
import { disconnectSocket } from "../../utils/socket";
import { logProfileUpdated, logLogout } from "../../utils/activityLogger";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

// Helper to construct full image URL
const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return undefined;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_URL}${imagePath}`;
};

const ProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState("Guest");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("Student");
  const [userPhone, setUserPhone] = useState("");
  const [userOrganization, setUserOrganization] = useState("");
  const [userCity, setUserCity] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempOrganization, setTempOrganization] = useState("");
  const [tempCity, setTempCity] = useState("");
  const [tempCountry, setTempCountry] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Password change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";
  
  // Load user data on mount and when screen comes into focus
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          setUserName(parsedData.name || "Guest");
          setUserEmail(parsedData.email || "");
          setUserRole(parsedData.role || "Student");
          setUserPhone(parsedData.phone || "");
          setUserOrganization(parsedData.organization || "");
          setUserCity(parsedData.city || "");
          setUserCountry(parsedData.country || "");
          setTempName(parsedData.name || "Guest");
          setTempPhone(parsedData.phone || "");
          setTempOrganization(parsedData.organization || "");
          setTempCity(parsedData.city || "");
          setTempCountry(parsedData.country || "");

          if (parsedData.image) {
            setProfileImage(parsedData.image);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  // Reload user data whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        try {
          const userData = await AsyncStorage.getItem("userData");
          if (userData) {
            const parsedData = JSON.parse(userData);
            setUserName(parsedData.name || "Guest");
            setUserEmail(parsedData.email || "");
            setUserRole(parsedData.role || "Student");
            setUserPhone(parsedData.phone || "");
            setUserOrganization(parsedData.organization || "");
            setUserCity(parsedData.city || "");
            setUserCountry(parsedData.country || "");
            setTempName(parsedData.name || "Guest");
            setTempPhone(parsedData.phone || "");
            setTempOrganization(parsedData.organization || "");
            setTempCity(parsedData.city || "");
            setTempCountry(parsedData.country || "");

            if (parsedData.image) {
              setProfileImage(parsedData.image);
            }
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      };

      loadUserData();
    }, [])
  );

  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
      showToast("error", "Name Required", "Please enter a name");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.updateProfile({
        name: tempName,
        phone: tempPhone,
        organization: tempOrganization,
        city: tempCity,
        country: tempCountry,
      });
      if (response.success) {
        setUserName(tempName);
        setUserPhone(tempPhone);
        setUserOrganization(tempOrganization);
        setUserCity(tempCity);
        setUserCountry(tempCountry);

        const storedUserData = await AsyncStorage.getItem("userData");
        const parsedStoredUserData = storedUserData ? JSON.parse(storedUserData) : {};

        await AsyncStorage.setItem(
          "userData",
          JSON.stringify({
            ...parsedStoredUserData,
            name: tempName,
            email: userEmail,
            role: userRole,
            phone: tempPhone,
            organization: tempOrganization,
            city: tempCity,
            country: tempCountry,
          })
        );

        // Log profile update activity
        await logProfileUpdated({
          name: tempName,
          phone: tempPhone,
          organization: tempOrganization,
          city: tempCity,
          country: tempCountry,
        });

        showToast("success", "Success", "Profile updated!");
        setShowEditModal(false);
      } else {
        showToast("error", "Update Failed", response.error || "Please try again");
      }
    } catch {
      showToast("error", "Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast("error", "All Fields Required", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", "Password Mismatch", "New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      showToast(
        "error",
        "Weak Password",
        "Password must be at least 8 characters with uppercase, lowercase, number & special character."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.changePassword(
        oldPassword,
        newPassword,
        confirmPassword
      );

      if (response.success) {
        showToast("success", "Success", "Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordModal(false);
      } else {
        showToast("error", "Error", response.error || "Failed to change password");
      }
    } catch {
      showToast("error", "Error", "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  // --- Logout handlers ---
  const handleLogout = () => {
    console.log("[Profile] Opening Logout Confirmation Modal");
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log("[Profile] Logout confirmed - clearing data");
    setShowLogoutModal(false);
    try {
      // Log logout activity
      await logLogout();

      // Disconnect socket connection
      disconnectSocket();

      // Clear all stored data using authAPI
      const result = await authAPI.logout();
      if (result.success) {
        console.log("[Profile] Local data cleared, redirecting to /auth/login...");
        showToast("success", "Logged out", "See you soon!", 1500);
        router.replace("/auth/login");
      } else {
        console.warn("[Profile] Logout failed:", result.error);
        showToast("error", "Logout Failed", "Please try again");
      }
    } catch (error) {
      console.error("[Profile] Logout error:", error);
      showToast("error", "Logout Error", "An unexpected error occurred.");
    }
  };
  // -------------------------------------------------

  const selectImageOption = async (option: "camera" | "gallery") => {
    setShowImageModal(false);

    try {
      let result;
      if (option === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera access is needed to take a photo.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Media library access is needed to pick an image.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets[0].uri) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      showToast("error", "Error", "Failed to pick image");
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const formData = new FormData();

      // Get filename and extension
      const filename = uri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // Create file object for FormData
      if (Platform.OS === "web") {
        const fetchResponse = await fetch(uri);
        const blob = await fetchResponse.blob();
        formData.append("image", blob, filename);
      } else {
        formData.append("image", {
          uri,
          name: filename,
          type,
        } as any);
      }

      const response = await fetch(`${API_URL}/api/users/profile/image`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          // Content-Type is set automatically by FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setProfileImage(data.image);

        // Update local storage
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsed = JSON.parse(userData);
          parsed.image = data.image;
          await AsyncStorage.setItem("userData", JSON.stringify(parsed));
        }

        showToast("success", "Success", "Profile picture updated!");
      } else {
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      showToast("error", "Upload Failed", error.message || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  const removeProfilePicture = async () => {
    setShowImageModal(false);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      const response = await fetch(`${API_URL}/api/users/profile/image`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProfileImage(null);

        // Update local storage
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsed = JSON.parse(userData);
          parsed.image = null;
          await AsyncStorage.setItem("userData", JSON.stringify(parsed));
        }

        showToast("success", "Removed", "Profile picture removed");
      } else {
        throw new Error(data.message || "Failed to remove image");
      }
    } catch (error: any) {
      console.error("Remove Error:", error);
      showToast("error", "Remove Failed", error.message || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: "edit",
      title: "Edit Profile",
      icon: "person-outline",
      gradient: ["#6366F1", "#8B5CF6"],
      onPress: () => {
        setTempName(userName);
        setTempPhone(userPhone);
        setTempOrganization(userOrganization);
        setTempCity(userCity);
        setTempCountry(userCountry);
        setShowEditModal(true);
      },
    },
    {
      id: "password",
      title: "Change Password",
      icon: "key-outline",
      gradient: ["#F59E0B", "#F97316"],
      onPress: () => setShowPasswordModal(true),
    },
    {
      id: "help",
      title: "Help Center",
      icon: "help-circle-outline",
      gradient: ["#4F46E5", "#6366F1"],
      onPress: () =>
        Linking.openURL("https://smart-scribe-web.vercel.app/demo").catch((err) =>
          console.error("Failed to open URL:", err)
        ),
    },
    {
      id: "logout",
      title: "Logout",
      icon: "log-out-outline",
      gradient: ["#EF4444", "#DC2626"],
      onPress: handleLogout,
      isDanger: true,
    },
  ];

  return (
    <LinearGradient colors={["#EEF2FF", "#FFFFFF"]} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 180 + insets.bottom },
        ]}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        overScrollMode="always"
      >
        {/* Profile Hero Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <LinearGradient
            colors={["#6366F1", "#4F46E5", "#1E3A8A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHero}
          >
            {/* Decorative circles */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />
            
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <Pressable onPress={() => setShowImageModal(true)}>
                {profileImage ? (
                  <Image source={{ uri: getImageUrl(profileImage) }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={["#FFFFFF", "#F3F4F6"]}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarText}>
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </Text>
                  </LinearGradient>
                )}
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.cameraBadge}
                >
                  <Ionicons name="camera" size={18} color="#FFF" />
                </LinearGradient>
              </Pressable>
            </View>

            {/* User Info */}
            <View style={styles.userInfoSection}>
              <Text style={styles.userName}>{userName}</Text>
              <View style={styles.emailChip}>
                <Ionicons name="mail-outline" size={14} color="#E0E7FF" />
                <Text style={styles.userEmail}>{userEmail}</Text>
              </View>
              <View style={styles.roleBadge}>
                <MaterialCommunityIcons name="account-school" size={14} color="#4F46E5" />
                <Text style={styles.userRole}>{userRole}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.statsContainer}>
          <LinearGradient colors={["#FFFFFF", "#F9FAFB"]} style={styles.statCard}>
            <View style={styles.statIconBg}>
              <Ionicons name="call-outline" size={22} color="#4F46E5" />
            </View>
            <Text style={styles.statLabel}>Phone</Text>
            <Text style={styles.statValue}>{userPhone || "Not set"}</Text>
          </LinearGradient>

          <LinearGradient colors={["#FFFFFF", "#F9FAFB"]} style={styles.statCard}>
            <View style={styles.statIconBg}>
              <Ionicons name="business-outline" size={22} color="#4F46E5" />
            </View>
            <Text style={styles.statLabel}>Organization</Text>
            <Text style={styles.statValue}>{userOrganization || "Not set"}</Text>
          </LinearGradient>

          <LinearGradient colors={["#FFFFFF", "#F9FAFB"]} style={styles.statCard}>
            <View style={styles.statIconBg}>
              <Ionicons name="location-outline" size={22} color="#4F46E5" />
            </View>
            <Text style={styles.statLabel}>Location</Text>
            <Text style={styles.statValue}>
              {userCity && userCountry ? `${userCity}, ${userCountry}` : (userCity || userCountry || "Not set")}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(400 + index * 50).springify()}
              style={styles.menuItemWrapper}
            >
              <Pressable onPress={item.onPress} style={styles.menuItem}>
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.menuIconBg}
                >
                  <Ionicons name={item.icon as any} size={22} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.menuTitle, item.isDanger && styles.dangerText]}>
                  {item.title}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={item.isDanger ? "#EF4444" : "#9CA3AF"}
                />
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={styles.modalCard}>
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </Pressable>
            </LinearGradient>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Full Name"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  placeholder="Phone Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={tempOrganization}
                  onChangeText={setTempOrganization}
                  placeholder="Organization"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={tempCity}
                  onChangeText={setTempCity}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="earth-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={tempCountry}
                  onChangeText={setTempCountry}
                  placeholder="Country"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.saveButton} onPress={handleSaveProfile} disabled={loading}>
                <LinearGradient colors={["#6366F1", "#8B5CF6"]} style={styles.saveGradient}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={styles.modalCard}>
            <LinearGradient colors={["#F59E0B", "#F97316"]} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable onPress={() => setShowPasswordModal(false)} disabled={loading}>
                <Ionicons name="close" size={24} color="#FFF" />
              </Pressable>
            </LinearGradient>

            <ScrollView style={styles.modalBody}>
              <View style={styles.passwordWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#F59E0B" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Current Password"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry={!showOldPassword}
                  editable={!loading}
                  placeholderTextColor="#9CA3AF"
                />
                <Pressable onPress={() => setShowOldPassword(!showOldPassword)}>
                  <Ionicons name={showOldPassword ? "eye" : "eye-off"} size={20} color="#6B7280" />
                </Pressable>
              </View>

              <View style={styles.passwordWrapper}>
                <Ionicons name="key-outline" size={20} color="#F59E0B" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  editable={!loading}
                  placeholderTextColor="#9CA3AF"
                />
                <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={20} color="#6B7280" />
                </Pressable>
              </View>

              <View style={styles.passwordWrapper}>
                <Ionicons name="checkmark-done-outline" size={20} color="#F59E0B" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                  placeholderTextColor="#9CA3AF"
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#6B7280" />
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.saveButton} onPress={handleChangePassword} disabled={loading}>
                <LinearGradient colors={["#F59E0B", "#F97316"]} style={styles.saveGradient}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Update Password</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={[styles.modalCard, styles.logoutModal]}>
            <View style={styles.logoutIconWrapper}>
              <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.logoutIconBg}>
                <Ionicons name="log-out" size={40} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.logoutTitle}>Logout?</Text>
            <Text style={styles.logoutMessage}>
              Are you sure you want to logout of SmartScribe? You can always log back in.
            </Text>

            <View style={styles.logoutButtons}>
              <Pressable style={styles.logoutCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.logoutCancelText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.logoutConfirm} onPress={confirmLogout}>
                <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.logoutConfirmGradient}>
                  <Text style={styles.logoutConfirmText}>Logout</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Image Selection Modal */}
      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.springify()} style={styles.imageModalCard}>
            <Text style={styles.imageModalTitle}>Change Profile Picture</Text>

            <Pressable style={styles.imageOption} onPress={() => selectImageOption("camera")}>
              <LinearGradient colors={["#DBEAFE", "#BFDBFE"]} style={styles.imageOptionIcon}>
                <Ionicons name="camera" size={24} color="#3B82F6" />
              </LinearGradient>
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </Pressable>

            <Pressable style={styles.imageOption} onPress={() => selectImageOption("gallery")}>
              <LinearGradient colors={["#F3E8FF", "#E9D5FF"]} style={styles.imageOptionIcon}>
                <Ionicons name="images" size={24} color="#8B5CF6" />
              </LinearGradient>
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </Pressable>

            {profileImage && (
              <Pressable style={styles.imageOption} onPress={removeProfilePicture} disabled={loading}>
                <LinearGradient colors={["#FEE2E2", "#FECACA"]} style={styles.imageOptionIcon}>
                  <Ionicons name="trash" size={24} color="#EF4444" />
                </LinearGradient>
                <Text style={styles.imageOptionText}>Remove Photo</Text>
              </Pressable>
            )}

            <Pressable style={styles.imageModalCancel} onPress={() => setShowImageModal(false)}>
              <Text style={styles.imageModalCancelText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "transparent",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 20 },
  
  // Profile Hero
  profileHero: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  decorCircle1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  decorCircle3: {
    position: "absolute",
    top: "30%",
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  avatarSection: { marginBottom: 16, position: "relative" },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarText: { fontSize: 48, fontWeight: "700", color: "#6366F1" },
  cameraBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userInfoSection: { alignItems: "center" },
  userName: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  emailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  userEmail: { fontSize: 14, color: "#E0E7FF", fontWeight: "500" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userRole: { fontSize: 14, color: "#4F46E5", fontWeight: "600" },
  
  // Stats Cards
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  statValue: { fontSize: 13, fontWeight: "600", color: "#1F2937", textAlign: "center" },
  
  // Menu Items
  menuContainer: { paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  menuItemWrapper: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  menuIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: "#1F2937" },
  dangerText: { color: "#EF4444" },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  modalBody: { padding: 20, maxHeight: height * 0.6 },
  modalFooter: { flexDirection: "row", gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1F2937" },
  
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1F2937" },
  
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
  saveButton: { flex: 1, borderRadius: 14, overflow: "hidden" },
  saveGradient: { paddingVertical: 14, alignItems: "center" },
  saveButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  
  // Logout Modal
  logoutModal: { alignItems: "center", padding: 24 },
  logoutIconWrapper: { marginBottom: 20, marginTop: 8 },
  logoutIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutTitle: { fontSize: 24, fontWeight: "700", color: "#1F2937", marginBottom: 8 },
  logoutMessage: { fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  logoutButtons: { flexDirection: "row", gap: 12, width: "100%" },
  logoutCancel: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutCancelText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
  logoutConfirm: { flex: 1, borderRadius: 14, overflow: "hidden" },
  logoutConfirmGradient: { paddingVertical: 14, alignItems: "center" },
  logoutConfirmText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  
  // Image Modal
  imageModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
  },
  imageModalTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937", marginBottom: 20 },
  imageOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    width: "100%",
  },
  imageOptionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 16 },
  imageOptionText: { fontSize: 16, fontWeight: "600", color: "#1F2937", flex: 1 },
  imageModalCancel: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    width: "100%",
  },
  imageModalCancelText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
});