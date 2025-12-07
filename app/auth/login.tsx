import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { showToast } from "../ToastHelper"; // import helper

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = () => {
    if (!email.trim()) return showToast("error", "Email Required", "Please enter your email address.");
    if (!validateEmail(email)) return showToast("error", "Invalid Email", "Enter a valid email format.");
    if (!password.trim()) return showToast("error", "Password Required", "Please enter your password.");

    if (email === "test@example.com" && password === "123456") {
      showToast("success", "Login Successful 🎉", "Welcome back!");

      // Delay navigation AFTER toast
      setTimeout(() => {
        router.replace("/user/home");
      }, 2100); // slightly longer than toast visibility
    } else {
      showToast("error", "Invalid Credentials", "Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={60} color="#4F46E5" />
      </View>

      <Text style={styles.title}>Welcome Back 👋</Text>
      <Text style={styles.subtitle}>Login to continue using SmartScribe</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push("/auth/forgetpas")}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/auth/signup")}>
          <Text style={styles.signupLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles remain the same as your previous LoginScreen


// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 24,
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
    marginBottom: 40,
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    color: "#6B7280",
    fontSize: 14,
  },
  signupLink: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "700",
  },
});
