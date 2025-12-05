import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [showRecordModal, setShowRecordModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;

  // ⏱ Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    } else {
      stopTimer();
      setElapsedTime(0);
      setIsPaused(false);
    }

    return () => stopTimer();
  }, [showRecordModal]);

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
    } else {
      // pause
      stopTimer();
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
    setShowRecordModal(false);
    router.push({
      pathname: "/meeting/transcption",
      params: { duration: formatTime(elapsedTime) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🌅 Header */}
      <LinearGradient colors={["#4F46E5", "#1E3A8A"]} style={styles.headerGradient}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>SmartScribe</Text>
          <TouchableOpacity style={styles.profileIcon} onPress={() => router.push("/user/profile")}>
            <Ionicons name="person-circle-outline" size={42} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Good Afternoon, Imaan 👋</Text>
          <Text style={styles.subGreeting}>Ready to start your next meeting?</Text>
        </View>

        {/* 🎙 Mic Button */}
        <View style={styles.micContainer}>
          <TouchableOpacity
            style={styles.micButton}
            onPress={() => setShowRecordModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="mic-outline" size={42} color="#4F46E5" />
          </TouchableOpacity>
          <Text style={styles.tapText}>Tap to record your next meeting or lecture</Text>
        </View>
      </LinearGradient>

      {/* 📁 Quick Access */}
      <View style={styles.cardRow}>
        <TouchableOpacity style={styles.card} onPress={() => router.push("/meeting/transcption")}>
          <Ionicons name="document-text-outline" size={26} color="#4F46E5" />
          <Text style={styles.cardTitle}>My Transcriptions</Text>
          <Text style={styles.cardSubtitle}>3 saved meetings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/meeting/summary")}>
          <MaterialCommunityIcons name="calendar-clock-outline" size={26} color="#4F46E5" />
          <Text style={styles.cardTitle}>summaries</Text>
          <Text style={styles.cardSubtitle}>View & edit</Text>
        </TouchableOpacity>
      </View>

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
              onPress={() => setShowRecordModal(false)}
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
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  tapText: { color: "#E0E7FF", marginTop: 10, fontSize: 13 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "45%",
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginTop: 6,
  },
  cardSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  sectionHeader: { paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
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
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
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