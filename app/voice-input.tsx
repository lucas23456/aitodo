import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CapsuleMenu from '@/components/CapsuleMenu';
import { useTodoStore } from '@/store/todoStore';

export default function VoiceInputScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  const addTask = useTodoStore((state) => state.addTask);
  
  const webViewRef = useRef<WebView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [processingTask, setProcessingTask] = useState(false);
  
  // Simple web page with speech recognition
  const speechRecognitionHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: ${colors.background};
          color: ${colors.text};
        }
        #status {
          margin-bottom: 20px;
          font-size: 16px;
        }
        #result {
          font-size: 18px;
          margin-bottom: 20px;
          text-align: center;
          width: 100%;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      <div id="status">Ready to start voice recognition</div>
      <div id="result"></div>
      
      <script>
        // Function to communicate with React Native
        function sendToReactNative(type, data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
        }
        
        // Initialize speech recognition
        let recognition;
        let isRecording = false;
        
        function setupSpeechRecognition() {
          try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onstart = function() {
              isRecording = true;
              document.getElementById('status').textContent = 'Listening...';
              sendToReactNative('status', { isRecording: true });
            };
            
            recognition.onresult = function(event) {
              let transcript = '';
              for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
              }
              document.getElementById('result').textContent = transcript;
              sendToReactNative('transcript', { text: transcript });
            };
            
            recognition.onerror = function(event) {
              document.getElementById('status').textContent = 'Error occurred: ' + event.error;
              sendToReactNative('error', { message: event.error });
            };
            
            recognition.onend = function() {
              isRecording = false;
              document.getElementById('status').textContent = 'Voice recognition ended';
              sendToReactNative('status', { isRecording: false });
            };
            
            sendToReactNative('ready', { supported: true });
          } catch (e) {
            document.getElementById('status').textContent = 'Speech recognition not supported';
            sendToReactNative('ready', { supported: false, error: e.toString() });
          }
        }
        
        // Toggle recording on/off
        function toggleRecording() {
          if (isRecording) {
            recognition.stop();
          } else {
            document.getElementById('result').textContent = '';
            recognition.start();
          }
        }
        
        // Listen for commands from React Native
        window.addEventListener('message', function(event) {
          const message = JSON.parse(event.data);
          
          if (message.action === 'toggle') {
            toggleRecording();
          } else if (message.action === 'setup') {
            setupSpeechRecognition();
          }
        });
        
        // Setup on page load
        window.onload = setupSpeechRecognition;
      </script>
    </body>
    </html>
  `;
  
  // Handle messages from the WebView
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'status':
          setIsRecording(message.data.isRecording);
          break;
        case 'transcript':
          setTranscript(message.data.text);
          break;
        case 'ready':
          setIsLoading(false);
          break;
        case 'error':
          console.log('Voice recognition error:', message.data.message);
          break;
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  };
  
  // Toggle speech recognition
  const toggleRecording = () => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        window.postMessage(JSON.stringify({ action: 'toggle' }), '*');
        true;
      })();
    `);
  };
  
  // Create a task from voice input
  const createTaskFromVoice = () => {
    if (!transcript.trim()) {
      return;
    }
    
    setProcessingTask(true);
    
    // Simple parsing logic - this could be enhanced with NLP in the future
    const today = new Date();
    const taskTitle = transcript.trim();
    
    // Create a basic task with the transcript as the title
    const newTask = {
      title: taskTitle,
      description: '',
      dueDate: today.toISOString(),
      completed: false,
      category: 'Voice Input',
      priority: 'medium' as 'low' | 'medium' | 'high',
      tags: ['Voice'],
      estimatedTime: '30 min'
    };
    
    // Add task to store
    addTask(newTask);
    
    // Show success message and reset
    setTranscript('');
    setProcessingTask(false);
    
    // Navigate back to task list
    router.push('/');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Voice Input</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Voice recognition area */}
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <View style={[styles.transcriptContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.transcriptText, { color: colors.text }]}>
                {transcript || "Speak to see your words here..."}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.micButton,
                { backgroundColor: isRecording ? colors.danger : colors.card }
              ]}
              onPress={toggleRecording}
            >
              <MaterialIcons 
                name={isRecording ? "stop" : "mic"} 
                size={32} 
                color={isRecording ? colors.card : colors.text} 
              />
            </TouchableOpacity>
            
            <Text style={[styles.statusText, { color: colors.secondaryText }]}>
              {isRecording ? "Listening..." : "Tap the microphone to start"}
            </Text>
            
            {transcript ? (
              <TouchableOpacity
                style={[styles.createTaskButton, { backgroundColor: colors.primary }]}
                onPress={createTaskFromVoice}
                disabled={processingTask}
              >
                {processingTask ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <>
                    <MaterialIcons name="add-task" size={20} color={colors.background} />
                    <Text style={[styles.createTaskText, { color: colors.background }]}>
                      Create Task
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>
      
      {/* Hidden WebView for speech recognition */}
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: speechRecognitionHTML }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => <ActivityIndicator size="large" color={colors.primary} />}
          onError={(syntheticEvent: any) => {
            console.error('WebView error:', syntheticEvent.nativeEvent);
          }}
        />
      </View>
      
      <CapsuleMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptContainer: {
    width: '100%',
    minHeight: 150,
    borderRadius: 15,
    padding: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  transcriptText: {
    fontSize: 18,
    lineHeight: 26,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 40,
  },
  webviewContainer: {
    position: 'absolute',
    height: 1,
    width: 1,
    opacity: 0,
  },
  createTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    width: '70%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createTaskText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
}); 