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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import API_URL from "@/utils/api";
import { DeviceEventEmitter } from 'react-native';
import { useAudioRecorder, AudioModule, RecordingOptions } from 'expo-audio';
import { logRecordingStarted, logRecordingCompleted, logTranscriptionCreated } from "@/utils/activityLogger";

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
      // Log recording started activity
      logRecordingStarted();
      startAudioRecording();
    } else {
      stopTimer();
      setElapsedTime(0);
      setIsPaused(false);
      // if modal closed without saving, unload any active recording
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
    // Adding a session ID here forces the hook to recreate the recorder for each new session
    // because useAudioRecorder uses JSON.stringify(options) as a dependency.
    sessionId: recordingSessionId,
  } as any);

  const startAudioRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission denied', 'Microphone permission is required to record meetings.');
        return;
      }

      // In expo-audio, setAudioModeAsync is on AudioModule
      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      // LOG: Check URI before starting
      console.log('[DEBUG] startAudioRecording. URI before record:', recorder.uri);

      // Web requires explicit preparation. Try with or without 'Async' as per docs/logs.
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

      // LOG: URI right after record() might update on some platforms
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

      // Normalize URI for native platforms - IMPORTANT: fetch on Android needs file:// prefix
      let normalizedUri = uri;
      if (Platform.OS !== 'web' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
        normalizedUri = `file://${uri}`;
        console.log('[DEBUG] Normalized URI for upload:', normalizedUri);
      }

      // Handle browser blob URIs vs native file URIs
      if (Platform.OS === 'web' && uri.startsWith('blob:')) {
        try {
          const blob = await fetch(uri).then((r) => r.blob());
          // In browsers, append the Blob directly with filename
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
        // Emit event so other screens (e.g., Recordings) can refresh in real-time
        try {
          DeviceEventEmitter.emit('recordingUploaded', { recording: json.recording });
        } catch (e) {
          // ignore
        }
        // clear the name input after successful save
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
      throw err; // Re-throw to be caught by the caller
    }
  };

  // 🧠 Handle timer start / stop
  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ⏸ Pause or resume recording
  const handlePauseToggle = () => {
    if (isPaused) {
      // resume
      startTimer();
      resumeAudioRecording();
    } else {
      // pause
      stopTimer();
      pauseAudioRecording();
    }
    setIsPaused((prev) => !prev);
  };

  // ⏳ Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 📄 Dummy transcription data
  const transcriptions = [
    { id: "1", title: "Marketing Sync", duration: "35 min", date: "2023-10-15", status: "Summarized" },
    { id: "2", title: "Lecture: AI Ethics", duration: "1 hr 20 min", date: "2023-10-12", status: "Transcribed" },
    { id: "3", title: "Client Onboarding Call", duration: "32 min", date: "2023-10-10", status: "Recorded" },
  ];

  // 🟥 Stop Recording
  const handleStopRecording = () => {
    stopTimer();

    // Stop & upload audio
    (async () => {
      try {
        const startUri = recorder.uri;
        console.log('[DEBUG] Stopping recording. isRecording:', recorder.isRecording, 'Start URI:', startUri);

        if (recorder.isRecording) {
          // stop() returns a Promise<void> on web and some native platforms
          await (recorder.stop() as any);
        }

        // Finalize URI - some platforms take a moment to update the URI after stop
        let uri = recorder.uri;

        // On ALL platforms, if we had a previous URI, we MUST wait for a new one or at least wait for finalization
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

            // Trigger transcription in the backend
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
              return; // Exit here as we handled navigation
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
        // Reset session ID to ensure a clean recorder for the next session
        setRecordingSessionId(Date.now());
      }

      // Log recording completion with duration
      logRecordingCompleted({ duration: formatTime(elapsedTime) });

      // Log transcription creation
      logTranscriptionCreated({ recordingDuration: formatTime(elapsedTime) });

      setShowRecordModal(false);
      setRecordingName('');
      router.push("/(tabs)/transcription");
    })();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🌅 Header Gradient (now just for greeting/mic) */}
      <LinearGradient colors={["#4F46E5", "#1E3A8A"]} style={styles.headerGradient}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{greeting}, {userName} 👋</Text>
          <Text style={styles.subGreeting}>Ready to start your next meeting?</Text>
        </View>

        {/* 🎙 Mic Button */}
        <View style={styles.micContainer}>
          <TouchableOpacity
            style={styles.micButton}
            onPress={() => { setRecordingName(''); setShowRecordModal(true); }}
            activeOpacity={0.7}
          >
            <Ionicons name="mic-outline" size={42} color="#4F46E5" />
          </TouchableOpacity>
          <Text style={styles.tapText}>Tap to record your next meeting or lecture</Text>
        </View>
      </LinearGradient>

      {/* 📁 Quick Access Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,  // ⬅️ adds top & bottom margin for cards
        }}
        style={{ marginTop: 20, marginBottom: 10, }}
      >
        <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/transcription")}>
          <Ionicons name="document-text-outline" size={26} color="#4F46E5" />
          <Text style={styles.cardTitle}>My Transcriptions</Text>
          <Text style={styles.cardSubtitle}>3 saved meetings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/summary")}>
          <MaterialCommunityIcons
            name="calendar-clock-outline"
            size={26}
            color="#4F46E5"
          />
          <Text style={styles.cardTitle}>Summaries</Text>
          <Text style={styles.cardSubtitle}>View & edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/recordings")}>
          <MaterialCommunityIcons
            name="microphone-outline"
            size={26}
            color="#4F46E5"
          />
          <Text style={styles.cardTitle}>Saved Recordings</Text>
          <Text style={styles.cardSubtitle}>View & edit</Text>
        </TouchableOpacity>
      </ScrollView>


      {/* 📜 Recent Transcriptions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transcriptions</Text>
      </View>

      <FlatList
        data={transcriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.listLeft}>
              <Text style={styles.listTitle}>{item.title}</Text>
              <Text style={styles.listSubtitle}>
                {item.duration} • {item.date}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === "Summarized"
                      ? "#DCFCE7"
                      : item.status === "Transcribed"
                        ? "#E0E7FF"
                        : "#F3E8FF",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === "Summarized"
                        ? "#16A34A"
                        : item.status === "Transcribed"
                          ? "#4F46E5"
                          : "#7E22CE",
                  },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* 💬 Floating Chat */}
      <TouchableOpacity style={styles.chatButton} onPress={() => router.push("/meeting/smartsearch")}>
        <Ionicons name="chatbubbles-outline" size={26} color="#FFF" />
      </TouchableOpacity>

      {/* 🎞 Recording Modal */}
      <Modal transparent visible={showRecordModal} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.modalTitle}>Recording in Progress 🎙️</Text>

            <TextInput
              placeholder="Recording name (optional)"
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
                  name={isPaused ? "play-outline" : "pause-outline"}
                  size={32}
                  color="#FFF"
                />
                <Text style={styles.controlLabel}>{isPaused ? "Resume" : "Pause"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={handleStopRecording}
              >
                <Ionicons name="stop-outline" size={32} color="#FFF" />
                <Text style={styles.controlLabel}>Stop</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => { setShowRecordModal(false); setRecordingName(''); }}
            >
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 35,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  profileIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingContainer: { paddingHorizontal: 50, marginTop: 20 },
  greetingText: { color: "#FFF", fontSize: 20, fontWeight: "600" },
  subGreeting: { color: "#E0E7FF", marginTop: 4 },
  micContainer: { alignItems: "center", marginTop: 30 },
  micButton: {
    backgroundColor: "#ffffffff",
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.2)",
  },
  tapText: { color: "#E0E7FF", marginTop: 10, fontSize: 13 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginTop: 20,
  },
  card: {
    width: 150,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    elevation: 3,
    alignItems: "center",
  },
  cardTitle: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginTop: 6,
  },
  cardSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  sectionHeader: { paddingHorizontal: 16, marginTop: 10, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  listLeft: { flex: 1 },
  listTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  listSubtitle: { fontSize: 13, color: "#6B7280" },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  statusText: { fontSize: 13, fontWeight: "600" },
  chatButton: {
    backgroundColor: "#6D28D9",
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 40,
    right: 22,
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.2)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 10 },
  timerText: { fontSize: 26, fontWeight: "700", color: "#6D28D9", marginBottom: 20 },
  recordingNameInput: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-evenly", width: "100%" },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    width: "40%",
    borderRadius: 12,
  },
  pauseButton: { backgroundColor: "#2196F3" },
  stopButton: { backgroundColor: "#DC2626" },
  controlLabel: { color: "#FFF", marginTop: 4, fontSize: 14, fontWeight: "600" },
  closeButton: { marginTop: 16, backgroundColor: "#6D28D9", padding: 10, borderRadius: 30 },
});