import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const ExportScreen = () => {
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeActionItems, setIncludeActionItems] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [selectedMeetings, setSelectedMeetings] = useState(["meeting1"]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const meetings = [
    { id: "meeting1", title: "Weekly Sync", date: "Oct 22, 2025", duration: "45 min" },
    { id: "meeting2", title: "Sprint Planning", date: "Oct 20, 2025", duration: "60 min" },
    { id: "meeting3", title: "Client Review", date: "Oct 18, 2025", duration: "30 min" },
    { id: "meeting4", title: "UI Update", date: "Oct 15, 2025", duration: "45 min" },
  ];

  const toggleMeetingSelection = (id) => {
    if (selectedMeetings.includes(id)) {
      setSelectedMeetings(selectedMeetings.filter((m) => m !== id));
    } else {
      setSelectedMeetings([...selectedMeetings, id]);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 2500);
    }, 2000);
  };

  return (
    <LinearGradient colors={["#EEF2FF", "#F9FAFB"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>

        <LinearGradient
          colors={["#6366F1", "#8B5CF6"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>📤</Text>
            <View>
              <Text style={styles.headerTitle}>Export Transcriptions</Text>
              <Text style={styles.headerSubtitle}>Choose format and options</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Format Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Export Format</Text>
          
          <View style={styles.formatContainer}>
            <TouchableOpacity
              style={[
                styles.formatCard,
                selectedFormat === "pdf" && styles.formatCardActive,
              ]}
              onPress={() => setSelectedFormat("pdf")}
            >
              <View style={styles.formatIconContainer}>
                <Ionicons 
                  name="document-text" 
                  size={28} 
                  color={selectedFormat === "pdf" ? "#6366F1" : "#6B7280"} 
                />
              </View>
              <Text style={[
                styles.formatTitle,
                selectedFormat === "pdf" && styles.formatTitleActive,
              ]}>
                PDF
              </Text>
              <Text style={styles.formatDescription}>
                Professional document format
              </Text>
              {selectedFormat === "pdf" && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatCard,
                selectedFormat === "txt" && styles.formatCardActive,
              ]}
              onPress={() => setSelectedFormat("txt")}
            >
              <View style={styles.formatIconContainer}>
                <Ionicons 
                  name="document-outline" 
                  size={28} 
                  color={selectedFormat === "txt" ? "#6366F1" : "#6B7280"} 
                />
              </View>
              <Text style={[
                styles.formatTitle,
                selectedFormat === "txt" && styles.formatTitleActive,
              ]}>
                TXT
              </Text>
              <Text style={styles.formatDescription}>
                Plain text format
              </Text>
              {selectedFormat === "txt" && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Summary */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 Export Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Format:</Text>
              <Text style={styles.summaryValue}>{selectedFormat.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Export Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.exportButton,
            selectedMeetings.length === 0 && styles.exportButtonDisabled,
          ]}
          onPress={handleExport}
          disabled={selectedMeetings.length === 0 || isExporting}
        >
          <LinearGradient
            colors={
              selectedMeetings.length === 0
                ? ["#D1D5DB", "#D1D5DB"]
                : ["#10B981", "#059669"]
            }
            style={styles.exportGradient}
          >
            {isExporting ? (
              <>
                <Text style={styles.exportText}>Exporting...</Text>
              </>
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#FFF" />
                <Text style={styles.exportText}>Export {selectedFormat.toUpperCase()}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Export Successful!</Text>
            <Text style={styles.successMessage}>
              Your {selectedFormat.toUpperCase()} file has been saved to downloads
            </Text>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default ExportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#6366F1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 36,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#E5E7EB",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  formatContainer: {
    flexDirection: "row",
    gap: 12,
  },
  formatCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    position: "relative",
  },
  formatCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "#F5F3FF",
  },
  formatIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 4,
  },
  formatTitleActive: {
    color: "#6366F1",
  },
  formatDescription: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  optionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  meetingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  meetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  meetingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  meetingMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  summaryCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F46E5",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#F3F4F6",
  },
  exportButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  exportText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "80%",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});