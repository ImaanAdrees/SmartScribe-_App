import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { authAPI } from "../../utils/api";
import { showToast } from "../../utils/ToastHelper";

export default function UpdatePasswordScreen() {
  const params = useLocalSearchParams();
  const [tokenInput, setTokenInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const tokenFromUrl = typeof params.token === "string" ? params.token : "";
  const token = tokenFromUrl || tokenInput;

  const validatePassword = (value: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(value);
  };

  const handleUpdatePassword = async () => {
    const trimmedToken = token.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedToken) {
      Alert.alert("Invalid Link", "Reset token is missing. Open the link from your email.");
      showToast("error", "Invalid Link", "Reset token is missing. Open the link from your email.");
      return;
    }

    if (!trimmedPassword || !trimmedConfirmPassword) {
      Alert.alert("Error", "Please fill both password fields");
      showToast("error", "Error", "Please fill both password fields");
      return;
    }

    if (!validatePassword(trimmedPassword)) {
      Alert.alert(
        "Error",
        "Password must contain uppercase, lowercase, number and special character.",
      );
      showToast(
        "error",
        "Weak Password",
        "Password must contain uppercase, lowercase, number and special character.",
      );
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      showToast("error", "Password Mismatch", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.resetPasswordWithToken(
        trimmedToken,
        trimmedPassword,
        trimmedConfirmPassword,
      );

      if (!result.success) {
        const errorMessage = (result.error || "").toLowerCase();

        if (
          errorMessage.includes("invalid or expired reset token") ||
          errorMessage.includes("invalid reset token") ||
          errorMessage.includes("expired")
        ) {
          Alert.alert("Invalid Link", "Reset link is invalid or expired. Please request a new one.");
          showToast("error", "Invalid Link", "Reset link is invalid or expired. Please request a new one.");
        } else if (
          errorMessage.includes("passwords do not match")
        ) {
          Alert.alert("Password Mismatch", "Passwords do not match");
          showToast("error", "Password Mismatch", "Passwords do not match");
        } else if (
          errorMessage.includes("at least 8")
        ) {
          Alert.alert("Weak Password", "Password must be at least 8 characters long");
          showToast("error", "Weak Password", "Password must be at least 8 characters long");
        } else if (
          errorMessage.includes("already")
        ) {
          Alert.alert("Same Password", "Your password is already this");
          showToast("error", "Same Password", "Your password is already this");
        } else if (
          errorMessage.includes("failed to fetch") ||
          errorMessage.includes("fail to fetch")
        ) {
          Alert.alert("Server Error", "Unable to reach backend. Please try again.");
          showToast("error", "Server Error", "Unable to reach backend. Please try again.");
        } else {
          Alert.alert("Error", result.error || "Failed to update password");
          showToast("error", "Error", result.error || "Failed to update password");
        }
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setTokenInput("");
      setShowPassword(false);
      setShowConfirmPassword(false);

      showToast("success", "Success", "Password updated successfully");
      setTimeout(() => {
        router.replace("/auth/login");
      }, 1000);
    } catch {
      Alert.alert("Error", "Unexpected error while updating password");
      showToast("error", "Error", "Unexpected error while updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={60} color="#4F46E5" />
      </View>

      <Text style={styles.title}>Update Password</Text>
      <Text style={styles.subtitle}>Enter your new password below.</Text>

      {!tokenFromUrl ? (
        <TextInput
          style={styles.input}
          placeholder="Paste reset token"
          value={tokenInput}
          onChangeText={setTokenInput}
          autoCapitalize="none"
        />
      ) : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="New Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons
            name={showConfirmPassword ? "eye" : "eye-off"}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 24,
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
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 30,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  passwordInput: {
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
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
  },
});
