import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const WelcomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Logo Circle */}
      <View style={styles.logo}>
        <Image
          source={require("../../assets/images/mainlogo.png")} // 👈 update path based on your folder structure
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Title + Subtitle */}
      <Text style={styles.title}>SmartScribe</Text>
      <Text style={styles.subtitle}>Your AI Meeting Partner</Text>
      <Text style={styles.description}>
        Record, transcribe, and summarize meetings with AI
      </Text>

      {/* Buttons */}
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={() => router.push("/auth/signup")}
      >
        <Ionicons name="person-add-outline" size={20} color="#FFF" />
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          Get Started
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => router.push("/auth/login")}
      >
        <Ionicons name="log-in-outline" size={20} color="#4B5563" />
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          Login
        </Text>
      </TouchableOpacity>

      {/* Features */}
      <View style={styles.featuresRow}>
        <FeatureDot color="#22c55e" label="Record Meetings" />
        <FeatureDot color="#3b82f6" label="Secure Storage" />
        <FeatureDot color="#8b5cf6" label="AI Powered" />
      </View>
    </View>
  );
};

/* -------- Small reusable dot item -------- */
const FeatureDot = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.featureItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={styles.featureText}>{label}</Text>
  </View>
);

/* -------- Styles -------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#ffffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.15)",
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E3A8A",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 8,
  },
  description: {
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#4F46E5",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  primaryButtonText: {
    color: "#FFF",
  },
  secondaryButtonText: {
    color: "#4B5563",
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  featureText: {
    fontSize: 12,
    color: "#6B7280",
  },
});

export default WelcomeScreen;
