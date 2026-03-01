import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { authAPI } from "../../utils/api";
import { showToast } from "../../utils/ToastHelper";

const PENDING_SIGNUP_KEY = "pendingSignupData";

export default function SignupOtpScreen() {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const loadPendingData = async () => {
      const raw = await AsyncStorage.getItem(PENDING_SIGNUP_KEY);
      if (!raw) {
        showToast("error", "No signup data", "Please fill signup form first");
        router.replace("/auth/signup");
        return;
      }

      const parsed = JSON.parse(raw);
      setEmail(parsed?.email || "");
    };

    loadPendingData();
  }, []);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showToast("error", "OTP required", "Enter OTP sent to your email");
      return;
    }

    if (otp.length !== 6) {
      showToast("error", "Invalid OTP", "OTP must be exactly 6 digits");
      return;
    }

    setLoading(true);
    try {
      const pendingRaw = await AsyncStorage.getItem(PENDING_SIGNUP_KEY);
      if (!pendingRaw) {
        showToast("error", "No signup data", "Please fill signup form again");
        router.replace("/auth/signup");
        return;
      }

      const pendingData = JSON.parse(pendingRaw);
      const verifyResult = await authAPI.verifySignupOtp(pendingData.email, otp);

      if (!verifyResult.success) {
        showToast("error", "OTP failed", verifyResult.error);
        return;
      }

      const signupResult = await authAPI.signup(
        pendingData.name,
        pendingData.email,
        pendingData.password,
        pendingData.role,
        pendingData.phone,
        pendingData.organization,
        pendingData.city,
        pendingData.country
      );

      if (!signupResult.success) {
        showToast("error", "Signup failed", signupResult.error);
        return;
      }

      await AsyncStorage.removeItem(PENDING_SIGNUP_KEY);
      showToast("success", "Account created 🎉", "Welcome to SmartScribe");
      router.replace("/(tabs)");
    } catch {
      showToast("error", "Error", "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) {
      showToast("error", "Email missing", "Go back and fill signup form");
      return;
    }

    setResending(true);
    try {
      const result = await authAPI.resendSignupOtp(email);
      if (result.success) {
        showToast("success", "OTP resent", "Please check your email");
      } else {
        showToast("error", "Resend failed", result.error);
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
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Verify & Signup</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={handleResendOtp} disabled={resending}>
        <Text style={styles.linkText}>{resending ? "Resending..." : "Resend OTP"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
        <Text style={styles.linkText}>Go Back to Signup</Text>
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
