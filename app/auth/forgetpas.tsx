import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "../../utils/api";
import { showToast } from "../../utils/ToastHelper";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await authAPI.sendForgotPasswordOtp(normalizedEmail);
      if (!result.success) {
        const errorMessage = (result.error || "").toLowerCase();
        if (
          result.status === 404 ||
          errorMessage.includes("email does not exist") ||
          errorMessage.includes("not found")
        ) {
          Alert.alert("Invalid Email", "Email does not exist");
          showToast("error", "Invalid Email", "Email does not exist");
        } else if (
          result.status === 0 ||
          errorMessage.includes("fail to fetch") ||
          errorMessage.includes("failed to fetch")
        ) {
          Alert.alert("Server Error", "Unable to reach backend. Please try again.");
          showToast("error", "Server Error", "Unable to reach backend. Please try again.");
        } else {
          Alert.alert("Error", result.error || "Failed to send reset email");
          showToast("error", "Error", result.error || "Failed to send reset email");
        }
        return;
      }

      showToast("success", "OTP Sent", "Please check your email for OTP");
      router.replace((`/auth/forgot-otp?email=${encodeURIComponent(normalizedEmail)}` as any));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={forgotStyles.container}>
      <TouchableOpacity
        style={forgotStyles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
      </TouchableOpacity>

      <View style={forgotStyles.iconContainer}>
        <Ionicons name="key" size={60} color="#4F46E5" />
      </View>

      <Text style={forgotStyles.title}>Forgot Password? 🔐</Text>
      <Text style={forgotStyles.subtitle}>
        No worries! Enter your email address to continue password reset.
      </Text>

      <View style={forgotStyles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#6B7280" style={forgotStyles.inputIcon} />
        <TextInput
          style={forgotStyles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={forgotStyles.button}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={forgotStyles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <View style={forgotStyles.loginContainer}>
        <Text style={forgotStyles.loginText}>Remember your password? </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={forgotStyles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const forgotStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 24
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#1E3A8A",
    marginBottom: 10
  },
  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 40,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#111827",
  },
  button: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    boxShadow: "0px 4px 8px rgba(79, 70, 229, 0.3)",
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700"
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#6B7280",
    fontSize: 14,
  },
  loginLink: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "700",
  },
});