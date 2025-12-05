import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const SmartSearchScreen = () => {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "👋 Hi! I'm your AI assistant. Ask me anything about your transcribed meetings!",
      timestamp: "Just now",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  const suggestedQuestions = [
    "What was discussed about the UI?",
    "Show action items from meetings",
    "When was the API mentioned?",
    "Search for 'budget' discussions",
  ];

  const handleSend = () => {
    if (inputText.trim() === "") return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        text: `I found 3 mentions of "${inputText}" in your meetings:\n\n📝 Weekly Sync (Oct 22)\n"${inputText} was discussed in detail..."\n\n📝 Sprint Planning (Oct 20)\n"Team agreed on ${inputText}..."\n\n📝 Client Review (Oct 18)\n"Client feedback on ${inputText}..."`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionPress = (question) => {
    setInputText(question);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <LinearGradient colors={["#EEF2FF", "#F9FAFB"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>

        <LinearGradient
          colors={["#6366F1", "#8B5CF6"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>🤖</Text>
            <View>
              <Text style={styles.headerTitle}>Smart Search AI</Text>
              <Text style={styles.headerSubtitle}>Ask me about your meetings</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.type === "user"
                ? styles.userMessageContainer
                : styles.botMessageContainer,
            ]}
          >
            {message.type === "bot" && (
              <View style={styles.botAvatar}>
                <Ionicons name="chatbubbles" size={18} color="#6366F1" />
              </View>
            )}

            <View
              style={[
                styles.messageBubble,
                message.type === "user"
                  ? styles.userBubble
                  : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.type === "user"
                    ? styles.userText
                    : styles.botText,
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  message.type === "user"
                    ? styles.userTimestamp
                    : styles.botTimestamp,
                ]}
              >
                {message.timestamp}
              </Text>
            </View>

            {message.type === "user" && (
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={18} color="#FFF" />
              </View>
            )}
          </View>
        ))}

        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.botAvatar}>
              <Ionicons name="chatbubbles" size={18} color="#6366F1" />
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </View>
        )}

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>💡 Try asking:</Text>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(question)}
              >
                <Text style={styles.suggestionText}>{question}</Text>
                <Ionicons name="arrow-forward" size={14} color="#6366F1" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="mic-outline" size={22} color="#6B7280" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Ask me anything about your meetings..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() === "" && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={inputText.trim() === ""}
            >
              <LinearGradient
                colors={
                  inputText.trim() === ""
                    ? ["#D1D5DB", "#D1D5DB"]
                    : ["#6366F1", "#8B5CF6"]
                }
                style={styles.sendGradient}
              >
                <Ionicons name="send" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

       
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default SmartSearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#6366F1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 36,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#E5E7EB",
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: "#6366F1",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  botText: {
    color: "#1F2937",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  userTimestamp: {
    color: "#E5E7EB",
    textAlign: "right",
  },
  botTimestamp: {
    color: "#9CA3AF",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    paddingVertical: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  suggestionsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  suggestionText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  attachButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    marginLeft: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

});