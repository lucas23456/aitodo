import * as TaskManager from 'expo-task-manager';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Определяем константы для наших задач
export const BACKGROUND_ALARM_TASK = 'BACKGROUND_ALARM_TASK';
export const NOTIFICATION_CHANNEL_ID = 'alarm-channel';

// Настраиваем обработчик уведомлений для показа уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Настраиваем канал уведомлений для Android
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Alarm Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    lightColor: '#FF231F7C',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
}

// Функция для запроса разрешений на уведомления
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// Функция для планирования будильника с уведомлением
export const scheduleAlarmNotification = async (targetTime: Date) => {
  try {
    console.log(`AlarmService: Планирование будильника на ${targetTime.toLocaleString()}`);
    
    // Запрашиваем разрешения если они еще не предоставлены
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('AlarmService: Нет разрешения на отправку уведомлений');
        return false;
      }
    }
    
    // Создаем идентификатор для уведомления
    const alarmId = 'alarm-' + Date.now();
    
    // Планирование уведомления на точное время
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Будильник',
        body: 'Пора вставать!',
        sound: true, // Использовать системный звук уведомления
        data: { type: 'alarm', id: alarmId },
      },
      trigger: targetTime,
    });
    
    console.log(`AlarmService: Будильник успешно запланирован на ${targetTime.toLocaleString()}`);
    return true;
  } catch (error) {
    console.error('AlarmService: Ошибка при планировании будильника:', error);
    return false;
  }
};

// Функция для остановки звука будильника
export const stopAlarmSound = async () => {
  try {
    // Отмена всех запланированных уведомлений с типом 'alarm'
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const alarmNotifications = scheduledNotifications.filter(
      notification => notification.content.data?.type === 'alarm'
    );
    
    // Отменяем каждое уведомление будильника по идентификатору
    for (const notification of alarmNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log(`AlarmService: Отменен будильник ${notification.identifier}`);
    }
  } catch (error) {
    console.error('AlarmService: Ошибка при остановке будильника:', error);
  }
};

// Определяем алармСервис для экспорта
const AlarmService = {
  scheduleAlarmNotification,
  stopAlarmSound,
  requestNotificationPermissions
};

// Добавляем экспорт по умолчанию для соответствия требованиям маршрутизации
export default AlarmService; 