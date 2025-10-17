import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HomeScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>SmartScribe</Text>
        <Image
          source={{ uri: "https://via.placeholder.com/40" }}
          style={styles.avatar}
        />
      </View>

      {/* Greeting */}
      <View style={styles.greetingCard}>
        <Text style={styles.greetingText}>
          Hi Imaan 👋{"\n"}
          <Text style={styles.greetingSub}>Ready to make your meetings smarter?</Text>
        </Text>
      </View>

      {/* Feature Grid */}
      <View style={styles.grid}>
        <FeatureCard
          icon="mic-outline"
          title="Record Meeting"
          description="Capture every word with AI transcription."
        />
        <FeatureCard
          icon="document-text-outline"
          title="View Transcriptions"
          description="Access past meeting notes and summaries."
        />
        <FeatureCard
          icon="search-outline"
          title="Smart Search"
          description="Find key moments in your meeting archives."
        />
        <FeatureCard
          icon="reader-outline"
          title="Summary Generator"
          description="Get AI-powered summaries of your sessions."
        />
        <FeatureCard
          icon="settings-outline"
          title="Profile & Settings"
          description="Manage your account and app preferences."
        />
      </View>

      {/* Chart Section */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Minutes recorded this week</Text>
        <View style={styles.chartBars}>
          {[
            { day: "Mon", height: 80 },
            { day: "Tue", height: 130 },
            { day: "Wed", height: 200 },
            { day: "Thu", height: 160 },
            { day: "Fri", height: 110 },
            { day: "Sat", height: 50 },
          ].map((bar, i) => (
            <View key={i} style={styles.barItem}>
              <View style={[styles.bar, { height: bar.height }]} />
              <Text style={styles.barLabel}>{bar.day}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

/* ---------- Feature Card Component ---------- */
const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) => (
  <View style={styles.card}>
    <Ionicons name={icon} size={24} color="#1E3A8A" />
    <View style={{ flex: 1 }}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>{description}</Text>
    </View>
  </View>
);

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brand: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  greetingCard: {
    backgroundColor: "rgba(96,165,250,0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 16,
    color: "#1E3A8A",
    fontWeight: "600",
    lineHeight: 22,
  },
  greetingSub: {
    color: "#334155",
    fontWeight: "400",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#f8fafc",
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontWeight: "700",
    color: "#1E3A8A",
    fontSize: 14,
  },
  cardText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 220,
    marginTop: 8,
  },
  barItem: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 6,
    backgroundColor: "#1E3A8A",
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
});

export default HomeScreen;
