import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTodoStore, Project } from '@/store/todoStore';
import { useColorScheme } from '@/components/useColorScheme';
import CapsuleMenu from '@/components/CapsuleMenu';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import AlarmService from '@/app/services/AlarmService';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const projects = useTodoStore((state) => state.projects);
  const tasks = useTodoStore((state) => state.tasks);
  const addProject = useTodoStore((state) => state.addProject);
  const deleteProject = useTodoStore((state) => state.deleteProject);
  const deleteAllTasks = useTodoStore((state) => state.deleteAllTasks);
  const toggleDarkMode = useTodoStore((state) => state.toggleDarkMode);
  
  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  
  // Time picker state
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  
  // Audio state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [alarmSet, setAlarmSet] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  
  // Setup call modal state
  const [setupCallModalVisible, setSetupCallModalVisible] = useState(false);
  const [callName, setCallName] = useState('');
  const [callDate, setCallDate] = useState('');
  const [callTime, setCallTime] = useState('');
  const [callNotes, setCallNotes] = useState('');
  
  // Настройка обработчика уведомлений для запуска проигрывания звука
  useEffect(() => {
    // Настройка обработчика для выполнения кода при получении уведомления
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Получено уведомление:', notification?.request?.content?.data);
      
      // Воспроизводим звук только если это уведомление от будильника
      if (notification?.request?.content?.data?.type === 'alarm') {
        console.log('Запуск воспроизведения будильника по уведомлению');
        playRingtone();
      }
    });
    
    // Запрос разрешений на уведомления при монтировании компонента
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Разрешите уведомления, чтобы будильник работал правильно!');
      }
    };
    
    requestPermissions();
    
    // Проверяем, есть ли активный будильник при загрузке компонента
    const checkExistingAlarms = async () => {
      try {
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        
        // Ищем уведомления будильника
        const alarmNotifications = scheduledNotifications.filter(
          notification => notification.content.data?.type === 'alarm'
        );
        
        if (alarmNotifications.length > 0) {
          console.log('Найдены запланированные будильники:', alarmNotifications.length);
          
          // Найдем следующий будильник с наиболее ранней датой
          let nextAlarmDate: Date | null = null;
          
          for (const notification of alarmNotifications) {
            // Безопасное извлечение даты из структуры уведомления
            try {
              // Type assertion to handle notification trigger structure
              type TriggerWithDate = { date: string | number | Date };
              const trigger = notification.trigger as unknown as TriggerWithDate;
              const triggerDate = trigger && 'date' in trigger
                ? new Date(trigger.date) 
                : null;
                
              if (triggerDate && (nextAlarmDate === null || triggerDate < nextAlarmDate)) {
                nextAlarmDate = triggerDate;
              }
            } catch (e) {
              console.log('Ошибка при извлечении даты из уведомления:', e);
            }
          }
          
          if (nextAlarmDate) {
            console.log('Найден запланированный будильник на:', nextAlarmDate.toLocaleTimeString());
            
            // Обновляем состояние
            setScheduledTime(nextAlarmDate);
            setAlarmSet(true);
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке существующих будильников:', error);
      }
    };
    
    checkExistingAlarms();
    
    return () => {
      notificationSubscription.remove();
    };
  }, []);
  
  // Load and play the ringtone
  const playRingtone = async () => {
    console.log('Playing ringtone...');
    
    try {
      // Unload any previous sound
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Устанавливаем режим аудио для воспроизведения 
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Load the sound file
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/ringtone.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      // When playback finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };
  
  // Stop the ringtone
  const stopRingtone = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
    
    // Остановить фоновую задачу и уведомления
    await AlarmService.stopAlarmSound();
    setAlarmSet(false);
    setScheduledTime(null);
  };
  
  // Schedule the alarm for the selected time
  const scheduleAlarm = async (selectedDate: Date): Promise<Date> => {
    // Calculate milliseconds until the alarm should trigger
    const now = new Date();
    let targetTime = new Date(now);
    targetTime.setHours(selectedDate.getHours());
    targetTime.setMinutes(selectedDate.getMinutes());
    targetTime.setSeconds(0);
    
    // If the time is in the past (for today), schedule it for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    console.log(`Установка будильника на ${targetTime.toLocaleTimeString()}`);
    
    // Использовать новый метод планирования будильника
    const success = await AlarmService.scheduleAlarmNotification(targetTime);
    
    if (success) {
      // Save the scheduled time and mark alarm as set
      setScheduledTime(targetTime);
      setAlarmSet(true);
    } else {
      alert('Не удалось установить будильник. Проверьте разрешения приложения.');
    }
    
    return targetTime;
  };
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Unload the sound when component unmounts
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  // Setup audio mode on component mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Failed to set audio mode:', error);
      }
    };
    
    setupAudio();
  }, []);
  
  // Handle setup call
  const handleSetupCall = () => {
    // Here you would integrate with your calendar API or save the call details
    alert(`Call scheduled: ${callName} on ${callDate} at ${callTime}`);
    setSetupCallModalVisible(false);
    // Reset form
    setCallName('');
    setCallDate('');
    setCallTime('');
    setCallNotes('');
  };
  
  // Add a new project
  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
      };
      
      addProject(newProject);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectModalVisible(false);
    }
  };
  
  // Delete a project
  const handleDeleteProject = (id: string) => {
    deleteProject(id);
  };

  // Navigate to project details
  const handleViewProject = (project: Project) => {
    router.push({
      pathname: '/project-details',
      params: { id: project.id }
    });
  };
  
  // Get task count for a project
  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId).length;
  };
  
  // Get total completed task count
  const getCompletedTaskCount = () => {
    return tasks.filter(task => task.completed).length;
  };
  
  // Handle time change
  const onTimeChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || selectedTime;
    setTimePickerVisible(Platform.OS === 'ios');
    setSelectedTime(currentDate);
    
    if (Platform.OS === 'android' && event.type === 'set') {
      // For Android, schedule alarm immediately after time selection
      scheduleAlarm(currentDate).then(scheduledDate => {
        const hours = scheduledDate.getHours();
        const minutes = scheduledDate.getMinutes();
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        alert(`Звонок установлен на ${formattedTime}`);
      });
    }
  };
  
  // Format time for display
  const formatTime = (date: Date | null): string => {
    if (!date) return '';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Handle delete all tasks
  const handleDeleteAllTasks = () => {
    Alert.alert(
      'Delete All Tasks',
      'Are you sure you want to delete all tasks? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: () => {
            deleteAllTasks();
            Alert.alert('Success', 'All tasks have been deleted.');
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* User Profile Section */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colorScheme === 'dark' ? colors.card : 'white' }]}>
                JD
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>John Doe</Text>
              <Text style={[styles.profileEmail, { color: colors.secondaryText }]}>john.doe@example.com</Text>
            </View>
          </View>
          
          {/* Setup Call Button with Alarm Status */}
          <View style={styles.alarmContainer}>
            <TouchableOpacity 
              style={[styles.setupCallButton, { backgroundColor: alarmSet ? colors.success : colors.primary }]}
              onPress={() => setTimePickerVisible(true)}
            >
              <MaterialIcons name={alarmSet ? "alarm-on" : "call"} size={20} color="#FFFFFF" />
              <Text style={styles.setupCallText}>
                {alarmSet ? `Звонок в ${formatTime(scheduledTime)}` : "Настроить звонок"}
              </Text>
            </TouchableOpacity>
            
            {isPlaying && (
              <TouchableOpacity 
                style={[styles.stopButton, { backgroundColor: colors.error }]}
                onPress={stopRingtone}
              >
                <MaterialIcons name="stop" size={20} color="#FFFFFF" />
                <Text style={styles.setupCallText}>Остановить</Text>
              </TouchableOpacity>
            )}
            
            {alarmSet && !isPlaying && (
              <TouchableOpacity 
                style={[styles.stopButton, { backgroundColor: colors.error }]}
                onPress={stopRingtone}
              >
                <MaterialIcons name="cancel" size={20} color="#FFFFFF" />
                <Text style={styles.setupCallText}>Отменить будильник</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={[styles.statsContainer, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{projects.length}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Projects</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {tasks.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Tasks</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{getCompletedTaskCount()}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Completed</Text>
            </View>
          </View>
        </View>
        
        {/* Projects Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Projects</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setNewProjectModalVisible(true)}
          >
            <MaterialIcons name="add" size={20} color={colorScheme === 'dark' ? colors.card : 'white'} />
          </TouchableOpacity>
        </View>
        
        {projects.length === 0 ? (
          <View style={[styles.emptyProjectsCard, { backgroundColor: colors.card }]}>
            <MaterialIcons name="folder" size={48} color={colors.secondaryText} />
            <Text style={[styles.emptyProjectsText, { color: colors.secondaryText }]}>
              No projects yet. Create your first project!
            </Text>
          </View>
        ) : (
          projects.map(project => (
            <View 
              key={project.id} 
              style={[styles.projectCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.projectHeader}>
                <View style={[styles.projectColor, { backgroundColor: project.color }]} />
                <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteProject(project.id)}>
                  <MaterialIcons name="delete-outline" size={22} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.projectDescription, { color: colors.secondaryText }]}>
                {project.description}
              </Text>
              
              <View style={styles.projectFooter}>
                <View style={styles.projectStat}>
                  <MaterialIcons name="assignment" size={16} color={colors.secondaryText} />
                  <Text style={[styles.projectStatText, { color: colors.secondaryText }]}>
                    {getProjectTaskCount(project.id)} tasks
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.viewProjectButton}
                  onPress={() => handleViewProject(project)}
                >
                  <Text style={[styles.viewProjectText, { color: colors.primary }]}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        
        {/* Settings Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
        </View>
        
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          {/* Dark Mode Setting */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={toggleDarkMode}
          >
            <View style={styles.settingLabelContainer}>
              <MaterialIcons 
                name={isDarkMode ? "nightlight-round" : "wb-sunny"} 
                size={22} 
                color={colors.text} 
              />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <View style={[
              styles.toggleSwitch, 
              { backgroundColor: isDarkMode ? colors.primary : colors.gray }
            ]}>
              <View style={[
                styles.toggleKnob, 
                { transform: [{ translateX: isDarkMode ? 20 : 0 }] }
              ]} />
            </View>
          </TouchableOpacity>
          
          {/* Delete All Tasks Setting */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleDeleteAllTasks}
          >
            <View style={styles.settingLabelContainer}>
              <MaterialIcons 
                name="delete-forever" 
                size={22} 
                color={colors.danger} 
              />
              <Text style={[styles.settingLabel, { color: colors.danger }]}>
                Delete All Tasks
              </Text>
            </View>
            <MaterialIcons 
              name="chevron-right" 
              size={22} 
              color={colors.danger} 
            />
          </TouchableOpacity>
          
          {/* Task Statistics */}
          <View style={styles.settingStatsRow}>
            <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
              You have {tasks.length} tasks total, {getCompletedTaskCount()} completed
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* New Project Modal */}
      <Modal
        visible={newProjectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewProjectModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Project</Text>
              <TouchableOpacity onPress={() => setNewProjectModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Project Name</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F5F5F5',
                  color: colors.text,
                  borderColor: colors.border 
                }
              ]}
              placeholder="Enter project name"
              placeholderTextColor={colors.secondaryText}
              value={newProjectName}
              onChangeText={setNewProjectName}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea,
                { 
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F5F5F5',
                  color: colors.text,
                  borderColor: colors.border 
                }
              ]}
              placeholder="Enter project description"
              placeholderTextColor={colors.secondaryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={newProjectDescription}
              onChangeText={setNewProjectDescription}
            />
            
            <TouchableOpacity 
              style={[
                styles.addProjectButton, 
                { 
                  backgroundColor: newProjectName.trim() ? colors.primary : colors.lightGray 
                }
              ]}
              onPress={handleAddProject}
              disabled={!newProjectName.trim()}
            >
              <Text 
                style={[
                  styles.addProjectButtonText, 
                  { 
                    color: newProjectName.trim() 
                      ? colorScheme === 'dark' ? colors.card : 'white' 
                      : colors.secondaryText 
                  }
                ]}
              >
                Create Project
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Time Picker for iOS */}
      {Platform.OS === 'ios' && timePickerVisible && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={timePickerVisible}
          onRequestClose={() => setTimePickerVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Выберите время звонка</Text>
                <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                  <MaterialIcons name="close" size={24} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                style={{ width: '100%' }}
              />
              
              <TouchableOpacity 
                style={[styles.addProjectButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  scheduleAlarm(selectedTime).then(scheduledDate => {
                    const hours = scheduledDate.getHours();
                    const minutes = scheduledDate.getMinutes();
                    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    alert(`Звонок установлен на ${formattedTime}`);
                    setTimePickerVisible(false);
                  });
                }}
              >
                <Text style={styles.addProjectButtonText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Time Picker for Android */}
      {Platform.OS === 'android' && timePickerVisible && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}
      
      <CapsuleMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  profileCard: {
    borderRadius: 16,
    marginHorizontal: 8,
    marginTop: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  alarmContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  projectDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectStatText: {
    fontSize: 12,
    marginLeft: 4,
  },
  viewProjectButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewProjectText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addProjectButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addProjectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyProjectsCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProjectsText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  setupCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 0,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  setupCallText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  settingsCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingStatsRow: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  settingDescription: {
    fontSize: 14,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
}); 