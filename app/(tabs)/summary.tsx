import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
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
  ActivityIndicator,
  TextInput,
} from "react-native";
import { logShareDocument, logExportPDF, logSummaryGenerated } from "@/utils/activityLogger";
import { summaryAPI } from "@/utils/api";
import { useEffect } from "react";
import { initializeSocket } from "@/utils/socket";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { width } = Dimensions.get("window");

const SummaryScreen = () => {
  const { recordingId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<"Summary" | "Transcript" | "Keywords">("Summary");
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const router = useRouter();

  // State for summary and history
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);


  // Fetch/generate summary on mount or when recordingId changes
  React.useEffect(() => {
    if (!recordingId) return;
    setLoading(true);
    setError(null);
    summaryAPI.generate(recordingId)
      .then(async res => {
        if (res.success) {
          setSummary(res.summary);
          // Log activity for summary generated
          await logSummaryGenerated({ recordingId });
        } else setError(res.error || "Failed to generate summary");
      })
      .catch(e => setError(e.message || "Failed to generate summary"))
      .finally(() => setLoading(false));
  }, [recordingId]);

  // Fetch all summaries for the logged-in user (for history)
  const fetchAllUserSummaries = React.useCallback(() => {
    setHistoryLoading(true);
    summaryAPI.getAllForUser()
      .then(res => {
        if (res.success) setHistory(res.summaries || []);
        else setHistory([]);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  React.useEffect(() => {
    fetchAllUserSummaries();
  }, [fetchAllUserSummaries]);

  const toggleSidebar = () => {
    const toValue = isSidebarVisible ? -width * 0.8 : 0;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setSidebarVisible(!isSidebarVisible);
  };

useEffect(() => {
    let socket: any;
    let userId: string | null = null;

    const setupSocket = async () => {
      socket = await initializeSocket();
      userId = await AsyncStorage.getItem('userId');
      if (userId) {
        socket.emit('join_room', userId);
      }
      socket.on('summary_created', (data: any) => {
        if (data.recordingId === recordingId) {
          fetchAllUserSummaries();
        }
      });
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.off('summary_created');
      }
    };
  }, [recordingId, fetchAllUserSummaries]);
  const handleCopy = async () => {
    if (!summary?.summaryText) return;
    await Clipboard.setStringAsync(summary.summaryText);
    Alert.alert("Copied!", "Summary text copied to clipboard.");
  };


  const handleShare = async () => {
    if (!summary?.summaryText) return;
    try {
      await Share.share({
        message: summary.summaryText,
        subject: "Meeting Summary – SmartScribe",
      });
      await logShareDocument({ method: "native_share" });
    } catch (error) {
      Alert.alert("Error", "Unable to share summary");
    }
  };


  const handleEmailShare = async () => {
    if (!summary?.summaryText) return;
    const subject = encodeURIComponent("Meeting Summary – SmartScribe");
    const body = encodeURIComponent(summary.summaryText);
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
    setEditText(summary?.summaryText || "");
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditText("");
  };

  const handleSaveEdit = async () => {
    if (!summary?._id) return;
    setLoading(true);
    const res = await summaryAPI.update(summary._id, editText);
    if (res.success) {
      setSummary(res.summary);
      // Also update in history if needed
      setHistory((prev) => prev.map((item) => item._id === res.summary._id ? res.summary : item));
      setEditMode(false);
    } else {
      Alert.alert("Error", res.error || "Failed to update summary");
    }
    setLoading(false);
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
                <Text style={styles.headerTitle}>{summary?.title || "Summary"}</Text>
                <View style={styles.metaRow}>
                  {/* Optionally show date/duration if available in summary */}
                  {/* <Ionicons name="calendar-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.metaText}>{summary?.date || "--/--/----"}</Text>
                  <View style={styles.dot} />
                  <Ionicons name="time-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.metaText}>{summary?.duration || "--:--"}</Text> */}
                </View>
                <View style={styles.statusTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#A5F3C1" />
                  <Text style={styles.statusText}>{summary ? "Summarized" : "No Summary"}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Summary Content */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryHeaderText}>Summary</Text>
            <TouchableOpacity onPress={handleCopy} disabled={!summary?.summaryText}>
              <Ionicons name="copy-outline" size={20} color={summary?.summaryText ? "#6366F1" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.summaryScroll} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={{ color: "#6366F1", marginTop: 10 }}>Generating summary...</Text>
              </View>
            ) : error ? (
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={{ color: "#EF4444", marginTop: 10 }}>{error}</Text>
              </View>
            ) : editMode ? (
              <View>
                <Text style={styles.sectionTitle}>Edit Summary</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  <TextInput
                    style={{
                      borderColor: '#6366F1', borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 100, color: '#374151', fontSize: 13
                    }}
                    multiline
                    value={editText}
                    onChangeText={setEditText}
                    editable={!loading}
                  />
                </ScrollView>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <TouchableOpacity style={[styles.actionButton, { flex: 1 }]} onPress={handleCancelEdit} disabled={loading}>
                    <LinearGradient colors={["#9CA3AF", "#6B7280"]} style={styles.actionGradient}>
                      <Ionicons name="close" size={18} color="#FFF" />
                      <Text style={styles.actionText}>Cancel</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { flex: 1 }]} onPress={handleSaveEdit} disabled={loading || !editText.trim()}>
                    <LinearGradient colors={["#10B981", "#059669"]} style={styles.actionGradient}>
                      <Ionicons name="save" size={18} color="#FFF" />
                      <Text style={styles.actionText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : summary?.summaryText ? (
              <Text style={styles.listText}>{summary.summaryText}</Text>
            ) : (
              <Text style={styles.listText}>No summary available for this recording.</Text>
            )}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>

          {/* Edit button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit} disabled={editMode || !summary?.summaryText}>
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.actionGradient}>
              <Ionicons name="create-outline" size={18} color="#FFF" />
              <Text style={styles.actionText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleShare} disabled={!summary?.summaryText}>
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

      {/* Sidebar: Summary History */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}> 
        <LinearGradient colors={["#6366F1", "#8B5CF6"]} style={styles.sidebarHeader}>
          <View style={styles.sidebarProfile}>
            <View className="profileCircle">
              <Text style={styles.profileText}>S</Text>
            </View>
            <View>
              <Text style={styles.profileName}>SmartScribe</Text>
              <Text style={styles.profileSubtitle}>Summary History</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>
        <ScrollView style={styles.sidebarContent}>
          <Text style={styles.sidebarSectionTitle}>Previous Summaries</Text>
          {historyLoading ? (
            <ActivityIndicator size="small" color="#6366F1" style={{ marginTop: 20 }} />
          ) : history.length === 0 ? (
            <Text style={{ color: "#6B7280", marginTop: 20 }}>No previous summaries found.</Text>
          ) : (
            history.map((item, idx) => (
              <TouchableOpacity
                key={item._id}
                style={styles.historyItem}
                onPress={async () => {
                  // Fetch and show this summary
                  setLoading(true);
                  setError(null);
                  const res = await summaryAPI.getById(item._id);
                  if (res.success) setSummary(res.summary);
                  else setError(res.error || "Failed to fetch summary");
                  setLoading(false);
                  toggleSidebar();
                }}
              >
                <View style={styles.historyIconContainer}>
                  <Ionicons name="document-text" size={20} color="#6366F1" />
                </View>
                <View style={styles.historyTextContainer}>
                  <Text style={styles.historyTitle}>{item.title || `Summary #${idx + 1}`}</Text>
                  <Text style={styles.historyMeta}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
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