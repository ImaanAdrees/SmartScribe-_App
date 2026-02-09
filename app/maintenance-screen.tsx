import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import API_URL from "@/utils/api";

const logo = require("../assets/images/mainlogo.png");

const MaintenancePage = () => {
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  const checkMaintenanceStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/maintenance/check-maintenance`);
      const data = await response.json();
      setMaintenanceData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error checking maintenance status:", error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkMaintenanceStatus();
    setRefreshing(false);
  };

  useEffect(() => {
    checkMaintenanceStatus();
    // Check every 30 seconds to see if maintenance is over
    const interval = setInterval(checkMaintenanceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </ThemedView>
    );
  }

  if (!maintenanceData?.maintenanceMode) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <ThemedText style={styles.title}>System Status</ThemedText>
        <Text style={[styles.message, { color: textColor }]}>
          The system is operating normally. No maintenance in progress.
        </Text>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: "#ffffff" }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.maintenanceContainer}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Maintenance Title */}
        <ThemedText style={styles.maintenanceTitle}>System Update</ThemedText>

        {/* Maintenance Message */}
        <Text style={styles.maintenanceMessage}>
          {maintenanceData?.maintenanceMessage ||
            "We're currently improving your experience. Please check back soon."}
        </Text>

        {/* Status Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={styles.infoValue}>In Progress</Text>
        </View>

        {/* What's happening */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>What's Changing?</ThemedText>
          <Text style={styles.sectionText}>
            SmartScribe is getting a tune-up! We're deploying updates to enhance performance,
            security, and reliability.
          </Text>
        </View>

        {/* Expected duration */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Expected Duration</ThemedText>
          <Text style={styles.sectionText}>
            Maintenance typically lasts 1-4 hours. We appreciate your patience.
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>While You Wait:</ThemedText>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Check back in a few minutes</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Visit our website for updates</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Contact support for urgent issues</Text>
          </View>
        </View>

        {/* Refresh Button Info */}
        <View style={styles.refreshInfo}>
          <Text style={styles.refreshText}>
            Auto-refreshing every 30 seconds...
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  contentContainer: {
    padding: 24,
    justifyContent: "center",
    flexGrow: 1,
  },
  maintenanceContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  maintenanceTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
    color: "#1e3a8a", // Dark blue
    letterSpacing: 0.5,
  },
  maintenanceMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#4b5563", // Cool gray
    lineHeight: 24,
    maxWidth: "90%",
  },
  infoBox: {
    backgroundColor: "#eff6ff", // Blue 50
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbeafe", // Blue 100
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    color: "#6b7280", // Gray 500
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb", // Blue 600
  },
  section: {
    marginBottom: 28,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1e3a8a", // Dark blue
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4b5563",
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: 16,
    color: "#2563eb",
    marginRight: 10,
    marginTop: -2,
  },
  bulletText: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    flex: 1,
  },
  refreshInfo: {
    marginTop: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6", // Gray 100
    width: "100%",
  },
  refreshText: {
    fontSize: 13,
    textAlign: "center",
    color: "#9ca3af", // Gray 400
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  }
});

export default MaintenancePage;
