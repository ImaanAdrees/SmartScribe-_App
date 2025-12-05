import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Link, router } from "expo-router";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const handleSignup = () => {
    if (!name || !email || !password || !role) {
      Alert.alert("Error", "Please fill all fields and select a role");
      return;
    }

    Alert.alert("Success", `Account created successfully as ${role}!`);
    router.replace("/auth/login");
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

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <Link href="/auth/login" style={styles.link}>
        Already have an account? <Text style={styles.linkBold}>Log in</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", padding: 24 },
  title: { fontSize: 28, textAlign: "center", color:"#1E3A8A", marginBottom: 10 },
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
  buttonText: { color: "#fff", fontSize: 16, textAlign: "center", fontWeight: "bold" },
  link: { marginTop: 20, textAlign: "center", color: "#007AFF" },
  linkBold: { fontWeight: "bold" },
});
