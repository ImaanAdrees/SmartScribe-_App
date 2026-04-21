import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioRecorder, AudioModule } from 'expo-audio';
import Reanimated, { FadeIn, SlideInRight, SlideInLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AIChatScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your SmartScribe AI. Ask me anything about your meeting transcripts!",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const isActuallyRecording = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  // Audio recorder setup
  const recorder = useAudioRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  } as any);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const addMessage = (text: string, sender: 'user' | 'ai') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage(userMessage, 'user');
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      if (data.success) {
        addMessage(data.message, 'ai');
      } else {
        addMessage("Sorry, I encountered an error. Please try again.", 'ai');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage("Connection error. Please check your network.", 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required.');
        return;
      }

      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      
      // Prepare recorder for web and other platforms
      try {
        if ('prepareToRecordAsync' in recorder) {
          await (recorder as any).prepareToRecordAsync();
        } else if ('prepareToRecord' in recorder) {
          await (recorder as any).prepareToRecord();
        }
      } catch (prepErr) {
        console.warn('Recorder preparation warning:', prepErr);
      }

      setIsRecording(true);
      await recorder.record();
      isActuallyRecording.current = true;
    } catch (err) {
      setIsRecording(false);
      console.error('Failed to start recording', err);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!isActuallyRecording.current) {
      // Small delay to allow startRecording to finish its async work if user tapped quickly
      await new Promise(resolve => setTimeout(resolve, 200));
      if (!isActuallyRecording.current) {
        setIsRecording(false);
        return;
      }
    }

    setIsRecording(false);
    try {
      await recorder.stop();
      isActuallyRecording.current = false;
      const uri = recorder.uri;
      if (!uri) return;

      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'voice-prompt.m4a';
      
      if (Platform.OS === 'web' && uri.startsWith('blob:')) {
        try {
          const blob = await fetch(uri).then((r) => r.blob());
          formData.append('audio', blob, filename);
        } catch (e) {
          console.warn('Failed to fetch blob for web upload', e);
          addMessage("Could not read audio data. Please try again.", 'ai');
          return;
        }
      } else {
        formData.append('audio', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: filename,
          type: 'audio/m4a',
        } as any);
      }

      const response = await fetch(`${API_URL}/api/ai/voice-chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        // Voice chat returns user's transcribed message too
        if (data.userMessage) {
            addMessage(data.userMessage, 'user');
        }
        addMessage(data.message, 'ai');
      } else {
        addMessage("Sorry, I couldn't transcribe your voice. Please try text.", 'ai');
      }
    } catch (err) {
      console.error('Voice chat error:', err);
      addMessage("Voice chat error. Please try again.", 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.sender === 'ai';
    return (
      <Reanimated.View 
        entering={isAI ? SlideInLeft : SlideInRight}
        style={[
          styles.messageWrapper,
          isAI ? styles.aiWrapper : styles.userWrapper
        ]}
      >
        {isAI && (
          <View style={styles.aiAvatar}>
            <MaterialCommunityIcons name="robot" size={20} color="#FFF" />
          </View>
        )}
        <LinearGradient
          colors={isAI ? ['#F3F4F6', '#E5E7EB'] : ['#6366F1', '#4F46E5']}
          style={[
            styles.messageBubble,
            isAI ? styles.aiBubble : styles.userBubble
          ]}
        >
          <Text style={[styles.messageText, isAI ? styles.aiText : styles.userText]}>
            {item.text}
          </Text>
        </LinearGradient>
      </Reanimated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>SmartScribe AI</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Always Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6366F1" />
          <Text style={styles.loadingText}>AI is thinking...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.inputContainer, { marginBottom: insets.bottom + 10 }]}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Ask about your transcripts..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.sendIconBg}>
                <Ionicons name="send" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.micButton, isRecording && styles.recordingMic]} 
              onPressIn={startRecording}
              onPressOut={stopRecordingAndSend}
            >
              <LinearGradient 
                colors={isRecording ? ['#EF4444', '#DC2626'] : ['#6366F1', '#4F46E5']} 
                style={styles.micIconBg}
              >
                <Ionicons name={isRecording ? "stop" : "mic"} size={22} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  onlineText: {
    color: '#E0E7FF',
    fontSize: 10,
    fontWeight: '500',
  },
  infoButton: {
    padding: 5,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '85%',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    flexShrink: 1, // Added to ensure the bubble shrinks and text wraps
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  aiText: {
    color: '#1F2937',
  },
  userText: {
    color: '#FFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  attachButton: {
    padding: 5,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  sendButton: {
    padding: 2,
  },
  sendIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    padding: 2,
  },
  micIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingMic: {
    transform: [{ scale: 1.2 }],
  },
});

export default AIChatScreen;