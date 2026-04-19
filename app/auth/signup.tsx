import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Link, router } from "expo-router";
import { authAPI, sendExpoPushToken } from "../../utils/api";
import { registerForPushNotificationsAsync } from "../../utils/pushNotifications";
import { showToast } from "../../utils/ToastHelper";
import { Ionicons } from "@expo/vector-icons";

const PENDING_SIGNUP_KEY = "pendingSignupData";

// ─── Country & City Data ───────────────────────────────────────────────────────

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia",
  "Austria", "Bangladesh", "Belgium", "Brazil", "Canada",
  "Chile", "China", "Colombia", "Denmark", "Egypt",
  "Ethiopia", "Finland", "France", "Germany", "Ghana",
  "Greece", "Hungary", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Japan",
  "Jordan", "Kazakhstan", "Kenya", "Malaysia", "Mexico",
  "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway",
  "Pakistan", "Peru", "Philippines", "Poland", "Portugal",
  "Romania", "Russia", "Saudi Arabia", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Sweden", "Switzerland", "Thailand",
  "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Venezuela", "Vietnam", "Other",
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Pakistan: [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
    "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Other",
  ],
  India: [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat", "Other",
  ],
  "United States": [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
    "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Other",
  ],
  "United Kingdom": [
    "London", "Manchester", "Birmingham", "Leeds", "Glasgow",
    "Liverpool", "Edinburgh", "Bristol", "Cardiff", "Sheffield", "Other",
  ],
  Canada: [
    "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa",
    "Edmonton", "Winnipeg", "Quebec City", "Hamilton", "Other",
  ],
  Australia: [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide",
    "Gold Coast", "Canberra", "Hobart", "Darwin", "Other",
  ],
  Germany: [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt",
    "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Other",
  ],
  France: [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice",
    "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Other",
  ],
  China: [
    "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu",
    "Hangzhou", "Wuhan", "Xi'an", "Nanjing", "Other",
  ],
  "Saudi Arabia": [
    "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam",
    "Taif", "Tabuk", "Buraidah", "Khamis Mushait", "Other",
  ],
  "United Arab Emirates": [
    "Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman",
    "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Other",
  ],
  Turkey: [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Adana",
    "Gaziantep", "Konya", "Antalya", "Kayseri", "Other",
  ],
  Bangladesh: [
    "Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna",
    "Comilla", "Narayanganj", "Mymensingh", "Other",
  ],
  Nigeria: [
    "Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt",
    "Benin City", "Maiduguri", "Enugu", "Kaduna", "Other",
  ],
  Egypt: [
    "Cairo", "Alexandria", "Giza", "Luxor", "Aswan",
    "Port Said", "Suez", "Mansoura", "Tanta", "Other",
  ],
};

// ─── Dropdown Picker Component ────────────────────────────────────────────────

interface DropdownPickerProps {
  placeholder: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  disabled?: boolean;
}

function DropdownPicker({
  placeholder,
  value,
  options,
  onSelect,
  disabled = false,
}: DropdownPickerProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.dropdownTrigger, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[styles.dropdownTriggerText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={disabled ? "#bbb" : "#555"} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => { setVisible(false); setSearch(""); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color="#999" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${placeholder}...`}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item === value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                    setSearch("");
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item === value && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {item === value && (
                    <Ionicons name="checkmark" size={18} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

// ─── Signup Screen ─────────────────────────────────────────────────────────────

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

  // When country changes, reset city
  const handleCountrySelect = (val: string) => {
    setCountry(val);
    setCity("");
  };

  const cityOptions =
    country && CITIES_BY_COUNTRY[country]
      ? CITIES_BY_COUNTRY[country]
      : ["Other"];

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
      const pendingSignupData = {
        name,
        email,
        password,
        role,
        phone,
        organization,
        city,
        country,
      };

      await AsyncStorage.setItem(
        PENDING_SIGNUP_KEY,
        JSON.stringify(pendingSignupData)
      );

      const result = await authAPI.sendSignupOtp(email);

      if (result.success) {
        // Register for push notifications and send token to backend
        try {
          const expoPushToken = await registerForPushNotificationsAsync();
          if (expoPushToken) {
            await sendExpoPushToken(expoPushToken);
          }
        } catch (e) {
          // Ignore push registration errors
        }
        showToast("success", "OTP sent", "Check your email for verification code");
        router.push("/auth/signup-otp");
      } else {
        showToast("error", "Failed", result.error);
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

      {/* COUNTRY DROPDOWN */}
      <DropdownPicker
        placeholder="Country"
        value={country}
        options={COUNTRIES}
        onSelect={handleCountrySelect}
      />

      {/* CITY DROPDOWN */}
      <DropdownPicker
        placeholder="City"
        value={city}
        options={cityOptions}
        onSelect={setCity}
        disabled={!country}
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

  // ── Dropdown ──────────────────────────────────────────────────────────────
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginBottom: 12,
    backgroundColor: "white",
  },

  dropdownDisabled: {
    backgroundColor: "#f5f5f5",
  },

  dropdownTriggerText: {
    fontSize: 14,
    color: "#000",
  },

  placeholderText: {
    color: "#aaa",
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    paddingBottom: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: "#f2f2f2",
  },

  optionSelected: {
    backgroundColor: "#EEF2FF",
  },

  optionText: {
    fontSize: 15,
    color: "#333",
  },

  optionTextSelected: {
    color: "#4F46E5",
    fontWeight: "600",
  },

  // ── Password ──────────────────────────────────────────────────────────────
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

  // ── Role ──────────────────────────────────────────────────────────────────
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

  // ── Button / Link ─────────────────────────────────────────────────────────
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