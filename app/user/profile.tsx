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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../../utils/api";
import { showToast } from "../../utils/ToastHelper";
import { disconnectSocket } from "../../utils/socket";

const ProfileScreen = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("Guest");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("Student");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempName, setTempName] = useState("");
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
          setTempName(parsedData.name || "Guest");
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
            setTempName(parsedData.name || "Guest");
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      };

      loadUserData();
    }, [])
  );

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      showToast("error", "Name Required", "Please enter a name");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.updateProfile({ name: tempName });
      if (response.success) {
        setUserName(tempName);
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify({
            name: tempName,
            email: userEmail,
            role: userRole,
          })
        );
        showToast("success", "Success", "Profile name updated!");
        setShowEditModal(false);
      } else {
        showToast("error", "Update Failed", response.error || "Please try again");
      }
    } catch (error) {
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
      const response = await authAPI.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        showToast("success", "Success", "Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordModal(false);
      } else {
        showToast("error", "Failed", response.error || "Please try again");
      }
    } catch (error) {
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

  const selectImageOption = (option: any) => {
    setShowImageModal(false);
    // In a real app, you'd integrate an image picker here:
    // if (option === "camera") { ... take photo logic ... }
    // if (option === "gallery") { ... choose photo logic ... }
    console.log("Selected:", option);
  };

  return (
    <LinearGradient colors={["#EEF2FF", "#F9FAFB"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        pointerEvents="box-none"
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={["#6366F1", "#8B5CF6"]}
            style={styles.profileGradient}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Text>
                </View>
              )}
              <Pressable
                style={styles.cameraButton}
                onPress={() => setShowImageModal(true)}
              >
                <Ionicons name="camera" size={18} color="#FFF" />
              </Pressable>
            </View>

            {/* Name and Edit */}
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{userName}</Text>
              <Pressable
                style={styles.editButton}
                onPress={() => {
                  setTempName(userName);
                  setShowEditModal(true);
                }}
              >
                <Ionicons name="pencil" size={16} color="#FFF" />
              </Pressable>
            </View>

            {/* Email */}
            <View style={styles.emailContainer}>
              <Ionicons name="mail-outline" size={16} color="#E5E7EB" />
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>

            {/* Role */}
            <View style={styles.roleContainer}>
              <Ionicons name="person-outline" size={16} color="#E5E7EB" />
              <Text style={styles.userRole}>{userRole}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Change Password Button */}
        <View style={{ width: "100%", marginTop: 16 }}>
          <Pressable
            onPress={() => setShowPasswordModal(true)}
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1, borderRadius: 16, overflow: "hidden" },
            ]}
          >
            <LinearGradient
              colors={["#F59E0B", "#F97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Ionicons name="key-outline" size={20} color="#FFF" />
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
                Change Password
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Help Button */}
        <View style={{ width: "100%", marginTop: 8 }}>
          <Pressable
            onPress={() =>
              Linking.openURL(
                "https://smart-scribe-web.vercel.app/demo"
              ).catch((err) => console.error("Failed to open URL:", err))
            }
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1, borderRadius: 16, overflow: "hidden" },
            ]}
          >
            <LinearGradient
              colors={["#4F46E5", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Ionicons name="help-circle-outline" size={20} color="#FFF" />
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
                Help
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Logout Button */}
        <View style={{ width: "100%", marginTop: 16 }}>
          <Pressable
            onPress={handleLogout} // <--- Calls the corrected function
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1, borderRadius: 16, overflow: "hidden" },
            ]}
          >
            <LinearGradient
              colors={["#EF4444", "#DC2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFF" />
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
                Logout
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Name</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.saveButton} onPress={handleSaveName} disabled={loading}>
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  style={styles.saveGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable onPress={() => setShowPasswordModal(false)} disabled={loading}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Old Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Old Password"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPassword}
                editable={!loading}
                placeholderTextColor="#9CA3AF"
              />
              <Pressable onPress={() => setShowOldPassword(!showOldPassword)}>
                <Ionicons
                  name={showOldPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>

            {/* New Password */}
            <View style={styles.passwordInputContainer}>
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
                <Ionicons
                  name={showNewPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>

            {/* Confirm Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                placeholderTextColor="#9CA3AF"
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#F59E0B", "#F97316"]}
                  style={styles.saveGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Update</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.logoutModalContent}>
              <View style={styles.logoutIconContainer}>
                <Ionicons name="log-out" size={40} color="#EF4444" />
              </View>
              <Text style={styles.logoutModalTitle}>Logout</Text>
              <Text style={styles.logoutModalSubmessage}>
                Are you sure you want to logout of SmartScribe?
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.logoutConfirmButton} onPress={confirmLogout}>
                <LinearGradient
                  colors={["#EF4444", "#DC2626"]}
                  style={styles.saveGradient}
                >
                  <Text style={styles.saveButtonText}>Logout</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Selection Modal */}
      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.imageModalCard}>
            <Text style={styles.imageModalTitle}>Change Profile Picture</Text>

            <Pressable
              style={styles.imageOption}
              onPress={() => selectImageOption("camera")}
            >
              <View
                style={[styles.imageOptionIcon, { backgroundColor: "#DBEAFE" }]}
              >
                <Ionicons name="camera" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={styles.imageOption}
              onPress={() => selectImageOption("gallery")}
            >
              <View
                style={[styles.imageOptionIcon, { backgroundColor: "#F3E8FF" }]}
              >
                <Ionicons name="images" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </Pressable>
            <Pressable
              style={styles.imageOption}
              onPress={() => {
                setProfileImage(null);
                setShowImageModal(false);
              }}
            >
              <View
                style={[styles.imageOptionIcon, { backgroundColor: "#FEE2E2" }]}
              >
                <Ionicons name="trash" size={24} color="#EF4444" />
              </View>
              <Text style={styles.imageOptionText}>Remove Photo</Text>
            </Pressable>

            <Pressable
              style={styles.imageModalCancel}
              onPress={() => setShowImageModal(false)}
            >
              <Text style={styles.imageModalCancelText}>Cancel</Text>
            </Pressable>
          </View>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 20 },
  contentContainer: { paddingTop: 20, paddingBottom: 40, alignItems: "center" },
  profileCard: {
    width: "100%",
    marginBottom: 32,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#6366F1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  profileGradient: { padding: 32, alignItems: "center" },
  avatarContainer: { position: "relative", marginBottom: 20 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarText: { fontSize: 42, fontWeight: "700", color: "#6366F1" },
  cameraButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  nameContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  userName: { fontSize: 26, fontWeight: "700", color: "#FFFFFF" },
  editButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255, 255, 255, 0.2)", alignItems: "center", justifyContent: "center" },
  emailContainer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "rgba(255, 255, 255, 0.15)", borderRadius: 12, marginBottom: 8 },
  userEmail: { fontSize: 15, color: "#E5E7EB", fontWeight: "500" },
  roleContainer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "rgba(255, 255, 255, 0.15)", borderRadius: 12 },
  userRole: { fontSize: 15, color: "#E5E7EB", fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, width: "100%", elevation: 10, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  input: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16, fontSize: 16, color: "#1F2937", borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 20 },
  passwordInputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, marginBottom: 12 },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: "#1F2937" },
  modalButtons: { flexDirection: "row", gap: 12 },
  cancelButton: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
  saveButton: { flex: 1, borderRadius: 12, overflow: "hidden" },
  saveGradient: { paddingVertical: 14, alignItems: "center" },
  saveButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  // Logout Modal Styles
  logoutModalContent: {
    alignItems: "center",
    paddingVertical: 10,
  },
  logoutIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  logoutModalSubmessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 10,
  },
  logoutConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  imageModalCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, width: "100%", elevation: 10, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  imageModalTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937", marginBottom: 20, textAlign: "center" },
  imageOption: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", padding: 16, borderRadius: 12, marginBottom: 12 },
  imageOptionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 16 },
  imageOptionText: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  imageModalCancel: { backgroundColor: "#F3F4F6", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  imageModalCancelText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
});