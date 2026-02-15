import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Simulate sending reset email
    setTimeout(() => {
      setEmailSent(true);
    }, 1000);
  };

  if (emailSent) {
    return (
      <View style={forgotStyles.container}>
        <View style={forgotStyles.successContainer}>
          <View style={forgotStyles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>

          <Text style={forgotStyles.successTitle}>Email Sent! 📧</Text>
          <Text style={forgotStyles.successSubtitle}>
            We've sent a password reset link to
          </Text>
          <Text style={forgotStyles.emailText}>{email}</Text>
          <Text style={forgotStyles.successDescription}>
            Please check your inbox and click on the link to reset your password.
          </Text>

          <TouchableOpacity
            style={forgotStyles.button}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={forgotStyles.buttonText}>Back to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={forgotStyles.resendButton}
            onPress={() => setEmailSent(false)}
          >
            <Text style={forgotStyles.resendText}>Didn't receive email? Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        No worries! Enter your email address and we'll send you a link to reset your password.
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
      >
        <Text style={forgotStyles.buttonText}>Send Reset Link</Text>
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
  successContainer: {
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 10,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
    marginBottom: 16,
    textAlign: "center",
  },
  successDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  resendButton: {
    marginTop: 12,
    padding: 8,
  },
  resendText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "600",
  },
});