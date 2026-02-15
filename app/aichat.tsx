// app/aichat.tsx (Simple version)
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import BotpressChatBot from '../components/BotpressChatBot';

const AIChatScreen = () => {
  const params = useLocalSearchParams();
  const [chatVisible, setChatVisible] = useState<boolean>(true);

  const transcriptText = typeof params.transcriptText === 'string'
    ? params.transcriptText
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BotpressChatBot
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        transcriptText={transcriptText}
        userId="user-123"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default AIChatScreen;