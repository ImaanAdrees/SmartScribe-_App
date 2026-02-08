import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { authAPI } from "../../utils/api";
import { showToast } from "../../utils/ToastHelper";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // Minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      showToast("error", "Invalid Name", "Please enter your full name.");
      return;
    }

    if (name.trim().length < 3) {
      showToast("error", "Name Too Short", "Name must be at least 3 characters long.");
      return;
    }

    if (!email.trim()) {
      showToast("error", "Invalid Email", "Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      showToast("error", "Email Format Error", "Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      showToast("error", "Invalid Password", "Please enter a password.");
      return;
    }

    if (!validatePassword(password)) {
      showToast(
        "error",
        "Weak Password",
        "Password must be at least 8 characters with uppercase, lowercase, number & special character."
      );
      return;
    }

    if (!role) {
      showToast("error", "Role Required", "Please select your role.");
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.signup(name, email, password, role);

      if (result.success) {
        showToast("success", "Success 🎉", `Account created as ${role}!`, 2500);
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 2600);
      } else {
        showToast("error", "Signup Failed", result.error || "Please try again.");
      }
    } catch (_error) {
      showToast("error", "Error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };


  const roles = ["Student", "Teacher", "Other"];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account ✨</Text>
      <Text style={styles.subtitle}>Join SmartScribe today!</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.roleLabel}>Select Role</Text>
      <View style={styles.roleContainer}>
        {roles.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setRole(item)}
            style={[
              styles.roleButton,
              role === item && styles.roleButtonSelected
            ]}
          >
            <Text
              style={[
                styles.roleText,
                role === item && styles.roleTextSelected
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <Link href="/auth/login" style={styles.link}>
        Already have an account? <Text style={styles.linkBold}>Log in</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", padding: 24 },
  title: { fontSize: 28, textAlign: "center", color: "#1E3A8A", marginBottom: 10 },
  subtitle: { textAlign: "center", color: "#6B7280", marginBottom: 40 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  roleLabel: { fontSize: 16, marginBottom: 10, color: "#1E3A8A" },
  roleContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  roleButtonSelected: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  roleText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  roleTextSelected: {
    color: "#fff",
  },
  button: { backgroundColor: "#4F46E5", padding: 15, borderRadius: 10, marginTop: 10 },
  buttonDisabled: { backgroundColor: "#9CA3AF" },
  buttonText: { color: "#fff", fontSize: 16, textAlign: "center", fontWeight: "bold" },
  link: { marginTop: 20, textAlign: "center", color: "#007AFF" },
  linkBold: { fontWeight: "bold" },
});
