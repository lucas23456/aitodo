import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Animated } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CapsuleMenu from '@/components/CapsuleMenu';
import { useTodoStore } from '@/store/todoStore';
import * as Permissions from 'expo-permissions';
import { Audio } from 'expo-av';

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
  const [webViewReady, setWebViewReady] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Дополнительные состояния для отслеживания разных этапов распознавания
  const [soundDetected, setSoundDetected] = useState(false);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'listening' | 'processing'>('idle');
  
  // Анимационные значения
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Check and request permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request audio recording permission
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const { status } = await Audio.requestPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Permission not granted', status);
          Alert.alert(
            'Доступ к микрофону',
            'Требуется разрешение на использование микрофона для распознавания речи.',
            [{ text: 'OK' }]
          );
          setPermissionGranted(false);
        } else {
          console.log('Permission granted');
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
        Alert.alert(
          'Ошибка при запросе разрешений',
          'Не удалось запросить разрешение на доступ к микрофону. Пожалуйста, проверьте настройки вашего устройства.',
          [{ text: 'OK' }]
        );
        setPermissionGranted(false);
      }
    };
    
    requestPermissions();
  }, []);
  
  // Auto-start recording when page loads and permissions granted
  useEffect(() => {
    if (webViewReady && !isRecording && permissionGranted) {
      // Start recording with a short delay to ensure the WebView is fully ready
      const timer = setTimeout(() => {
        startRecording();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [webViewReady, permissionGranted]);

  // Анимация пульсации при записи
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    
    if (isRecording) {
      setRecordingState('listening');
      
      // Создаем анимацию пульсации
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Запускаем анимацию
      pulseAnimation.start();
    } else {
      // Сброс анимации
      pulseAnim.setValue(1);
      
      if (transcript) {
        setRecordingState('processing');
      } else {
        setRecordingState('idle');
      }
    }
    
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isRecording, transcript]);
  
  // Анимация нажатия кнопки
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
        let recognition = null;
        let isRecording = false;
        let recognitionTimeout = null;
        
        // Настройка обработчиков событий для SpeechRecognition
        function setupRecognitionHandlers() {
          recognition.onstart = function() {
            isRecording = true;
            document.getElementById('status').textContent = 'Слушаю...';
            sendToReactNative('status', { isRecording: true });
          };
          
          recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';
            
            // Обработка результатов с учетом промежуточных результатов
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }
            
            // Отображаем текст и отправляем в React Native
            const displayText = finalTranscript + interimTranscript;
            document.getElementById('result').textContent = displayText;
            sendToReactNative('transcript', { 
              text: displayText,
              isFinal: finalTranscript.length > 0
            });
          };
          
          recognition.onerror = function(event) {
            document.getElementById('status').textContent = 'Ошибка: ' + event.error;
            sendToReactNative('error', { message: event.error });
            
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              sendToReactNative('permission', { allowed: false });
            }
          };
          
          recognition.onend = function() {
            isRecording = false;
            document.getElementById('status').textContent = 'Запись остановлена';
            sendToReactNative('status', { isRecording: false });
            
            // On Android, we need to restart recognition manually as it stops after a few seconds
            if (window.continuousRecognition && !window.stoppedManually) {
              clearTimeout(recognitionTimeout);
              recognitionTimeout = setTimeout(() => {
                try {
                  recognition.start();
                } catch (e) {
                  console.error("Failed to restart recognition", e);
                }
              }, 300);
            }
          };
          
          // Дополнительные события из документации MDN
          recognition.onaudiostart = function() {
            sendToReactNative('audio', { status: 'started' });
          };
          
          recognition.onaudioend = function() {
            sendToReactNative('audio', { status: 'ended' });
          };
          
          recognition.onsoundstart = function() {
            document.getElementById('status').textContent = 'Обнаружен звук...';
            sendToReactNative('sound', { status: 'started' });
          };
          
          recognition.onsoundend = function() {
            sendToReactNative('sound', { status: 'ended' });
          };
          
          recognition.onspeechstart = function() {
            document.getElementById('status').textContent = 'Обнаружена речь...';
            sendToReactNative('speech', { status: 'started' });
          };
          
          recognition.onspeechend = function() {
            document.getElementById('status').textContent = 'Речь завершена';
            sendToReactNative('speech', { status: 'ended' });
          };
          
          recognition.onnomatch = function() {
            document.getElementById('status').textContent = 'Речь не распознана';
            sendToReactNative('nomatch', {});
          };
        }
        
        // Создание нового экземпляра распознавания
        function createRecognitionInstance() {
          try {
            // Получаем конструктор SpeechRecognition - trying multiple possibilities
            const SpeechRecognition = 
              window.SpeechRecognition || 
              window.webkitSpeechRecognition ||
              window.mozSpeechRecognition ||
              window.msSpeechRecognition;
            
            if (!SpeechRecognition) {
              sendToReactNative('error', { message: 'Speech recognition not supported', supported: false });
              return false;
            }
            
            // Создаем экземпляр
            recognition = new SpeechRecognition();
            
            // Настройка параметров
            recognition.continuous = false;     // Set to false for Android compatibility
            recognition.interimResults = true;  // Промежуточные результаты
            recognition.lang = 'ru-RU';         // Русский язык
            recognition.maxAlternatives = 1;    // Только один вариант распознавания
            
            // Flag for automatic restart
            window.continuousRecognition = true;
            window.stoppedManually = false;
            
            // Настройка обработчиков
            setupRecognitionHandlers();
            
            return true;
          } catch (error) {
            console.error("Speech recognition error:", error);
            sendToReactNative('error', { message: error.message || 'Speech recognition error', supported: false });
            return false;
          }
        }
        
        // Функция запуска распознавания
        window.startRecording = function() {
          if (isRecording) return;
          
          window.stoppedManually = false;
          
          if (!recognition) {
            if (!createRecognitionInstance()) {
              sendToReactNative('error', { message: 'Failed to initialize speech recognition', supported: false });
              return; // Если не удалось создать экземпляр, выходим
            }
          }
          
          try {
            recognition.start();
            sendToReactNative('status', { isRecording: true });
          } catch (error) {
            console.error("Start recording error:", error);
            // Try to recreate recognition instance if it failed
            if (!createRecognitionInstance()) {
              sendToReactNative('error', { message: 'Could not initialize speech recognition', supported: false });
              return;
            }
            
            try {
              recognition.start();
            } catch (e) {
              sendToReactNative('error', { message: e.message || 'Failed to start recording after retry', supported: false });
            }
          }
        };
        
        // Функция остановки распознавания
        window.stopRecording = function() {
          if (!isRecording || !recognition) return;
          
          window.stoppedManually = true;
          window.continuousRecognition = false;
          
          clearTimeout(recognitionTimeout);
          
          try {
            recognition.stop();
            sendToReactNative('status', { isRecording: false });
          } catch (error) {
            sendToReactNative('error', { message: error.message || 'Failed to stop recording' });
          }
        };
        
        // Инициализация при загрузке страницы
        window.addEventListener('DOMContentLoaded', function() {
          setTimeout(() => {
            const supported = createRecognitionInstance();
            sendToReactNative('ready', { supported: supported });
          }, 500);
        });
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
          // Если это финальный результат и у нас есть текст, автоматически создаем задачу
          if (message.data.isFinal && message.data.text.trim() && !processingTask) {
            // Добавляем небольшую задержку перед созданием задачи
            setTimeout(() => {
              createTaskFromVoice();
            }, 1000);
          }
          break;
        case 'ready':
          setIsLoading(false);
          setWebViewReady(true);
          setSpeechRecognitionSupported(message.data.supported);
          
          if (!message.data.supported) {
            Alert.alert(
              'Ошибка',
              'Распознавание речи не поддерживается на вашем устройстве.',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }
          break;
        case 'error':
          console.log('Voice recognition error:', message.data.message);
          if (message.data.supported === false) {
            setSpeechRecognitionSupported(false);
            Alert.alert(
              'Ошибка',
              'Распознавание речи не поддерживается на вашем устройстве.',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }
          break;
        case 'permission':
          if (!message.data.allowed) {
            Alert.alert(
              'Ошибка доступа к микрофону',
              'Пожалуйста, разрешите доступ к микрофону в настройках браузера.',
              [{ text: 'OK' }]
            );
          }
          break;
        case 'sound':
          setSoundDetected(message.data.status === 'started');
          break;
        case 'speech':
          setSpeechDetected(message.data.status === 'started');
          break;
        case 'audio':
        case 'nomatch':
          // Обрабатываем дополнительные события если нужно
          console.log(`Voice event: ${message.type}`, message.data);
          break;
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  };
  
  // Start recording
  const startRecording = () => {
    if (!permissionGranted) {
      Alert.alert(
        'Permission Required',
        'Microphone access is required to use voice recognition. Please grant permission in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.startRecording) {
          window.startRecording();
        }
        true;
      `);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.stopRecording) {
          window.stopRecording();
        }
        true;
      `);
    }
  };
  
  // Toggle speech recognition
  const toggleRecording = () => {
    animateButtonPress();
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
    Alert.alert(
      'Задача создана',
      'Задача успешно добавлена в список',
      [
        { 
          text: 'OK', 
          onPress: () => {
            setTranscript('');
            setProcessingTask(false);
            router.push('/');
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Голосовой ввод</Text>
        <View style={styles.rightHeaderSpace} />
      </View>
      
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Загрузка распознавания речи...</Text>
          </View>
        )}
        
        {!speechRecognitionSupported && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              Распознавание речи не поддерживается на этом устройстве.
            </Text>
          </View>
        )}
        
        {!permissionGranted && speechRecognitionSupported && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="mic-off" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              Требуется разрешение на доступ к микрофону для распознавания речи.
            </Text>
            <TouchableOpacity 
              style={[styles.permissionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                Audio.requestPermissionsAsync().then(({status}) => {
                  setPermissionGranted(status === 'granted');
                });
              }}
            >
              <Text style={styles.permissionButtonText}>Разрешить доступ</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {isRecording && (
          <View style={styles.micStatusContainer}>
            <Animated.View 
              style={[
                styles.micStatusIndicator, 
                { backgroundColor: colors.primary, transform: [{ scale: pulseAnim }] }
              ]} 
            />
            <Text style={[styles.micStatusText, { color: colors.text }]}>
              Микрофон активен
            </Text>
          </View>
        )}
        
        <Text style={[styles.transcriptText, { color: colors.text }]}>
          {transcript || "Говорите, чтобы создать задачу..."}
        </Text>
        
        {/* Пульсирующая кнопка микрофона */}
        <Animated.View style={{
          transform: [
            { scale: pulseAnim }
          ],
        }}>
          <Animated.View style={{
            transform: [
              { scale: buttonScale }
            ]
          }}>
            <TouchableOpacity
              style={[
                styles.micButton,
                { backgroundColor: isRecording ? colors.danger : colors.card },
                isRecording && styles.micButtonRecording
              ]}
              onPress={toggleRecording}
            >
              <MaterialIcons 
                name={isRecording ? "stop" : "mic"} 
                size={32} 
                color={isRecording ? colors.card : colors.text} 
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
        
        <Text style={[styles.statusText, { color: colors.secondaryText }]}>
          {isRecording 
            ? (speechDetected 
              ? "Слушаю речь..." 
              : (soundDetected ? "Слушаю звуки..." : "Слушаю..."))
            : (processingTask ? "Обработка..." : "Нажмите на микрофон, чтобы начать")}
        </Text>
        
        {transcript && !isRecording && !processingTask ? (
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
                  Создать задачу
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
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
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  rightHeaderSpace: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    marginBottom: 12,
    fontSize: 16,
  },
  permissionButton: {
    padding: 12,
    borderRadius: 20,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  micStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  micStatusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  micStatusText: {
    fontSize: 16,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  micButtonRecording: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
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
  transcriptText: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 40,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 