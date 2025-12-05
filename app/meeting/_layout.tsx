import { Stack } from "expo-router";
import React from "react";

export default function MeetingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="record" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="transcription" />
       <Stack.Screen name="smartsearch" />
        <Stack.Screen name="pdfexport" />
    </Stack>
  );
}
