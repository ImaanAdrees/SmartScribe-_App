import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
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
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logExportPDF } from "@/utils/activityLogger";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const { width } = Dimensions.get("window");

const TranscriptionScreen = () => {
  const router = useRouter();
  const { recordingId } = useLocalSearchParams();
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.8)).current;

  const [loading, setLoading] = useState(!!recordingId);
  const [recording, setRecording] = useState<any>(null);
  const [transcription, setTranscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
    if (recordingId) {
      fetchTranscription(recordingId);
    }
  }, [recordingId]);

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/recording/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.recordings)) {
        setHistory(data.recordings);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Fetch history error', err);
      setHistory([]);
    }
  };

  const fetchTranscription = async (id: any) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/recording/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setRecording(data.recording);
        setTranscription(data.transcription);

        // If transcription doesn't exist yet, it's likely still processing
        if (!data.transcription) {
          // Poll every 3 seconds for transcription
          const pollInterval = setInterval(async () => {
            const pollRes = await fetch(`${API_URL}/api/recording/${id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const pollData = await pollRes.json();
            if (pollData.success && pollData.transcription) {
              setTranscription(pollData.transcription);
              clearInterval(pollInterval);
            }
          }, 3000);

          // Cleanup interval after 30 seconds max
          setTimeout(() => clearInterval(pollInterval), 30000);
        }
      } else {
        setError(data.error || 'Failed to fetch recording');
      }
    } catch (err) {
      console.error('Fetch transcription error', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const transcriptText = transcription?.text || "";

  const handleCopy = async () => {
    if (!transcriptText) return;
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

  const handleSelectHistory = (id: string) => {
    toggleSidebar();
    router.setParams({ recordingId: id });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#EEF2FF", "#F9FAFB"]} style={styles.gradient}>
        {/* 🔹 Top Bar */}
        {/* <View style={styles.topBar}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
            <Ionicons name="menu-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Transcription</Text>
          <View style={{ width: 40 }} />
        </View> */}

        {/* 🔹 Header Card */}
        <View style={styles.headerCard}>
          <LinearGradient colors={["#6366F1", "#8B5CF6"]} style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <Text style={styles.headerIcon}>📝</Text>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{recording?.name || (recordingId ? "Loading..." : "Select a Recording")}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.metaText}>{recording?.duration || "--:--"}</Text>
                  <View style={styles.dot} />
                  <Ionicons name="calendar-outline" size={14} color="#E5E7EB" />
                  <Text style={styles.metaText}>
                    {recording?.createdAt ? new Date(recording.createdAt).toLocaleDateString() : "--/--/----"}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 🔹 Transcript Section */}
        <View style={styles.transcriptContainer}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptHeaderText}>Full Transcript</Text>
            <TouchableOpacity onPress={handleCopy} disabled={!transcriptText}>
              <Ionicons name="copy-outline" size={20} color={transcriptText ? "#6366F1" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.transcriptScroll} showsVerticalScrollIndicator={false}>
            {!recordingId ? (
              <View style={styles.centerContainer}>
                <Ionicons name="documents-outline" size={48} color="#9CA3AF" />
                <Text style={styles.statusText}>Select a recording from the menu to view its transcription.</Text>
              </View>
            ) : loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.statusText}>Loading your recording...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : !transcription ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.statusText}>Transcribing your audio... This may take a moment.</Text>
              </View>
            ) : (
              <Text style={styles.transcriptText}>{transcriptText}</Text>
            )}
          </ScrollView>
        </View>

        {/* 🔹 Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, !transcriptText && { opacity: 0.5 }]}
            disabled={!transcriptText}
            onPress={async () => {
              // Log export PDF activity
              await logExportPDF({ format: "pdf" });
              router.push("/meeting/pdfexport");
            }}
          >
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.actionGradient}>
              <Ionicons name="download-outline" size={20} color="#FFF" />
              <Text style={styles.actionText}>Export PDF</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleSidebar}
          >
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.actionGradient}>
              <Ionicons name="time-outline" size={20} color="#FFF" />
              <Text style={styles.actionText}>History</Text>
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
              <Text style={styles.profileName}>SmartScribe History</Text>
              <Text style={styles.profileSubtitle}>Previous Recordings</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={toggleSidebar}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.sidebarContent}>
          <Text style={styles.sidebarSectionTitle}>Your Recordings</Text>

          {Array.isArray(history) && history.length > 0 ? (
            history.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.historyItem,
                  recordingId === item._id && { backgroundColor: "#EEF2FF" },
                ]}
                onPress={() => handleSelectHistory(item._id)}
              >
                <View style={styles.historyIconContainer}>
                  <Ionicons name="document-text" size={20} color="#6366F1" />
                </View>
                <View style={styles.historyTextContainer}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {item.name || "Unnamed Recording"}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {new Date(item.createdAt).toLocaleDateString()} • {item.duration || "0:00"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.statusText}>No recordings found.</Text>
          )}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    paddingVertical: 14,
    gap: 6,
  },
  actionText: { color: "#FFF", fontSize: 13, fontWeight: "600" },

  /* 💬 Floating Chat */
  chatButton: {
    position: "absolute",
    bottom: 120,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 6,
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
    backgroundColor: "#FFFFFF",
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
});
