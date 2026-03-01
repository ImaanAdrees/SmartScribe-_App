
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { authAPI } from "../../utils/api";
import { showToast } from "../../utils/ToastHelper";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = ["Student", "Teacher", "Other"];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(
      password
    );
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      showToast("error", "Invalid Name", "Enter full name");
      return;
    }

    if (!validateEmail(email)) {
      showToast("error", "Invalid Email", "Enter valid email");
      return;
    }

    if (!phone.trim()) {
      showToast("error", "Phone required", "Enter phone number");
      return;
    }

    if (!organization.trim()) {
      showToast("error", "Organization required", "Enter university / organization");
      return;
    }

    if (!city.trim()) {
      showToast("error", "City required", "Enter city");
      return;
    }

    if (!country.trim()) {
      showToast("error", "Country required", "Enter country");
      return;
    }

    if (!validatePassword(password)) {
      showToast(
        "error",
        "Weak Password",
        "Must contain uppercase, lowercase, number, special character"
      );
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Password mismatch", "Passwords do not match");
      return;
    }

    if (!role) {
      showToast("error", "Select role", "Please select role");
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.signup(
        name,
        email,
        password,
        role,
        phone,
        organization,
        city,
        country
      );

      if (result.success) {
        showToast("success", "Account created 🎉", "Welcome to SmartScribe");
        router.replace("/(tabs)");
      } else {
        showToast("error", "Signup failed", result.error);
      }
    } catch {
      showToast("error", "Error", "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Create Account ✨</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="University / Organization"
        value={organization}
        onChangeText={setOrganization}
      />

      <TextInput
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={setCity}
      />

      <TextInput
        style={styles.input}
        placeholder="Country"
        value={country}
        onChangeText={setCountry}
      />

      {/* PASSWORD */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      {/* CONFIRM PASSWORD */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(!showConfirmPassword)
          }
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={22}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      {/* ROLE */}
      <Text style={styles.roleLabel}>Select Role</Text>

      <View style={styles.roleContainer}>
        {roles.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.roleButton,
              role === item && styles.roleSelected,
            ]}
            onPress={() => setRole(item)}
          >
            <Text
              style={[
                styles.roleText,
                role === item && styles.roleTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <Link href="/auth/login" style={styles.link}>
        Already have account? Log in
      </Link>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "white",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#4F46E5",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 12,
  },

  roleLabel: {
    marginTop: 10,
    marginBottom: 8,
    fontWeight: "600",
  },

  roleContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },

  roleButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },

  roleSelected: {
    backgroundColor: "#4F46E5",
  },

  roleText: {
    color: "#444",
  },

  roleTextSelected: {
    color: "white",
    fontWeight: "bold",
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

  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#4F46E5",
  },

});
