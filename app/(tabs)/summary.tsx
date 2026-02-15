import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { logShareDocument, logExportPDF, logSummaryGenerated } from "@/utils/activityLogger";

const { width } = Dimensions.get("window");

const SummaryScreen = () => {
  const [activeTab, setActiveTab] = useState<"Summary" | "Transcript" | "Keywords">("Summary");
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const router = useRouter();

  const toggleSidebar = () => {
    const toValue = isSidebarVisible ? -width * 0.8 : 0;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setSidebarVisible(!isSidebarVisible);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(
      "Weekly Team Standup Summary:\n1. Project timeline review\n2. UI design updates\n3. API integration challenges"
    );
    Alert.alert("Copied!", "Summary text copied to clipboard.");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Weekly Team Standup Summary:\n1. Project timeline review\n2. UI design updates\n3. API integration challenges",
        subject: "Meeting Summary – SmartScribe",
      });
      // Log document share activity
      await logShareDocument({ method: "native_share" });
    } catch (error) {
      Alert.alert("Error", "Unable to share summary");
    }
  };

  const handleEmailShare = async () => {
    const subject = encodeURIComponent("Meeting Summary – Weekly Team Standup");
    const body = encodeURIComponent(
      `Meeting Summary: Weekly Team Standup\n\n` +
      `Date: 2023-10-15 | Duration: 45 min | Participants: 3\n\n` +
      `Attendees:\n` +
      `- John Doe (Product Manager)\n` +
      `- Jane Smith (UI Designer)\n` +
      `- Mike Johnson (Developer)\n\n` +
      `Key Discussion Points:\n` +
      `1. Project timeline review\n` +
      `2. UI design updates\n` +
      `3. Technical challenges with API integration\n\n` +
      `Action Items:\n` +
      `- John: Schedule meeting with client\n` +
      `- Jane: Complete redesign by Friday\n` +
      `- Mike: Improve API performance\n\n` +
      `Decisions Made:\n` +
      `- Launch delayed one week\n` +
      `- New color scheme approved\n` +
      `- Standups include 10-minute deep dive\n\n` +
      `Sent via SmartScribe`
    );

    const emailUrl = `mailto:?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
        // Log document share activity
        await logShareDocument({ method: "email" });
      } else {
        Alert.alert("Error", "Unable to open email client");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to share via email");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#7B2FF7", "#F107A3"]} style={styles.container}>
        {/* 🔹 Meeting Info */}
        <View style={styles.meetingInfo}>
          <Text style={styles.dateText}>📅 2023-10-15 • 45 min • 3 participants</Text>
          <View style={styles.statusTag}>
            <Ionicons name="checkmark-circle" size={16} color="#6C63FF" />
            <Text style={styles.statusText}>Summarized</Text>
          </View>
        </View>

        {/* 🔹 Tabs */}
        <View style={styles.tabContainer}>
          {["Summary"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔹 Content */}
        <ScrollView style={styles.content}>
          {activeTab === "Summary" && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}># Meeting Summary: Weekly Team Standup</Text>

              <Text style={styles.subTitle}>## Attendees</Text>
              <Text style={styles.listText}>- John Doe (Product Manager)</Text>
              <Text style={styles.listText}>- Jane Smith (UI Designer)</Text>
              <Text style={styles.listText}>- Mike Johnson (Developer)</Text>

              <Text style={styles.subTitle}>## Key Discussion Points</Text>
              <Text style={styles.listText}>1. Project timeline review</Text>
              <Text style={styles.listText}>2. UI design updates</Text>
              <Text style={styles.listText}>3. Technical challenges with API integration</Text>

              <Text style={styles.subTitle}>## Action Items</Text>
              <Text style={styles.listText}>- John: Schedule meeting with client</Text>
              <Text style={styles.listText}>- Jane: Complete redesign by Friday</Text>
              <Text style={styles.listText}>- Mike: Improve API performance</Text>

              <Text style={styles.subTitle}>## Decisions Made</Text>
              <Text style={styles.listText}>- Launch delayed one week</Text>
              <Text style={styles.listText}>- New color scheme approved</Text>
              <Text style={styles.listText}>- Standups include 10-minute deep dive</Text>
            </View>
          )}
        </ScrollView>

        {/* 🔹 Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.rightButtons}>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={18} color="#fff" />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={async () => {
                // Log export PDF activity
                await logExportPDF({ format: "pdf" });
                router.push("/meeting/pdfexport");
              }}
            >
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.exportText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Sidebar */}
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

      {isSidebarVisible && (
        <TouchableOpacity style={styles.sidebarOverlay} activeOpacity={1} onPress={toggleSidebar} />
      )}
    </View>
  );
};

export default SummaryScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 50,
  },
  emailIconButton: {
    padding: 5,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, marginLeft: 10 },
  meetingInfo: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },
  dateText: { color: "#555", fontSize: 13, marginBottom: 5 },
  statusTag: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusText: { color: "#6C63FF", fontWeight: "600" },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tabButton: { paddingVertical: 12, width: "33%", alignItems: "center" },
  activeTab: { borderBottomWidth: 3, borderColor: "#7B2FF7" },
  tabText: { color: "#777", fontWeight: "600" },
  activeTabText: { color: "#7B2FF7" },
  content: { backgroundColor: "#f8f8ff", padding: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#333" },
  subTitle: { fontSize: 14, fontWeight: "700", marginTop: 10, color: "#444" },
  listText: { fontSize: 13, color: "#555", marginTop: 3 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderTopWidth: 20,
    borderColor: "#fff",
  },
  editButton: {
    borderWidth: 1,
    borderColor: "#7B2FF7",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  editText: { color: "#7B2FF7", fontWeight: "600" },
  rightButtons: { flexDirection: "row", gap: 10 },
  copyButton: {
    backgroundColor: "#6C63FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  copyText: { color: "#fff", fontWeight: "600" },
  shareButton: {
    backgroundColor: "#6C63FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  shareText: { color: "#fff", fontWeight: "600" },
  exportButton: {
    backgroundColor: "#7B2FF7",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  exportText: { color: "#fff", fontWeight: "600" },
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
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyTextContainer: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  historyMeta: { fontSize: 12, color: "#6B7280" },
  sidebarOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(32, 32, 32, 0.4)",
  },
});