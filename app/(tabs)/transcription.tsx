import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const TranscriptionScreen = () => {
  const router = useRouter();
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.8)).current;

  const transcriptText = `
  [00:00] John: Good morning everyone, let's start with updates.
  [00:10] Jane: The new UI mockups are complete and shared on Figma.
  [00:20] Mike: Backend API integration for login is finalized.
  [00:40] John: Excellent. Let's move on to bug fixes and testing plans.
  [01:00] Jane: I'll handle visual polish and minor layout issues.
  `;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(transcriptText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1500);
  };

  const toggleSidebar = () => {
    const toValue = isSidebarVisible ? -width * 0.8 : 0;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#EEF2FF", "#F9FAFB"]} style={styles.gradient}>
        {/* 🔹 Header Card */}
        <View style={styles.headerCard}>
          <LinearGradient colors={["#6366F1", "#8B5CF6"]} style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <Text style={styles.headerIcon}>📝</Text>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Meeting Transcription</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.metaText}>45 mins</Text>
                  <View style={styles.dot} />
                  <Ionicons name="calendar-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.metaText}>Oct 15, 2025</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 🔹 Transcript Section */}
        <View style={styles.transcriptContainer}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptHeaderText}>Full Transcript</Text>
            <TouchableOpacity onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.transcriptScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.transcriptText}>{transcriptText}</Text>
          </ScrollView>
        </View>

        {/* 🔹 Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/meeting/pdfexport")}
          >
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.actionGradient}>
              <Ionicons name="download-outline" size={20} color="#FFF" />
              <Text style={styles.actionText}>Export PDF</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/(tabs)/summary")}
          >
            <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.actionGradient}>
              <Ionicons name="document-text-outline" size={20} color="#FFF" />
              <Text style={styles.actionText}>Summary</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 💬 Floating Chat Button */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push("/meeting/smartsearch")}
        >
          <LinearGradient colors={["#8B5CF6", "#6366F1"]} style={styles.chatGradient}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ✅ Copy Toast */}
        {copySuccess && (
          <Animated.View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color="#FFF" />
            <Text style={styles.toastText}>Copied to clipboard!</Text>
          </Animated.View>
        )}
      </LinearGradient>

      {/* 🧭 Sidebar */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <LinearGradient colors={["#6366F1", "#8B5CF6"]} style={styles.sidebarHeader}>
          <View style={styles.sidebarProfile}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileText}>S</Text>
            </View>
            <View>
              <Text style={styles.profileName}>SmartScribe</Text>
              <Text style={styles.profileSubtitle}>Voice Notes</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.sidebarContent}>
          <Text style={styles.sidebarSectionTitle}>Previous Meetings</Text>

          {[
            { title: "Weekly Sync", date: "Oct 22, 2025", duration: "45 min" },
            { title: "Sprint Planning", date: "Oct 20, 2025", duration: "60 min" },
            { title: "Client Review", date: "Oct 18, 2025", duration: "30 min" },
            { title: "UI Update", date: "Oct 15, 2025", duration: "45 min" },
            { title: "Team Standup", date: "Oct 13, 2025", duration: "15 min" },
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.historyItem}>
              <View style={styles.historyIconContainer}>
                <Ionicons name="document-text" size={20} color="#6366F1" />
              </View>
              <View style={styles.historyTextContainer}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyMeta}>
                  {item.date} • {item.duration}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Sidebar Overlay */}
      {isSidebarVisible && (
        <TouchableOpacity
          style={styles.sidebarOverlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      )}
    </View>
  );
};

export default TranscriptionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF" },
  gradient: { flex: 1 },

  /* 🔹 Top Bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  topBarTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  moreButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  /* 🔹 Header */
  headerCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
  },
  headerGradient: { padding: 20 },
  headerContent: { flexDirection: "row", alignItems: "center" },
  headerIcon: { fontSize: 40, marginRight: 15 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 13, color: "#E5E7EB", marginHorizontal: 4 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#E5E7EB" },

  /* 🔹 Transcript */
  transcriptContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  transcriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
  },
  transcriptHeaderText: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  transcriptScroll: { flex: 1, marginTop: 10 },
  transcriptText: { fontSize: 15, lineHeight: 24, color: "#374151" },

  /* 🔹 Actions */
  actionContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  actionButton: { flex: 1, borderRadius: 16, overflow: "hidden", elevation: 3 },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  actionText: { color: "#FFF", fontSize: 15, fontWeight: "600" },

  /* 💬 Floating Chat */
  chatButton: {
    position: "absolute",
    bottom: 120,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 6,
    boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.2)",
  },
  chatGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },

  /* ✅ Toast */
  toast: {
    position: "absolute",
    bottom: 180,
    alignSelf: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toastText: { color: "#FFF", fontWeight: "600" },

  /* 🧭 Sidebar */
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: "#FFF",
    elevation: 10,
  },
  sidebarHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sidebarProfile: { flexDirection: "row", alignItems: "center", gap: 12 },
  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#A5B4FC",
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: { color: "#FFF", fontWeight: "700", fontSize: 18 },
  profileName: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  profileSubtitle: { color: "#E5E7EB", fontSize: 12 },
  closeButton: { padding: 5 },

  sidebarContent: { paddingHorizontal: 20, paddingTop: 10 },
  sidebarSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 10,
    marginTop: 10,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ffffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyTextContainer: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  historyMeta: { fontSize: 12, color: "#ffffffff" },

  sidebarOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(32, 32, 32, 0.4)",
  },
});
