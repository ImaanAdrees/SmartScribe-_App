import { Stack } from "expo-router";
import React from "react";
import Toast from "react-native-toast-message";

export default function AuthLayout() {
  return (
    <>
      <Toast />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgetpas" />
      </Stack>
    </>
  );
}
