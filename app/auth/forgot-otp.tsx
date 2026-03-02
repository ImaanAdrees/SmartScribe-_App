import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { authAPI } from "../../utils/api";
import { showToast } from "../../utils/ToastHelper";

export default function ForgotOtpScreen() {
  const params = useLocalSearchParams();
  const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerifyOtp = async () => {
    const normalizedOtp = otp.trim();

    if (!email) {
      showToast("error", "Email missing", "Please start forgot password again");
      router.replace("/auth/forgetpas");
      return;
    }

    if (!normalizedOtp) {
      showToast("error", "OTP required", "Enter OTP sent to your email");
      return;
    }

    if (normalizedOtp.length !== 6) {
      showToast("error", "Invalid OTP", "OTP must be exactly 6 digits");
      return;
    }

    setLoading(true);
    try {
      const verifyResult = await authAPI.verifyForgotPasswordOtp(email, normalizedOtp);

      if (!verifyResult.success) {
        showToast("error", "OTP failed", verifyResult.error || "Failed to verify OTP");
        return;
      }

      const token = verifyResult?.data?.token;
      if (!token) {
        showToast("error", "Error", "Unable to continue reset flow");
        return;
      }

      showToast("success", "OTP Verified", "Set your new password");
      router.replace(`/auth/updatepass?token=${encodeURIComponent(token)}`);
    } catch {
      showToast("error", "Error", "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      showToast("error", "Email missing", "Please start forgot password again");
      router.replace("/auth/forgetpas");
      return;
    }

    setResending(true);
    try {
      const result = await authAPI.resendForgotPasswordOtp(email);
      if (result.success) {
        showToast("success", "OTP resent", "Please check your email");
      } else {
        showToast("error", "Resend failed", result.error || "Failed to resend OTP");
      }
    } catch {
      showToast("error", "Error", "Unexpected error");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the code sent to {email || "your email"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        value={otp}
        onChangeText={(value) => {
          const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
          setOtp(digitsOnly);
        }}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={handleResendOtp} disabled={resending}>
        <Text style={styles.linkText}>{resending ? "Resending..." : "Resend OTP"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.replace("/auth/forgetpas")}>
        <Text style={styles.linkText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "white",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#4F46E5",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#4F46E5",
    padding: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 14,
    alignItems: "center",
  },
  linkText: {
    color: "#4F46E5",
    fontWeight: "600",
  },
});
