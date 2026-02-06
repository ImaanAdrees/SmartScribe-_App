import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { showToast, showSuccessToast, showErrorToast, showInfoToast } from '../utils/ToastHelper';
import { router } from 'expo-router';

/**
 * Toast Testing Screen
 * Use this screen to test different toast notifications
 * Navigate to: /toast-test
 */
export default function ToastTestScreen() {
  const handleSuccessToast = () => {
    showSuccessToast('Success!', 'This is a success message 🎉');
  };

  const handleErrorToast = () => {
    showErrorToast('Error!', 'Something went wrong ❌');
  };

  const handleInfoToast = () => {
    showInfoToast('Info', 'This is an informational message ℹ️');
  };

  const handleCustomToast = () => {
    showToast('success', 'Custom Duration', 'This toast will last 5 seconds', 5000);
  };

  const handleLoginFlow = () => {
    showSuccessToast('Login Successful 🎉', 'Welcome back!');
    setTimeout(() => {
      router.push('/user/home');
    }, 2500);
  };

  const handleSignupFlow = () => {
    showSuccessToast('Account Created!', 'Welcome to SmartScribe');
    setTimeout(() => {
      router.push('/user/home');
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Toast Testing</Text>
        <Text style={styles.subtitle}>Test different toast notifications</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Toasts</Text>
          
          <TouchableOpacity style={[styles.button, styles.successButton]} onPress={handleSuccessToast}>
            <Text style={styles.buttonText}>Show Success Toast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={handleErrorToast}>
            <Text style={styles.buttonText}>Show Error Toast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={handleInfoToast}>
            <Text style={styles.buttonText}>Show Info Toast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.customButton]} onPress={handleCustomToast}>
            <Text style={styles.buttonText}>Show Custom Duration (5s)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auth Flow Examples</Text>
          
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleLoginFlow}>
            <Text style={styles.buttonText}>Simulate Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSignupFlow}>
            <Text style={styles.buttonText}>Simulate Signup</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  errorButton: {
    backgroundColor: '#EF4444',
  },
  infoButton: {
    backgroundColor: '#3B82F6',
  },
  customButton: {
    backgroundColor: '#8B5CF6',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
