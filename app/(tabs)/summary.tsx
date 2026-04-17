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
  StatusBar,
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
        await logShareDocument({ method: "email" });
      } else {
        Alert.alert("Error", "Unable to open email client");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to share via email");
    }
  };

  const handleEdit = () => {
    // Add your edit functionality here
    Alert.alert("Edit", "Edit functionality will be implemented here");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#EEF2FF", "#F9FAFB"]} style={styles.gradient}>

        {/* Header Card */}
        <View style={styles.headerCard}>
          <LinearGradient colors={["#6366F1", "#8B5CF6"]} style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <Text style={styles.headerIcon}>📋</Text>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Weekly Team Standup</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.metaText}>2023-10-15</Text>
                  <View style={styles.dot} />
                  <Ionicons name="time-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.metaText}>45 min</Text>
                  <View style={styles.dot} />
                  <Ionicons name="people-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.metaText}>3 participants</Text>
                </View>
                <View style={styles.statusTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#A5F3C1" />
                  <Text style={styles.statusText}>Summarized</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Summary Content */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryHeaderText}>Meeting Summary</Text>
            <TouchableOpacity onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.summaryScroll} showsVerticalScrollIndicator={false}>
            <View>
              <Text style={styles.sectionTitle}>Attendees</Text>
              <Text style={styles.listText}>• John Doe (Product Manager)</Text>
              <Text style={styles.listText}>• Jane Smith (UI Designer)</Text>
              <Text style={styles.listText}>• Mike Johnson (Developer)</Text>

              <Text style={styles.sectionTitle}>Key Discussion Points</Text>
              <Text style={styles.listText}>1. Project timeline review</Text>
              <Text style={styles.listText}>2. UI design updates</Text>
              <Text style={styles.listText}>3. Technical challenges with API integration</Text>

              <Text style={styles.sectionTitle}>Action Items</Text>
              <Text style={styles.listText}>• John: Schedule meeting with client</Text>
              <Text style={styles.listText}>• Jane: Complete redesign by Friday</Text>
              <Text style={styles.listText}>• Mike: Improve API performance</Text>

              <Text style={styles.sectionTitle}>Decisions Made</Text>
              <Text style={styles.listText}>• Launch delayed one week</Text>
              <Text style={styles.listText}>• New color scheme approved</Text>
              <Text style={styles.listText}>• Standups include 10-minute deep dive</Text>
            </View>
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>

          {/* Edit button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.actionGradient}>
              <Ionicons name="create-outline" size={18} color="#FFF" />
              <Text style={styles.actionText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <LinearGradient colors={["#6C63FF", "#5B4FF0"]} style={styles.actionGradient}>
              <Ionicons name="share-social-outline" size={18} color="#FFF" />
              <Text style={styles.actionText}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* History button */}
          <TouchableOpacity style={styles.actionButton} onPress={toggleSidebar}>
            <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.actionGradient}>
              <Ionicons name="time-outline" size={18} color="#FFF" />
              <Text style={styles.actionText}>History</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Export PDF button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              await logExportPDF({ format: "pdf" });
              router.push("/meeting/pdfexport");
            }}
          >
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.actionGradient}>
              <Ionicons name="download-outline" size={18} color="#FFF" />
              <Text style={styles.actionText}>Export</Text>
            </LinearGradient>
          </TouchableOpacity>

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
        <TouchableOpacity
          style={styles.sidebarOverlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      )}
    </View>
  );
};

export default SummaryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF" },
  gradient: { flex: 1 },

  /* Header */
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 6 },
  metaText: { fontSize: 13, color: "#E5E7EB", marginHorizontal: 4 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#E5E7EB" },
  statusTag: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  statusText: { color: "#A5F3C1", fontWeight: "600", fontSize: 13 },

  /* Summary */
  summaryContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
    marginBottom: 10,
  },
  summaryHeaderText: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  summaryScroll: { flex: 1 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366F1",
    marginTop: 14,
    marginBottom: 6,
  },
  listText: { fontSize: 13, color: "#374151", marginTop: 3, lineHeight: 20 },

  /* Actions */
  actionContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  actionButton: { 
    flex: 1, 
    borderRadius: 16, 
    overflow: "hidden", 
    elevation: 3,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  actionText: { 
    color: "#FFF", 
    fontSize: 13, 
    fontWeight: "600",
    textAlign: "center",
  },

  /* Sidebar */
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: "#FFF",
    elevation: 10,
    zIndex: 1000,
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
    zIndex: 999,
  },
});