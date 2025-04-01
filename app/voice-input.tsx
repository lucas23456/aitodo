import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Animated } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CapsuleMenu from '@/components/CapsuleMenu';
import { useTodoStore } from '@/store/todoStore';
import { Audio } from 'expo-av';
import { processVoiceText } from '@/utils/speechProcessor';

// Константы для хранения данных
const STORAGE_KEY = '@todo_app_tasks';
const PROJECTS_KEY = '@todo_app_projects';
const DARK_MODE_KEY = '@todo_app_dark_mode';

// Обновить список задач, сохранив их в AsyncStorage и обновив store
const updateTasksWithNewTask = async (newTask: any) => {
  try {
    // Получаем текущие задачи напрямую из store
    let tasks = useTodoStore.getState().tasks || [];
    console.log('Current tasks before update:', tasks.length);
    
    // Добавляем новую задачу и создаем новый массив
    const updatedTasks = [...tasks, newTask];
    
    // Обновляем состояние хранилища напрямую
    useTodoStore.setState({ tasks: updatedTasks });
    console.log('Store updated with new task, new count:', updatedTasks.length);
    
    // Затем сохраняем в AsyncStorage
    console.log('Saving updated tasks to AsyncStorage...');
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    console.log('Tasks successfully saved to AsyncStorage');
    
    // Возвращаем успех
    return true;
  } catch (error) {
    console.error('Error updating tasks in primary method:', error);
    
    // В случае ошибки, используем резервный подход через AsyncStorage
    try {
      console.log('Attempting fallback method via AsyncStorage...');
      // Получаем текущие задачи из AsyncStorage напрямую
      const storedTasksJson = await AsyncStorage.getItem(STORAGE_KEY);
      let storedTasks = [];
      
      if (storedTasksJson) {
        storedTasks = JSON.parse(storedTasksJson);
        console.log('Retrieved', storedTasks.length, 'tasks from AsyncStorage');
      } else {
        console.log('No existing tasks found in AsyncStorage');
      }
      
      // Добавляем новую задачу
      storedTasks.push(newTask);
      console.log('Added new task to retrieved tasks');
      
      // Сохраняем обновленный список обратно в AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(storedTasks));
      console.log('Saved', storedTasks.length, 'tasks to AsyncStorage');
      
      // И обновляем состояние хранилища
      useTodoStore.setState({ tasks: storedTasks });
      console.log('Store updated with tasks from AsyncStorage');
      
      // Возвращаем успех
      return true;
    } catch (fallbackError) {
      console.error('Critical error in fallback method:', fallbackError);
      
      // Последняя попытка - сохраняем только новую задачу в пустой массив
      try {
        console.log('Last resort: saving only the new task...');
        const singleTaskArray = [newTask];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(singleTaskArray));
        useTodoStore.setState({ tasks: singleTaskArray });
        console.log('Successfully saved single task as last resort');
        return true;
      } catch (finalError) {
        console.error('All methods failed to save task:', finalError);
        return false;
      }
    }
  }
};

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
  const [processingState, setProcessingState] = useState<'idle' | 'parsing' | 'creating' | 'completed' | 'error'>('idle');
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
  const voiceScale = useRef(new Animated.Value(1)).current;
  
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
      // Start recording with a delay to ensure the WebView is fully ready
      const timer = setTimeout(() => {
        // We don't want to auto-start anymore
        // startRecording();
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
  
  // Анимация реакции на звук
  useEffect(() => {
    if (isRecording && (speechDetected || soundDetected)) {
      // Создаем анимацию, которая делает круг больше при обнаружении звука
      Animated.sequence([
        Animated.timing(voiceScale, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(voiceScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      voiceScale.setValue(1);
    }
  }, [isRecording, speechDetected, soundDetected]);
  
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
      <meta http-equiv="Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: gap:">
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
        .error {
          color: ${colors.error};
          text-align: center;
          padding: 20px;
        }
        .debug {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div id="status">Подготовка распознавания речи...</div>
      <div id="result"></div>
      
      <script>
        // Function to communicate with React Native
        function sendToReactNative(type, data) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
          } else {
            console.error("ReactNativeWebView not available");
            document.getElementById('status').innerHTML = '<div class="error">Ошибка: ReactNativeWebView недоступен</div>';
          }
        }
        
        // Initialize speech recognition
        let recognition = null;
        let isRecording = false;
        let recognitionTimeout = null;
        let soundDetectionTimeout = null;
        let audioContext = null;
        let analyser = null;
        let microphone = null;
        let javascriptNode = null;
        
        // Check browser support
        document.addEventListener('DOMContentLoaded', function() {
          try {
            // Check if SpeechRecognition is available
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
              throw new Error('Speech recognition not supported');
            }
            
            // Initialize recognition
            recognition = new SpeechRecognition();
            recognition.lang = 'ru-RU'; // Set Russian language for recognition
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            
            setupRecognitionHandlers();
            document.getElementById('status').textContent = 'Готово к записи';
            
            // Inform React Native that we're ready
            sendToReactNative('ready', { supported: true });
            
            // Setup audio processing for sound detection if available
            setupAudioProcessing();
            
          } catch (error) {
            console.error('Speech recognition initialization error:', error);
            document.getElementById('status').innerHTML = '<div class="error">Ошибка: распознавание речи не поддерживается в вашем браузере</div>';
            sendToReactNative('ready', { supported: false, error: error.message });
          }
        });
        
        // Setup audio processing for sound detection
        function setupAudioProcessing() {
          try {
            // Check if Web Audio API is available
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            if (window.AudioContext) {
              audioContext = new AudioContext();
              analyser = audioContext.createAnalyser();
              analyser.minDecibels = -90;
              analyser.maxDecibels = -10;
              analyser.smoothingTimeConstant = 0.85;
            }
          } catch (e) {
            console.log('Web Audio API is not supported');
          }
        }
        
        // Настройка обработчиков событий для SpeechRecognition
        function setupRecognitionHandlers() {
          recognition.onstart = function() {
            isRecording = true;
            document.getElementById('status').textContent = 'Слушаю...';
            sendToReactNative('status', { isRecording: true });
            
            // Start audio processing if available
            if (audioContext && navigator.mediaDevices) {
              startAudioProcessing();
            }
          };
          
          recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';
            
            // Signal that speech was detected
            sendToReactNative('speechDetected', { detected: true });
            
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
            const displayText = finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
            document.getElementById('result').textContent = displayText;
            sendToReactNative('transcript', { 
              text: displayText,
              isFinal: finalTranscript.length > 0
            });
            
            // If final result is available and we're still recording, reset recognition
            // to keep it going continuously
            if (finalTranscript && isRecording) {
              // Restart recognition after a short delay to catch the next phrase
              clearTimeout(recognitionTimeout);
              recognitionTimeout = setTimeout(() => {
                if (isRecording) {
                  recognition.stop();
                  setTimeout(() => {
                    if (isRecording) {
                      try {
                        recognition.start();
                      } catch (e) {
                        console.error('Error restarting recognition:', e);
                      }
                    }
                  }, 200);
                }
              }, 1000);
            }
          };
          
          recognition.onerror = function(event) {
            console.error('Recognition error:', event.error);
            
            // Only show errors that are not "no-speech" which is common
            if (event.error !== 'no-speech') {
              document.getElementById('status').textContent = 'Ошибка: ' + event.error;
              sendToReactNative('error', { error: event.error });
            }
            
            // If we encounter an error that's not "aborted", try to restart recognition
            if (isRecording && event.error !== 'aborted') {
              clearTimeout(recognitionTimeout);
              recognitionTimeout = setTimeout(() => {
                if (isRecording) {
                  try {
                    recognition.start();
                  } catch (e) {
                    console.error('Error restarting recognition after error:', e);
                    isRecording = false;
                    sendToReactNative('status', { isRecording: false });
                  }
                }
              }, 1000);
            }
          };
          
          recognition.onend = function() {
            // If we're supposed to be recording but recognition ended, restart it
            if (isRecording) {
              clearTimeout(recognitionTimeout);
              recognitionTimeout = setTimeout(() => {
                if (isRecording) {
                  try {
                    recognition.start();
                  } catch (e) {
                    console.error('Error restarting recognition:', e);
                    isRecording = false;
                    document.getElementById('status').textContent = 'Запись окончена';
                    sendToReactNative('status', { isRecording: false });
                  }
                }
              }, 200);
            } else {
              document.getElementById('status').textContent = 'Запись окончена';
              sendToReactNative('status', { isRecording: false });
              
              // Stop audio processing
              stopAudioProcessing();
            }
          };
        }
        
        // Process audio for sound detection
        function startAudioProcessing() {
          if (!audioContext || !analyser) return;
          
          navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(function(stream) {
              microphone = audioContext.createMediaStreamSource(stream);
              microphone.connect(analyser);
              
              analyser.fftSize = 256;
              const bufferLength = analyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);
              
              // Check for sound regularly
              function checkSound() {
                if (!isRecording) return;
                
                analyser.getByteFrequencyData(dataArray);
                
                // Calculate average volume level
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                  sum += dataArray[i];
                }
                const average = sum / bufferLength;
                
                // If volume is above threshold, sound is detected
                if (average > 15) { // Threshold - may need adjustment
                  sendToReactNative('soundDetected', { detected: true, level: average });
                  
                  // Prevent too many messages by using a timeout
                  clearTimeout(soundDetectionTimeout);
                  soundDetectionTimeout = setTimeout(() => {
                    sendToReactNative('soundDetected', { detected: false });
                  }, 200);
                }
                
                // Continue checking if still recording
                if (isRecording) {
                  requestAnimationFrame(checkSound);
                }
              }
              
              // Start checking sound
              requestAnimationFrame(checkSound);
            })
            .catch(function(err) {
              console.error('Error accessing the microphone:', err);
            });
        }
        
        // Stop audio processing
        function stopAudioProcessing() {
          if (microphone) {
            microphone.disconnect();
            microphone = null;
          }
          
          clearTimeout(soundDetectionTimeout);
        }
        
        // Start recording
        function startRecording() {
          try {
            if (!isRecording && recognition) {
              recognition.start();
              isRecording = true;
            }
          } catch (error) {
            console.error('Error starting recognition:', error);
            sendToReactNative('error', { error: error.message });
          }
        }
        
        // Stop recording
        function stopRecording() {
          try {
            if (isRecording && recognition) {
              clearTimeout(recognitionTimeout);
              isRecording = false;
              recognition.stop();
              stopAudioProcessing();
            }
          } catch (error) {
            console.error('Error stopping recognition:', error);
          }
        }
        
        // Receive messages from React Native
        window.addEventListener('message', function(event) {
          try {
            const message = JSON.parse(event.data);
            switch(message.action) {
              case 'start':
                startRecording();
                break;
              case 'stop':
                stopRecording();
                break;
              case 'reset':
                document.getElementById('result').textContent = '';
                break;
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        });
      </script>
    </body>
    </html>
  `;
  
  // Handle messages from the WebView
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'ready':
          setWebViewReady(true);
          setSpeechRecognitionSupported(data.data.supported);
          setIsLoading(false);
          console.log('WebView ready, speech recognition supported:', data.data.supported);
          break;
          
        case 'transcript':
          if (data.data.text && data.data.text.trim()) {
            setTranscript(data.data.text.trim());
          }
          break;
          
        case 'status':
          setIsRecording(data.data.isRecording);
          break;
          
        case 'error':
          console.error('Speech recognition error:', data.data.error);
          // Handle serious errors only
          if (data.data.error !== 'no-speech' && data.data.error !== 'aborted') {
            Alert.alert(
              'Ошибка распознавания',
              `Произошла ошибка: ${data.data.error}`,
              [{ text: 'OK' }]
            );
          }
          break;
          
        case 'speechDetected':
          setSpeechDetected(data.data.detected);
          break;
          
        case 'soundDetected':
          setSoundDetected(data.data.detected);
          break;
          
        default:
          console.log('Unhandled WebView message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };
  
  // Start recording
  const startRecording = () => {
    if (!webViewReady || !permissionGranted) {
      return;
    }
    
    animateButtonPress();
    
    webViewRef.current?.injectJavaScript(`
      try {
        window.postMessage(JSON.stringify({action: 'start'}), '*');
      } catch(e) {
        console.error('Error starting recording:', e);
      }
      true;
    `);
    
    setIsRecording(true);
  };
  
  // Stop recording
  const stopRecording = () => {
    if (!webViewReady || !isRecording) {
      return;
    }
    
    animateButtonPress();
    
    webViewRef.current?.injectJavaScript(`
      try {
        window.postMessage(JSON.stringify({action: 'stop'}), '*');
      } catch(e) {
        console.error('Error stopping recording:', e);
      }
      true;
    `);
    
    setIsRecording(false);
  };
  
  // Toggle speech recognition
  const toggleRecording = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Toggle recording state
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Create a task from voice input
  const createTaskFromVoice = async () => {
    if (!transcript.trim()) {
      setProcessingState('error');
      return;
    }
    
    setProcessingState('parsing');
    
    try {
      // Включаем индикатор ожидания
      setProcessingTask(true);
      
      // Обработаем текст голосового ввода при помощи утилиты
      const processedTasks = await processVoiceText(transcript);
      
      if (processedTasks && processedTasks.length > 0) {
        setProcessingState('creating');
        
        // Добавляем задачи по одной
        for (const processedTask of processedTasks) {
          const newTask = {
            id: processedTask.id,
            title: processedTask.title,
            description: processedTask.description || '',
            dueDate: processedTask.dueDate || new Date().toISOString(),
            completed: false,
            createdAt: new Date().toISOString(),
            category: processedTask.category || '',
            tags: processedTask.tags || [],
            priority: processedTask.priority || 'medium',
          };
          
          // Сначала пробуем добавить через Zustand addTask
          try {
            console.log('Adding task via Zustand addTask:', newTask.title);
            addTask({
              title: newTask.title,
              description: newTask.description,
              dueDate: newTask.dueDate,
              completed: false,
              category: newTask.category,
              tags: newTask.tags,
              priority: newTask.priority,
            });
          } catch (storeError) {
            console.error('Error adding task via store:', storeError);
            
            // Если не удалось, используем резервный метод
            try {
              const success = await updateTasksWithNewTask(newTask);
              if (!success) {
                console.error('Failed to add task with both methods:', newTask.title);
              }
            } catch (fallbackError) {
              console.error('Critical error adding task:', fallbackError);
            }
          }
        }
        
        // Очищаем transcript и завершаем обработку
        setProcessingState('completed');
        setRecordingState('idle');
        
        // Показываем пользователю сообщение об успехе
        const taskCount = processedTasks.length;
        const taskWord = taskCount > 1 ? 'tasks' : 'task';
        Alert.alert(
          'Task Created',
          `Successfully added ${taskCount} ${taskWord} from your voice input.`,
          [{ text: 'OK' }]
        );
        
        // Возвращаемся на главный экран после короткой задержки
        setTimeout(() => {
          setTranscript('');
          router.push('/');
        }, 1500);
      } else {
        // Не удалось создать задачи из голосового ввода
        setProcessingState('error');
        Alert.alert(
          'Error',
          'Could not create tasks from your voice input. Please try again or enter tasks manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      setProcessingState('error');
      
      // Создаем простую задачу без обработки
      await createBasicTask(transcript);
    } finally {
      setProcessingTask(false);
    }
  };
  
  // Вспомогательная функция для создания базовой задачи (запасной вариант)
  const createBasicTask = async (text: string) => {
    const today = new Date();
    const taskTitle = text;
    
    // Создаем простую задачу с текстом как заголовком и сегодняшней датой
    const newTask = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      title: `📝 ${taskTitle}`,
      description: '',
      dueDate: today.toISOString(), // Гарантируем использование сегодняшней даты
      completed: false,
      createdAt: today.toISOString(),
      priority: 'medium' as 'low' | 'medium' | 'high',
      category: '',
      tags: []
    };
    
    // Добавляем задачу с помощью нашей новой функции
    await updateTasksWithNewTask(newTask);
    console.log('Added basic task to store:', newTask);
    
    // Показываем сообщение об успехе
    Alert.alert(
      'Задача создана',
      `Вы сказали: "${taskTitle}"`,
      [
        { 
          text: 'OK', 
          onPress: () => {
            setTranscript('');
            setProcessingTask(false);
            // Используем replace вместо push для обновления состояния экрана
            router.replace('/');
          }
        }
      ]
    );
  };
  
  // Add automatic task creation when voice input is completed
  useEffect(() => {
    if (transcript.trim() && !isRecording && recordingState === 'processing' && !processingTask) {
      // Auto-create task after a short delay to give user time to see transcription
      const timer = setTimeout(() => {
        createTaskFromVoice();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [transcript, isRecording, recordingState, processingTask]);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        )}
        
        {!speechRecognitionSupported && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#FF0000" />
            <Text style={[styles.errorText, { color: '#000000' }]}>
              Распознавание речи не поддерживается на вашем устройстве
            </Text>
          </View>
        )}
        
        {!permissionGranted && speechRecognitionSupported && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="mic-off" size={48} color="#FF0000" />
            <Text style={[styles.errorText, { color: '#000000' }]}>
              Требуется разрешение на использование микрофона
            </Text>
            <TouchableOpacity 
              style={[styles.permissionButton, { backgroundColor: '#000000' }]}
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
        
        {/* Voice recording status text */}
        <Text style={styles.statusText}>
          {processingTask ? 
            processingState === 'parsing' ? '' :
            processingState === 'creating' ? 'Создание задачи...' :
            processingState === 'error' ? 'Произошла ошибка...' :
            'Обработка...' 
            : 
            isRecording ? 'Говорите...' : 
            'Нажмите на кнопку для записи голоса'}
        </Text>
        
        {/* Animated mic button only */}
        <View style={styles.animationContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleRecording}
            disabled={processingTask}
            style={styles.buttonWrapper}
          >
            {/* Основная анимированная капсула/круг */}
            <Animated.View 
              style={[
                styles.voiceCircle, 
                { 
                  width: processingTask ? 300 : 200,
                  height: processingTask ? 60 : 200,
                  borderRadius: processingTask ? 30 : 100,
                  transform: [
                    { scale: !processingTask ? Animated.multiply(
                      Animated.multiply(
                        pulseAnim,
                        voiceScale
                      ),
                      buttonScale
                    ) : 1 }
                  ],
                  backgroundColor: '#000000',
                  borderColor: isRecording ? '#FF0000' : 'transparent',
                  borderWidth: isRecording ? 3 : 0,
                }
              ]}
            >
              {isRecording && !processingTask && (
                <Animated.View 
                  style={[
                    styles.innerPulse, 
                    { 
                      transform: [{ scale: voiceScale }],
                      backgroundColor: 'rgba(255, 0, 0, 0.2)', 
                      width: 200,
                      height: 200,
                      borderRadius: 100,
                    }
                  ]} 
                />
              )}
              
              {!processingTask && (
                <MaterialIcons name="mic" size={50} color="#FFFFFF" />
              )}
              
              {processingTask && (
                <Text style={styles.processingLabel}>Обработка...</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
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
          renderLoading={() => <ActivityIndicator size="large" color="#000000" />}
          onError={(syntheticEvent: any) => {
            console.error('WebView error:', syntheticEvent.nativeEvent);
          }}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.backButtonFloating}
        onPress={() => router.back()}
      >
        <MaterialIcons name="arrow-back" size={24} color="#000000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    marginHorizontal: 20,
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
  statusText: {
    marginVertical: 20,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  animationContainer: {
    position: 'relative',
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  voiceCircle: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerPulse: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  webviewContainer: {
    position: 'absolute',
    height: 1,
    width: 1,
    opacity: 0,
  },
  processingCapsule: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 10,
  },
  capsuleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  processingLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButtonFloating: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 100,
  },
}); 