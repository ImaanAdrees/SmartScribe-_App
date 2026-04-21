import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from 'react-native';
import { useAudioRecorder, AudioModule } from 'expo-audio';
import { logRecordingStarted, logRecordingCompleted, logTranscriptionCreated } from "@/utils/activityLogger";
import { activityAPI } from "@/utils/activityAPI";
import { statsAPI } from "@/utils/statsAPI";
import Reanimated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [showRecordModal, setShowRecordModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;

  // 👤 User state
  const [userName, setUserName] = useState("Guest");
  const [greeting, setGreeting] = useState("Good Evening");

  // ⏱ Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  // 📚 Fetch user data and set greeting
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          setUserName(parsedData.name || "Guest");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();

    // Set greeting based on time of day
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  // Debug: log API_URL and stored token on mount to help mobile networking/auth issues
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('userToken');
        console.log('[DEBUG] API_URL:', API_URL, 'userToken exists:', !!t);
      } catch (e) {
        console.warn('[DEBUG] Failed to read userToken', e);
      }
    })();
  }, []);

  // 🔄 Reload user data whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        try {
          const userData = await AsyncStorage.getItem("userData");
          if (userData) {
            const parsedData = JSON.parse(userData);
            setUserName(parsedData.name || "Guest");
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      };

      loadUserData();
    }, [])
  );

  // 🎞 Modal animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showRecordModal ? 0 : 600,
      duration: 300,
      easing: showRecordModal ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start();

    if (showRecordModal) {
      startTimer();
      logRecordingStarted();
      startAudioRecording();
    } else {
      stopTimer();
      setElapsedTime(0);
      setIsPaused(false);
      unloadRecordingIfAny();
    }

    return () => stopTimer();
  }, [showRecordModal]);

  const [recordingName, setRecordingName] = useState('');
  const [recordingSessionId, setRecordingSessionId] = useState(Date.now());

  // Audio recorder
  const recorder = useAudioRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    ios: {
      extension: '.m4a',
      sampleRate: 44100,
      bitRate: 128000,
    },
    android: {
      extension: '.m4a',
      sampleRate: 44100,
      bitRate: 128000,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
    sessionId: recordingSessionId,
  } as any);

  const startAudioRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission denied', 'Microphone permission is required to record meetings.');
        return;
      }

      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      console.log('[DEBUG] startAudioRecording. URI before record:', recorder.uri);

      try {
        if ('prepareToRecordAsync' in recorder) {
          await (recorder as any).prepareToRecordAsync();
        } else if ('prepareToRecord' in recorder) {
          await (recorder as any).prepareToRecord();
        }
      } catch (prepErr) {
        console.warn('Silent prep error (might be okay if not web)', prepErr);
      }

      recorder.record();
      console.log('[DEBUG] startAudioRecording. URI after record():', recorder.uri);
    } catch (err) {
      console.error('Start recording error', err);
    }
  };

  const pauseAudioRecording = async () => {
    try {
      recorder.pause();
    } catch (err) {
      console.error('Pause recording error', err);
    }
  };

  const resumeAudioRecording = async () => {
    try {
      recorder.record();
    } catch (err) {
      console.error('Resume recording error', err);
    }
  };

  const unloadRecordingIfAny = async () => {
    try {
      if (recorder.isRecording) {
        recorder.stop();
      }
    } catch (err) {
      console.error('Unload recording error', err);
    }
  };

  const uploadRecording = async (uri: string | null, durationStr: string, name?: string) => {
    if (!uri) return null;
    try {
      const uploadUrl = `${API_URL}/api/recording/upload`;
      console.log('[DEBUG] Starting upload to:', uploadUrl);
      console.log('[DEBUG] Recording name:', name, 'Duration:', durationStr);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('No auth token found before upload');
        Alert.alert('Not signed in', 'Please sign in to upload recordings.');
        return { success: false, error: 'No auth token' };
      }
      const form = new FormData();
      const rawFilename = uri.split('/').pop() || `recording-${Date.now()}`;
      const filename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.m4a`;

      let normalizedUri = uri;
      if (Platform.OS !== 'web' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
        normalizedUri = `file://${uri}`;
        console.log('[DEBUG] Normalized URI for upload:', normalizedUri);
      }

      if (Platform.OS === 'web' && uri.startsWith('blob:')) {
        try {
          const blob = await fetch(uri).then((r) => r.blob());
          form.append('audio', blob, filename);
        } catch (e) {
          console.warn('Failed to fetch blob from URI', e);
          return { success: false, error: 'Failed to read recorded audio' };
        }
      } else {
        form.append('audio', {
          uri: normalizedUri,
          name: filename,
          type: 'audio/m4a',
        } as any);
      }
      form.append('duration', durationStr);
      if (name) form.append('name', name);

      console.log('[DEBUG] Sending fetch request...');
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      console.log('[DEBUG] Fetch response received. Status:', res.status);
      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        console.warn('Upload response not JSON', e);
      }
      console.log('uploadRecording status', res.status, 'body', json);
      if (res.ok && json && json.success) {
        Alert.alert('Upload', 'Recording uploaded successfully');
        try {
          DeviceEventEmitter.emit('recordingUploaded', { recording: json.recording });
        } catch (e) {
          // ignore
        }
        try { setRecordingName(''); } catch (e) { }
      } else {
        const errMsg = (json && json.error) || `HTTP ${res.status}`;
        console.warn('Upload failed response', res.status, json);
        Alert.alert('Upload failed', errMsg || 'Unknown error');
      }
      return json;
    } catch (err) {
      console.error('Upload error', err);
      if (err instanceof TypeError && err.message === 'Network request failed') {
        console.error('[DEBUG] Possible causes: Server unreachable, incorrect IP, or CORS blocked.');
      }
      throw err;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      startTimer();
      resumeAudioRecording();
    } else {
      stopTimer();
      pauseAudioRecording();
    }
    setIsPaused((prev) => !prev);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Recent activities state
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  // Stats state
  const [stats, setStats] = useState({ recordings: 0, transcriptions: 0, summaries: 0 });

  // Fetch stats and activities
  const fetchStatsAndActivities = async () => {
    const [statsRes, activitiesRes] = await Promise.all([
      statsAPI.getUserStats(),
      activityAPI.getRecent(),
    ]);
    if (statsRes.success) setStats(statsRes.stats);
    if (activitiesRes.success) setRecentActivities(activitiesRes.activities || []);
  };

  useEffect(() => {
    fetchStatsAndActivities();
    const interval = setInterval(fetchStatsAndActivities, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStopRecording = () => {
    stopTimer();

    (async () => {
      try {
        const startUri = recorder.uri;
        console.log('[DEBUG] Stopping recording. isRecording:', recorder.isRecording, 'Start URI:', startUri);

        if (recorder.isRecording) {
          await (recorder.stop() as any);
        }

        let uri = recorder.uri;
        let attempts = 0;
        const maxAttempts = Platform.OS === 'web' ? 15 : 5;

        while ((!uri || uri === startUri) && attempts < maxAttempts) {
          console.log('[DEBUG] Waiting for fresh URI... attempt', attempts, 'Current URI:', uri);
          await new Promise(resolve => setTimeout(resolve, 200));
          uri = recorder.uri;
          attempts++;
        }

        console.log('[DEBUG] Final recording URI for upload:', uri);

        if (uri) {
          const durationStr = formatTime(elapsedTime);
          const uploadRes = await uploadRecording(uri, durationStr, recordingName || undefined);
          if (uploadRes && uploadRes.success && uploadRes.recording) {
            const recordingId = uploadRes.recording._id;

            try {
              const token = await AsyncStorage.getItem('userToken');
              fetch(`${API_URL}/api/recording/${recordingId}/transcribe`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }).catch(err => console.error('Background transcription trigger failed', err));

              setShowRecordModal(false);
              setRecordingName('');
              router.push({
                pathname: "/(tabs)/transcription",
                params: { recordingId },
              });
              return;
            } catch (transErr) {
              console.error('Failed to trigger transcription', transErr);
            }
          } else {
            console.warn('Upload failed', uploadRes);
          }
        } else {
          console.warn('No recording URI found after stop and wait attempts');
        }
      } catch (err) {
        console.error('Stop/upload error', err);
      } finally {
        setRecordingSessionId(Date.now());
      }

      logRecordingCompleted({ duration: formatTime(elapsedTime) });
      logTranscriptionCreated({ recordingDuration: formatTime(elapsedTime) });

      setShowRecordModal(false);
      setRecordingName('');
      router.push("/(tabs)/transcription");
    })();
  };

  const quickActions = [
    { title: "Transcriptions", icon: "document-text-outline", color: "#6366F1", route: "/(tabs)/transcription", count: "transcription", iconType: "Ionicons" },
    { title: "Summaries", icon: "text-box-check-outline", color: "#8B5CF6", route: "/(tabs)/summary", count: "View & edit", iconType: "MaterialCommunityIcons" },
    { title: "Recordings", icon: "mic", color: "#A855F7", route: "/(tabs)/recordings", count: "View & edit", iconType: "Ionicons" },
  ];

  const getStatusConfig = (status: string) => {
    switch(status) {
      case "Summarized":
        return { bg: "#DCFCE7", color: "#16A34A", icon: "checkmark-circle" };
      case "Transcribed":
        return { bg: "#E0E7FF", color: "#4F46E5", icon: "text" };
      default:
        return { bg: "#F3E8FF", color: "#7E22CE", icon: "mic" };
    }
  };

  // (Removed: stats useEffect, now handled by fetchStatsAndActivities)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* 🌅 Header Gradient */}
        <LinearGradient 
          colors={["#6366F1", "#4F46E5", "#1E3A8A"]} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative Elements */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.decorCircle3} />
          
          <View style={styles.greetingContainer}>
            <Reanimated.View entering={FadeInDown.delay(100).springify()}>
              <Text style={styles.greetingText}>{greeting},</Text>
              <Text style={styles.userNameText}>{userName} 👋</Text>
            </Reanimated.View>
            <Reanimated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={styles.subGreeting}>Ready to capture your next great idea?</Text>
            </Reanimated.View>
          </View>

          {/* 🎙 Mic Button */}
          <Reanimated.View entering={FadeInUp.delay(300).springify()} style={styles.micContainer}>
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => { setRecordingName(''); setShowRecordModal(true); }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#FFFFFF", "#F3F4F6"]}
                style={styles.micButtonGradient}
              >
                <Ionicons name="mic" size={48} color="#4F46E5" />
              </LinearGradient>
              <View style={styles.pulseRing} />
            </TouchableOpacity>
            <Text style={styles.tapText}>Tap to start recording</Text>
          </Reanimated.View>
        </LinearGradient>

        {/* 📁 Quick Access Cards */}
        <Reanimated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            {/* <Text style={styles.sectionSubtitle}>Your recent activities</Text> */}
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
          >
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.card}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[action.color, `${action.color}CC`]}
                  style={styles.cardIconBg}
                >
                  {action.iconType === "MaterialCommunityIcons" ? (
                    <MaterialCommunityIcons name={action.icon as any} size={28} color="#FFF" />
                  ) : (
                    <Ionicons name={action.icon as any} size={28} color="#FFF" />
                  )}
                </LinearGradient>
                <Text style={styles.cardTitle}>{action.title}</Text>
                <Text style={styles.cardSubtitle}>{action.count}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Reanimated.View>

        {/* 📜 Recent Activities */}
        <Reanimated.View entering={FadeInDown.delay(500).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
           
          </View>

          {recentActivities.map((item, index) => {
            // Map backend action to UI status and icon
            let status = "Recorded", icon = "mic", color = "#7E22CE", bg = "#F3E8FF";
            if (item.action === "Summary Generated") {
              status = "Summarized"; icon = "checkmark-circle"; color = "#16A34A"; bg = "#DCFCE7";
            } else if (item.action === "Transcription Created") {
              status = "Transcribed"; icon = "text"; color = "#4F46E5"; bg = "#E0E7FF";
            }
            // Try to get meeting/recording name and duration from metadata or description
            const title = item.metadata?.title || item.metadata?.recordingName || status;
            const duration = item.metadata?.duration || item.metadata?.recordingDuration || "";
            const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "";
            return (
              <TouchableOpacity key={item._id} activeOpacity={0.7}>
                <LinearGradient
                  colors={["#FFFFFF", "#F9FAFB"]}
                  style={styles.listItem}
                >
                  <View style={styles.listLeft}>
                    <View style={[styles.listIcon, { backgroundColor: `${color}15` }]}> 
                      <Ionicons name={icon as any} size={20} color={color} />
                    </View>
                    <View>
                      <Text style={styles.listTitle}>{title}</Text>
                      <Text style={styles.listSubtitle}>
                        {duration} • {date}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: bg }]}> 
                    <Text style={[styles.statusText, { color }]}> 
                      {status}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </Reanimated.View>

        {/* Stats Section */}
        <Reanimated.View entering={FadeInDown.delay(600).springify()} style={styles.statsContainer}>
          <LinearGradient colors={["#EEF2FF", "#E0E7FF"]} style={styles.statCard}>
            <MaterialCommunityIcons name="microphone" size={24} color="#4F46E5" />
            <Text style={styles.statNumber}>{stats.recordings}</Text>
            <Text style={styles.statLabel}>Total Recordings</Text>
          </LinearGradient>
          <LinearGradient colors={["#F3E8FF", "#E9D5FF"]} style={styles.statCard}>
            <Ionicons name="document-text" size={24} color="#8B5CF6" />
            <Text style={styles.statNumber}>{stats.transcriptions}</Text>
            <Text style={styles.statLabel}>Transcriptions</Text>
          </LinearGradient>
          <LinearGradient colors={["#DCFCE7", "#BBF7D0"]} style={styles.statCard}>
            <MaterialCommunityIcons name="text-box-check-outline" size={24} color="#16A34A" />
            <Text style={styles.statNumber}>{stats.summaries}</Text>
            <Text style={styles.statLabel}>Summaries</Text>
          </LinearGradient>
        </Reanimated.View>
      </ScrollView>


      {/* 🎞 Recording Modal */}
      <Modal transparent visible={showRecordModal} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
              colors={["#6366F1", "#4F46E5"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>RECORDING</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => { setShowRecordModal(false); setRecordingName(''); }}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Recording name (optional)"
                placeholderTextColor="#C7D2FE"
                value={recordingName}
                onChangeText={setRecordingName}
                style={styles.recordingNameInput}
              />

              <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.controlButton, styles.pauseButton]}
                  onPress={handlePauseToggle}
                >
                  <Ionicons
                    name={isPaused ? "play" : "pause"}
                    size={32}
                    color="#FFF"
                  />
                  <Text style={styles.controlLabel}>{isPaused ? "Resume" : "Pause"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, styles.stopButton]}
                  onPress={handleStopRecording}
                >
                  <Ionicons name="square" size={28} color="#FFF" />
                  <Text style={styles.controlLabel}>Stop</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.waveformContainer}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        height: 20 + Math.sin(Date.now() / 200 + i) * 15,
                      }
                    ]}
                  />
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  headerGradient: {
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    position: "relative",
  },
  decorCircle1: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  decorCircle3: {
    position: "absolute",
    top: "40%",
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  greetingContainer: { paddingHorizontal: 24, marginTop: 40 },
  greetingText: { color: "#C7D2FE", fontSize: 16, fontWeight: "500", marginBottom: 4 },
  userNameText: { color: "#FFF", fontSize: 32, fontWeight: "700", marginBottom: 8 },
  subGreeting: { color: "#E0E7FF", fontSize: 14, marginTop: 4, opacity: 0.9 },
  micContainer: { alignItems: "center", marginTop: 40 },
  micButton: {
    position: "relative",
  },
  micButtonGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    top: -10,
    left: -10,
  },
  tapText: { color: "#E0E7FF", marginTop: 16, fontSize: 14, fontWeight: "500" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  sectionSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  seeAllText: { fontSize: 13, color: "#6366F1", fontWeight: "600" },
  cardsContainer: { paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  card: {
    width: 140,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    alignItems: "center",
  },
  cardIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1F2937", marginTop: 4 },
  cardSubtitle: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  listTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 2 },
  listSubtitle: { fontSize: 13, color: "#6B7280" },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "600" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  statLabel: { fontSize: 11, color: "#6B7280", fontWeight: "500" },
  chatButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    elevation: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  chatButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  modalGradient: {
    padding: 24,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  recordingText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingNameInput: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: "#FFF",
    marginBottom: 20,
    textAlign: "center",
  },
  timerText: { fontSize: 48, fontWeight: "700", color: "#FFF", marginBottom: 30, fontVariant: ["tabular-nums"] },
  buttonRow: { flexDirection: "row", justifyContent: "space-evenly", width: "100%", gap: 16, marginBottom: 30 },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    flex: 1,
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
  },
  pauseButton: { backgroundColor: "#3B82F6" },
  stopButton: { backgroundColor: "#EF4444" },
  controlLabel: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});