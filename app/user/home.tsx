import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const HomeScreen: React.FC = () => {
  const transcriptions = [
    {
      id: "1",
      title: "Marketing Sync",
      duration: "35 min",
      date: "2023-10-15",
      status: "Summarized",
    },
    {
      id: "2",
      title: "Lecture: AI Ethics",
      duration: "1 hr 20 min",
      date: "2023-10-12",
      status: "Transcribed",
    },
    {
      id: "3",
      title: "Client Onboarding Call",
      duration: "32 min",
      date: "2023-10-10",
      status: "Recorded",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 🌅 Header Section */}
      <LinearGradient
        colors={["#4F46E5", "#1E3A8A"]}
        style={styles.headerGradient}
      >
        {/* Header Top Row */}
        <View style={styles.headerTop}>
          {/* Empty view to balance layout */}
          <View style={{ width: 40 }} />

          {/* Center title */}
          <Text style={styles.headerTitle}>SmartScribe</Text>

          {/* Profile icon right aligned */}
          <TouchableOpacity style={styles.profileIcon}>
            <Ionicons name="person-circle-outline" size={42} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Good Afternoon, Imaan 👋</Text>
          <Text style={styles.subGreeting}>
            Ready to start your next meeting?
          </Text>
        </View>

        {/* Microphone */}
        <View style={styles.micContainer}>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic-outline" size={42} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.tapText}>
            Tap to record your next meeting or lecture
          </Text>
        </View>
      </LinearGradient>

      {/* 📁 Quick Access Cards */}
      <View style={styles.cardRow}>
        <TouchableOpacity style={styles.card}>
          <Ionicons name="document-text-outline" size={26} color="#4F46E5" />
          <Text style={styles.cardTitle}>My Transcriptions</Text>
          <Text style={styles.cardSubtitle}>3 saved meetings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <MaterialCommunityIcons
            name="calendar-clock-outline"
            size={26}
            color="#4F46E5"
          />
          <Text style={styles.cardTitle}>Meetings</Text>
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
      {/* 💬 Floating Chat Button */}
      <TouchableOpacity style={styles.chatButton}>
        <Ionicons name="chatbubbles-outline" size={26} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerGradient: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  profileIcon: {
    alignSelf: "flex-end",
    borderRadius: 30,
    overflow: "hidden",
  },
  greetingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  greetingText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  subGreeting: {
    color: "#E0E7FF",
    fontSize: 13,
    marginTop: 4,
  },
  micContainer: {
    alignItems: "center",
    marginTop: 25,
  },
  micButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  tapText: {
    color: "#E0E7FF",
    fontSize: 12,
    marginTop: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 16,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A8A",
    marginTop: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  sectionHeader: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  listLeft: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  listSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chatButton: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#4F46E5",
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
});
