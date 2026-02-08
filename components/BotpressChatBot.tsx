// components/BotpressChatBot.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface BotpressChatBotProps {
  visible: boolean;
  onClose: () => void;
  transcriptText?: string | null;
  userId?: string;
}

const BotpressChatBot: React.FC<BotpressChatBotProps> = ({
  visible,
  onClose,
  transcriptText = null,
  userId = 'default-user',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>SmartScribe Assistant</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            background-color: #f5f5f5;
          }

          #webchat-root {
            height: 100vh;
            width: 100vw;
          }

          #loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 9999;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }

          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4A90E2;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          #error {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ffebee;
            color: #c62828;
            padding: 20px;
            border-radius: 10px;
            max-width: 80%;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div id="loading">
          <div class="spinner"></div>
          <p style="color: #666; font-size: 14px;">Loading AI Assistant...</p>
          <p style="color: #999; font-size: 12px; margin-top: 10px;">Please wait</p>
        </div>
        
        <div id="error">
          <p id="error-message"></p>
        </div>
        
        <div id="webchat-root"></div>
        
        <script src="https://cdn.botpress.cloud/webchat/v3.3/inject.js"></script>
        <script src="https://files.bpcontent.cloud/2025/12/08/07/20251208070236-MFJ99FMZ.js"></script>
        
        <script>
          console.log('Script started');
          
          let loadTimeout;
          let isWebchatReady = false;
          
          function showError(message) {
            console.error('Error:', message);
            document.getElementById('loading').style.display = 'none';
            const errorEl = document.getElementById('error');
            const errorMsg = document.getElementById('error-message');
            errorEl.style.display = 'block';
            errorMsg.textContent = message;
            
            // Send error to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: message
              }));
            }
          }
          
          function hideLoading() {
            console.log('Hiding loading');
            const loading = document.getElementById('loading');
            if (loading) {
              loading.style.display = 'none';
            }
            clearTimeout(loadTimeout);
          }

          function initBotpress() {
            console.log('Initializing Botpress');
            console.log('window.botpressWebChat:', window.botpressWebChat);
            
            if (typeof window.botpressWebChat === 'undefined') {
              console.log('Botpress not loaded yet, retrying...');
              return;
            }

            try {
              console.log('Setting up Botpress event listeners');
              
              window.botpressWebChat.onEvent(
                function (event) {
                  console.log('Botpress Event:', event.type);
                  
                  if (event.type === 'LIFECYCLE.LOADED') {
                    console.log('✅ Webchat loaded successfully!');
                    isWebchatReady = true;
                    hideLoading();
                    
                    // Notify React Native
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'CHAT_READY'
                      }));
                    }
                    
                    // Send transcript if available
                    ${transcriptText ? `
                    setTimeout(function() {
                      console.log('Sending transcript to bot');
                      try {
                        window.botpressWebChat.sendEvent({
                          type: 'proactive-trigger',
                          payload: {
                            text: 'I have a transcript: ${transcriptText.replace(/'/g, "\\'").replace(/\n/g, ' ').substring(0, 500)}'
                          }
                        });
                      } catch (e) {
                        console.error('Error sending transcript:', e);
                      }
                    }, 2000);
                    ` : ''}
                  }
                  
                  if (event.type === 'MESSAGE.RECEIVED') {
                    console.log('Message received:', event);
                  }
                },
                ['*']
              );
              
              console.log('Event listeners set up successfully');
              
            } catch (error) {
              console.error('Error setting up Botpress:', error);
              showError('Failed to initialize chatbot: ' + error.message);
            }
          }

          // Set timeout for loading
          loadTimeout = setTimeout(function() {
            if (!isWebchatReady) {
              console.log('Load timeout reached');
              showError('Chatbot is taking too long to load. Please check your internet connection.');
            }
          }, 15000);

          // Try to initialize immediately
          console.log('Attempting immediate initialization');
          initBotpress();

          // Keep trying every 500ms for up to 10 seconds
          let attempts = 0;
          const maxAttempts = 20;
          const initInterval = setInterval(function() {
            attempts++;
            console.log('Init attempt:', attempts);
            
            if (typeof window.botpressWebChat !== 'undefined') {
              console.log('Botpress found!');
              clearInterval(initInterval);
              initBotpress();
            } else if (attempts >= maxAttempts) {
              console.log('Max attempts reached');
              clearInterval(initInterval);
              showError('Failed to load chatbot. Please refresh the page.');
            }
          }, 500);

          // Log when scripts are loaded
          window.addEventListener('load', function() {
            console.log('Window loaded');
            console.log('Botpress available:', typeof window.botpressWebChat !== 'undefined');
          });

          // Global error handler
          window.addEventListener('error', function(e) {
            console.error('Global error:', e.message);
            showError('An error occurred: ' + e.message);
          });
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);

      if (data.type === 'CHAT_READY') {
        setLoading(false);
        setError(null);
      }

      if (data.type === 'ERROR') {
        setLoading(false);
        setError(data.message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setError('Failed to load chatbot');
    setLoading(false);
  };

  const handleWebViewLoad = () => {
    console.log('WebView finished loading');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🤖</Text>
            <Text style={styles.title}>SmartScribe AI</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          mixedContentMode="always"
          cacheEnabled={false}
          incognito={false}
          onMessage={handleWebViewMessage}
          onError={handleWebViewError}
          onLoadEnd={handleWebViewLoad}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('HTTP error:', nativeEvent.statusCode);
          }}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading chatbot...</Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#4A90E2',
    elevation: 4,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default BotpressChatBot;