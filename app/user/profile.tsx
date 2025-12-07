import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const ProfileScreen = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("John Anderson");
  const [userEmail] = useState("john.anderson@company.com");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [profileImage, setProfileImage] = useState(null);

  const handleSaveName = () => {
    setUserName(tempName);
    setShowEditModal(false);
  };

  // --- FIX APPLIED HERE: Removed unnecessary setTimeout ---
  const handleLogout = () => {
    console.log("handleLogout function called!");
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            console.log("Logout confirmed - navigating to login");
            router.replace("/auth/login");
          },
        },
      ],
      { cancelable: false }
    );
  };
  // -----------------------------------------------------

  const selectImageOption = (option) => {
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
          </LinearGradient>
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
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.saveButton} onPress={handleSaveName}>
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  style={styles.saveGradient}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
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

            {profileImage && (
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
            )}

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
  emailContainer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "rgba(255, 255, 255, 0.15)", borderRadius: 12 },
  userEmail: { fontSize: 15, color: "#E5E7EB", fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, width: "100%", elevation: 10, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  input: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16, fontSize: 16, color: "#1F2937", borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 20 },
  modalButtons: { flexDirection: "row", gap: 12 },
  cancelButton: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
  saveButton: { flex: 1, borderRadius: 12, overflow: "hidden" },
  saveGradient: { paddingVertical: 14, alignItems: "center" },
  saveButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  imageModalCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, width: "100%", elevation: 10, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  imageModalTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937", marginBottom: 20, textAlign: "center" },
  imageOption: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", padding: 16, borderRadius: 12, marginBottom: 12 },
  imageOptionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 16 },
  imageOptionText: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  imageModalCancel: { backgroundColor: "#F3F4F6", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  imageModalCancelText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
});